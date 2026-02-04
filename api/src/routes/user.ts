import { Router, Request } from 'express';
import { getDb, t } from '../db.js';
import { getUser, getUserId } from '../auth/index.js';

const router = Router();

// GET /api/me - Get current user info
router.get('/', (req: Request, res) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Transform to match frontend User type
  res.json({
    id: user.user_id,
    email: user.email,
    roles: user.roles || [],
  });
});

// GET /api/me/favorites - Get user's favorite locations
router.get('/favorites', async (req: Request, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const sql = getDb();
    const favorites = await sql.unsafe(`
      SELECT
        l.*,
        f.created_at as favorited_at,
        COALESCE(
          (SELECT json_agg(json_build_object('id', tg.id, 'kind', tg.kind, 'name', tg.name, 'slug', tg.slug))
           FROM ${t('location_tags')} lt
           JOIN ${t('tags')} tg ON lt.tag_id = tg.id
           WHERE lt.location_id = l.id),
          '[]'
        ) as tags
      FROM ${t('favorites')} f
      JOIN ${t('locations')} l ON f.location_id = l.id
      WHERE f.user_id = '${userId}'
      ORDER BY f.created_at DESC
    `);

    res.json(favorites);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// POST /api/me/favorites/:locationId - Add to favorites
router.post('/favorites/:locationId', async (req: Request, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { locationId } = req.params;
    const sql = getDb();

    // Check if already favorited
    const existing = await sql`
      SELECT user_id FROM ${sql(t('favorites'))}
      WHERE user_id = ${userId} AND location_id = ${locationId}
    `;

    if (existing.length > 0) {
      return res.json({ message: 'Already favorited' });
    }

    await sql`
      INSERT INTO ${sql(t('favorites'))} (user_id, location_id, created_at)
      VALUES (${userId}, ${locationId}, ${new Date().toISOString()})
    `;

    res.status(201).json({ message: 'Added to favorites' });
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// DELETE /api/me/favorites/:locationId - Remove from favorites
router.delete('/favorites/:locationId', async (req: Request, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { locationId } = req.params;
    const sql = getDb();

    await sql`
      DELETE FROM ${sql(t('favorites'))}
      WHERE user_id = ${userId} AND location_id = ${locationId}
    `;

    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

export { router as userRoutes };
