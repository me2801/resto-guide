import { Router } from 'express';
import { getDb, t } from '../db.js';

const router = Router();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/cities
router.get('/cities', async (_req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT city, COUNT(*)::int AS count
      FROM ${sql(t('locations'))}
      WHERE city IS NOT NULL AND city <> ''
      GROUP BY city
      ORDER BY count DESC, city ASC
      LIMIT 5
    `;
    const cities = rows.map((row: any) => {
      const slug = slugify(String(row.city));
      return { id: slug, name: row.city, slug };
    });
    res.json(cities);
  } catch (err) {
    console.error('Error fetching cities:', err);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// GET /api/tags
router.get('/tags', async (_req, res) => {
  try {
    const sql = getDb();
    const tags = await sql`
      SELECT id, kind, name, slug
      FROM ${sql(t('tags'))}
      ORDER BY kind, name
    `;
    res.json(tags);
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/locations
router.get('/locations', async (req, res) => {
  try {
    const { city, bbox, tag_slugs, price_min, price_max } = req.query;
    const sql = getDb();

    // Build dynamic conditions
    const conditions: string[] = ['l.is_published = true'];
    const citySlug = city && typeof city === 'string' ? slugify(city) : null;

    // Filter by bounding box
    if (bbox && typeof bbox === 'string') {
      const [west, south, east, north] = bbox.split(',').map(Number);
      if (!isNaN(west) && !isNaN(south) && !isNaN(east) && !isNaN(north)) {
        conditions.push(`l.lng >= ${west} AND l.lng <= ${east} AND l.lat >= ${south} AND l.lat <= ${north}`);
      }
    }

    // Filter by price range
    if (price_min && typeof price_min === 'string') {
      conditions.push(`l.price_level >= ${parseInt(price_min, 10)}`);
    }
    if (price_max && typeof price_max === 'string') {
      conditions.push(`l.price_level <= ${parseInt(price_max, 10)}`);
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : 'true';

    // Main query with joins
    const locations = (await sql.unsafe(`
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
      WHERE ${whereClause}
      ORDER BY l.featured_rank ASC NULLS LAST, l.name
    `)) as any[];

    // Filter by city (post-query for consistent slugging)
    let result: any[] = locations;
    if (citySlug) {
      result = result.filter((loc: any) => {
        if (!loc.city) return false;
        return slugify(String(loc.city)) === citySlug;
      });
    }

    // Filter by tags (post-query)
    if (tag_slugs && typeof tag_slugs === 'string') {
      const requestedSlugs = tag_slugs.split(',');
      result = result.filter((loc: any) => {
        const locTagSlugs = loc.tags?.map((t: any) => t.slug) || [];
        return requestedSlugs.some(slug => locTagSlugs.includes(slug));
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// GET /api/locations/:id
router.get('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
      WHERE l.id = '${id}'
    `);

    if (locations.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(locations[0]);
  } catch (err) {
    console.error('Error fetching location:', err);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

export { router as publicRoutes };
