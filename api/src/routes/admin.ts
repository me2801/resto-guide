import { Router } from 'express';
import { getDb, t } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadImage, deleteImage, ensureBucket, getStorageInfo, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '../storage.js';

const router = Router();

function normalizePostcode(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

function parsePoint(value: string | null | undefined): { lat: number; lng: number } | null {
  if (!value) return null;
  const match = /POINT\(([-0-9.]+)\s+([-0-9.]+)\)/.exec(value);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

function formatAddress(input: {
  street?: string | null;
  house_number?: string | null;
  house_number_addition?: string | null;
  postcode?: string | null;
  city?: string | null;
}): string | null {
  const streetLine = [
    input.street,
    input.house_number ? `${input.house_number}${input.house_number_addition || ''}` : null,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const cityLine = [input.postcode, input.city].filter(Boolean).join(' ').trim();
  const parts = [streetLine, cityLine].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

// ============ TAGS ============

// POST /api/admin/tags
router.post('/tags', async (req, res) => {
  try {
    const { kind, name, slug } = req.body;
    if (!kind || !name || !slug) {
      return res.status(400).json({ error: 'kind, name, and slug are required' });
    }
    if (!['cuisine', 'vibe'].includes(kind)) {
      return res.status(400).json({ error: 'kind must be "cuisine" or "vibe"' });
    }

    const sql = getDb();
    const id = uuidv4();
    const result = await sql`
      INSERT INTO ${sql(t('tags'))} (id, kind, name, slug)
      VALUES (${id}, ${kind}, ${name}, ${slug})
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (err) {
    console.error('Error creating tag:', err);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// PUT /api/admin/tags/:id
router.put('/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { kind, name, slug } = req.body;
    const sql = getDb();

    // Build update dynamically
    const updates: string[] = [];
    if (kind !== undefined) updates.push(`kind = '${kind}'`);
    if (name !== undefined) updates.push(`name = '${name}'`);
    if (slug !== undefined) updates.push(`slug = '${slug}'`);

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const result = await sql.unsafe(`
      UPDATE ${t('tags')}
      SET ${updates.join(', ')}
      WHERE id = '${id}'
      RETURNING *
    `);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(result[0]);
  } catch (err) {
    console.error('Error updating tag:', err);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// DELETE /api/admin/tags/:id
router.delete('/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = getDb();

    // First delete location_tags references
    await sql`DELETE FROM ${sql(t('location_tags'))} WHERE tag_id = ${id}`;
    await sql`DELETE FROM ${sql(t('tags'))} WHERE id = ${id}`;

    res.json({ message: 'Tag deleted' });
  } catch (err) {
    console.error('Error deleting tag:', err);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// ============ ADDRESS LOOKUP (PDOK) ============

// GET /api/admin/address-lookup
router.get('/address-lookup', async (req, res) => {
  try {
    const { postcode, house_number, house_number_addition } = req.query;

    if (!postcode || !house_number) {
      return res.status(400).json({ error: 'postcode and house_number are required' });
    }

    const normalizedPostcode = normalizePostcode(String(postcode));
    const normalizedHouseNumber = String(house_number).trim();
    const normalizedAddition = house_number_addition ? String(house_number_addition).trim() : '';

    const query = `${normalizedPostcode} ${normalizedHouseNumber}${normalizedAddition}`;
    const url = new URL('https://api.pdok.nl/bzk/locatieserver/search/v3_1/free');
    url.searchParams.set('q', query);
    url.searchParams.set('fq', 'type:adres');
    url.searchParams.set('rows', '1');
    url.searchParams.set(
      'fl',
      [
        'straatnaam',
        'woonplaatsnaam',
        'postcode',
        'huisnummer',
        'huisletter',
        'huisnummertoevoeging',
        'centroide_ll',
        'weergavenaam',
      ].join(' ')
    );

    const response = await fetch(url.toString());
    if (!response.ok) {
      return res.status(502).json({ error: 'Locatieserver request failed' });
    }

    const data = (await response.json()) as any;
    const doc = data?.response?.docs?.[0];
    if (!doc) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const point = parsePoint(doc.centroide_ll);
    const additionParts = [doc.huisletter, doc.huisnummertoevoeging].filter(Boolean);
    const addition = additionParts.join('');

    const result = {
      street: doc.straatnaam || null,
      city: doc.woonplaatsnaam || null,
      postcode: doc.postcode || normalizedPostcode,
      house_number: String(doc.huisnummer ?? normalizedHouseNumber),
      house_number_addition: addition || null,
      lat: point?.lat ?? null,
      lng: point?.lng ?? null,
      address:
        doc.weergavenaam ||
        formatAddress({
          street: doc.straatnaam,
          house_number: String(doc.huisnummer ?? normalizedHouseNumber),
          house_number_addition: addition || null,
          postcode: doc.postcode || normalizedPostcode,
          city: doc.woonplaatsnaam || null,
        }),
    };

    res.json(result);
  } catch (err) {
    console.error('Address lookup error:', err);
    res.status(500).json({ error: 'Address lookup failed' });
  }
});

// ============ LOCATIONS ============

// GET /api/admin/locations
router.get('/locations', async (_req, res) => {
  try {
    const sql = getDb();

    const locations = await sql.unsafe(`
      SELECT
        l.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', tg.id, 'kind', tg.kind, 'name', tg.name, 'slug', tg.slug))
           FROM ${t('location_tags')} lt
           JOIN ${t('tags')} tg ON lt.tag_id = tg.id
           WHERE lt.location_id = l.id),
          '[]'
        ) as tags
      FROM ${t('locations')} l
      ORDER BY l.featured_rank ASC NULLS LAST, l.name
    `);

    res.json(locations);
  } catch (err) {
    console.error('Error fetching admin locations:', err);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// POST /api/admin/locations
router.post('/locations', async (req, res) => {
  try {
    const {
      city, street, house_number, house_number_addition, postcode,
      name, slug, description, why_curated,
      price_level, lat, lng, address, hero_image_url,
      gallery_urls, is_published, featured_rank, tag_ids
    } = req.body;

    const normalizedPostcode = postcode ? normalizePostcode(String(postcode)) : null;

    if (!name || !slug) {
      return res.status(400).json({ error: 'name and slug are required' });
    }

    const sql = getDb();
    const id = uuidv4();

    const computedAddress =
      address ?? formatAddress({ street, house_number, house_number_addition, postcode: normalizedPostcode, city });

    const result = await sql`
      INSERT INTO ${sql(t('locations'))} (
        id, city, street, house_number, house_number_addition, postcode,
        name, slug, description, why_curated,
        price_level, lat, lng, address, hero_image_url,
        gallery_urls, is_published, featured_rank, created_at
      ) VALUES (
        ${id}, ${city || null}, ${street || null}, ${house_number || null}, ${house_number_addition || null}, ${normalizedPostcode || null},
        ${name}, ${slug}, ${description || null}, ${why_curated || null},
        ${price_level || null}, ${lat || null}, ${lng || null}, ${computedAddress || null}, ${hero_image_url || null},
        ${gallery_urls || []}, ${is_published ?? false}, ${featured_rank || null}, ${new Date().toISOString()}
      )
      RETURNING *
    `;

    // Add tags if provided
    if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
      for (const tag_id of tag_ids) {
        await sql`
          INSERT INTO ${sql(t('location_tags'))} (location_id, tag_id)
          VALUES (${id}, ${tag_id})
        `;
      }
    }

    res.status(201).json(result[0]);
  } catch (err) {
    console.error('Error creating location:', err);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// PUT /api/admin/locations/:id
router.put('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      city, street, house_number, house_number_addition, postcode,
      name, slug, description, why_curated,
      price_level, lat, lng, address, hero_image_url,
      gallery_urls, is_published, featured_rank, tag_ids
    } = req.body;

    const sql = getDb();

    const normalizedPostcode =
      postcode === undefined ? undefined : postcode === null ? null : normalizePostcode(String(postcode));

    // Build update dynamically
    const updates: string[] = [];
    if (city !== undefined) updates.push(`city = ${city === null ? 'NULL' : `'${city}'`}`);
    if (street !== undefined) updates.push(`street = ${street === null ? 'NULL' : `'${street}'`}`);
    if (house_number !== undefined) updates.push(`house_number = ${house_number === null ? 'NULL' : `'${house_number}'`}`);
    if (house_number_addition !== undefined) updates.push(`house_number_addition = ${house_number_addition === null ? 'NULL' : `'${house_number_addition}'`}`);
    if (normalizedPostcode !== undefined) {
      updates.push(`postcode = ${normalizedPostcode === null ? 'NULL' : `'${normalizedPostcode}'`}`);
    }
    if (name !== undefined) updates.push(`name = '${name}'`);
    if (slug !== undefined) updates.push(`slug = '${slug}'`);
    if (description !== undefined) updates.push(`description = ${description === null ? 'NULL' : `'${description}'`}`);
    if (why_curated !== undefined) updates.push(`why_curated = ${why_curated === null ? 'NULL' : `'${why_curated}'`}`);
    if (price_level !== undefined) updates.push(`price_level = ${price_level === null ? 'NULL' : price_level}`);
    if (lat !== undefined) updates.push(`lat = ${lat === null ? 'NULL' : lat}`);
    if (lng !== undefined) updates.push(`lng = ${lng === null ? 'NULL' : lng}`);
    if (address !== undefined) updates.push(`address = ${address === null ? 'NULL' : `'${address}'`}`);
    if (hero_image_url !== undefined) updates.push(`hero_image_url = ${hero_image_url === null ? 'NULL' : `'${hero_image_url}'`}`);
    if (gallery_urls !== undefined) updates.push(`gallery_urls = '${JSON.stringify(gallery_urls)}'`);
    if (is_published !== undefined) updates.push(`is_published = ${is_published}`);
    if (featured_rank !== undefined) updates.push(`featured_rank = ${featured_rank === null ? 'NULL' : featured_rank}`);

    let result;
    if (updates.length > 0) {
      result = await sql.unsafe(`
        UPDATE ${t('locations')}
        SET ${updates.join(', ')}
        WHERE id = '${id}'
        RETURNING *
      `);
    } else {
      result = await sql.unsafe(`SELECT * FROM ${t('locations')} WHERE id = '${id}'`);
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Update tags if provided
    if (tag_ids !== undefined && Array.isArray(tag_ids)) {
      await sql`DELETE FROM ${sql(t('location_tags'))} WHERE location_id = ${id}`;
      for (const tag_id of tag_ids) {
        await sql`
          INSERT INTO ${sql(t('location_tags'))} (location_id, tag_id)
          VALUES (${id}, ${tag_id})
        `;
      }
    }

    res.json(result[0]);
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// DELETE /api/admin/locations/:id
router.delete('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = getDb();

    // Delete related records first
    await sql`DELETE FROM ${sql(t('location_tags'))} WHERE location_id = ${id}`;
    await sql`DELETE FROM ${sql(t('favorites'))} WHERE location_id = ${id}`;
    await sql`DELETE FROM ${sql(t('locations'))} WHERE id = ${id}`;

    res.json({ message: 'Location deleted' });
  } catch (err) {
    console.error('Error deleting location:', err);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

// ============ STORAGE / UPLOADS ============

// GET /api/admin/storage/info
router.get('/storage/info', (_req, res) => {
  res.json(getStorageInfo());
});

// POST /api/admin/upload
// Accepts multipart/form-data with 'file' field and optional 'folder' field
router.post('/upload', async (req, res) => {
  try {
    // Ensure bucket exists
    await ensureBucket();

    // Check content type
    const contentType = req.headers['content-type'] || '';

    // Handle base64 upload (for simple clients)
    if (contentType.includes('application/json')) {
      const { file, mimeType, folder } = req.body;

      if (!file || !mimeType) {
        return res.status(400).json({ error: 'file (base64) and mimeType are required' });
      }

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return res.status(400).json({ error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` });
      }

      // Decode base64
      const buffer = Buffer.from(file, 'base64');

      if (buffer.length > MAX_FILE_SIZE) {
        return res.status(400).json({ error: `File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB` });
      }

      const url = await uploadImage(buffer, mimeType, folder || 'general');

      return res.json({ url });
    }

    // Handle raw binary upload with headers
    const mimeType = req.headers['x-file-type'] as string;
    const folder = (req.headers['x-folder'] as string) || 'general';

    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({
        error: `Invalid or missing X-File-Type header. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      });
    }

    // If express.raw parsed the body, use it directly (avoids hanging on an already-consumed stream)
    if (Buffer.isBuffer(req.body)) {
      if (req.body.length === 0) {
        return res.status(400).json({ error: 'Empty upload body' });
      }
      if (req.body.length > MAX_FILE_SIZE) {
        return res.status(400).json({ error: `File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB` });
      }

      const url = await uploadImage(req.body, mimeType, folder);
      return res.json({ url });
    }

    // Collect raw body from stream (for clients that bypass express.raw)
    const chunks: Buffer[] = [];
    let totalSize = 0;

    req.on('data', (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > MAX_FILE_SIZE) {
        res.status(400).json({ error: `File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB` });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', async () => {
      if (res.headersSent) return;

      try {
        const buffer = Buffer.concat(chunks);
        if (buffer.length === 0) {
          return res.status(400).json({ error: 'Empty upload body' });
        }
        const url = await uploadImage(buffer, mimeType, folder);
        res.json({ url });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    req.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// DELETE /api/admin/upload
// Delete an image by URL
router.delete('/upload', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    await deleteImage(url);
    res.json({ message: 'Image deleted' });
  } catch (err: any) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message || 'Delete failed' });
  }
});

export { router as adminRoutes };
