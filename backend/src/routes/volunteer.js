import express from 'express';
import pool from '../config/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('volunteer'));

router.get('/dashboard', async (req, res) => {
  try {
    const [profile] = await pool.query(
      `SELECT vp.*, u.name, u.phone FROM volunteer_profiles vp
       JOIN users u ON vp.user_id = u.id WHERE vp.user_id = ?`,
      [req.user.id]
    );

    const [pendingRequests] = await pool.query(
      `SELECT ar.*, st.name as service_name, st.slug as service_slug, st.icon as service_icon,
              cu.name as customer_name, cu.phone as customer_phone
       FROM assistance_requests ar
       JOIN service_types st ON ar.service_type_id = st.id
       JOIN users cu ON ar.customer_id = cu.id
       WHERE ar.status = 'pending' AND ar.volunteer_id IS NULL
       ORDER BY ar.created_at DESC LIMIT 20`
    );

    const [activeJobs] = await pool.query(
      `SELECT ar.*, st.name as service_name, st.icon as service_icon,
              cu.name as customer_name, cu.phone as customer_phone
       FROM assistance_requests ar
       JOIN service_types st ON ar.service_type_id = st.id
       JOIN users cu ON ar.customer_id = cu.id
       WHERE ar.volunteer_id = ? AND ar.status IN ('accepted', 'en_route', 'in_progress')
       ORDER BY ar.created_at DESC`,
      [req.user.id]
    );

    const [completedJobs] = await pool.query(
      `SELECT COUNT(*) as count FROM assistance_requests
       WHERE volunteer_id = ? AND status = 'completed'`,
      [req.user.id]
    );

    res.json({
      profile: profile[0] || null,
      pendingRequests,
      activeJobs,
      stats: {
        completedJobs: completedJobs[0]?.count || 0,
        activeJobs: activeJobs.length,
        pendingNearby: pendingRequests.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.patch('/availability', async (req, res) => {
  try {
    const { is_available } = req.body;
    await pool.query('UPDATE volunteer_profiles SET is_available = ? WHERE user_id = ?', [
      !!is_available,
      req.user.id,
    ]);
    res.json({ is_available: !!is_available });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

router.patch('/location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    await pool.query(
      'UPDATE volunteer_profiles SET current_latitude = ?, current_longitude = ? WHERE user_id = ?',
      [latitude, longitude, req.user.id]
    );
    res.json({ message: 'Location updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

export default router;
