import express from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [vehicles] = await pool.query(
      'SELECT * FROM vehicles WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    res.json({ vehicles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { make, model, year, license_plate, color, fuel_type, is_default } = req.body;
    if (!make || !model || !license_plate) {
      return res.status(400).json({ error: 'Make, model, and license plate are required' });
    }

    if (is_default) {
      await pool.query('UPDATE vehicles SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
    }

    const [result] = await pool.query(
      `INSERT INTO vehicles (user_id, make, model, year, license_plate, color, fuel_type, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, make, model, year || null, license_plate, color || null, fuel_type || 'petrol', !!is_default]
    );

    const [vehicles] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [result.insertId]);
    res.status(201).json({ vehicle: vehicles[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { make, model, year, license_plate, color, fuel_type, is_default } = req.body;

    const [existing] = await pool.query('SELECT * FROM vehicles WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing.length) return res.status(404).json({ error: 'Vehicle not found' });

    if (is_default) {
      await pool.query('UPDATE vehicles SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
    }

    await pool.query(
      `UPDATE vehicles SET make=?, model=?, year=?, license_plate=?, color=?, fuel_type=?, is_default=?
       WHERE id=? AND user_id=?`,
      [make, model, year, license_plate, color, fuel_type, !!is_default, id, req.user.id]
    );

    const [vehicles] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    res.json({ vehicle: vehicles[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM vehicles WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

export default router;
