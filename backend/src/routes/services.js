import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const [services] = await pool.query(
      'SELECT id, slug, name, description, base_price, icon FROM service_types WHERE is_active = TRUE'
    );
    res.json({ services });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

export default router;
