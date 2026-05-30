import express from 'express';
import pool from '../config/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/dashboard', async (_req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM users WHERE role = 'volunteer') as total_volunteers,
        (SELECT COUNT(*) FROM assistance_requests) as total_requests,
        (SELECT COUNT(*) FROM assistance_requests WHERE status = 'pending') as pending_requests,
        (SELECT COUNT(*) FROM assistance_requests WHERE status IN ('accepted','en_route','in_progress')) as active_requests,
        (SELECT COUNT(*) FROM assistance_requests WHERE status = 'completed') as completed_requests,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'success') as total_revenue
    `);

    const [recentRequests] = await pool.query(`
      SELECT ar.*, st.name as service_name, cu.name as customer_name, vu.name as volunteer_name
      FROM assistance_requests ar
      JOIN service_types st ON ar.service_type_id = st.id
      JOIN users cu ON ar.customer_id = cu.id
      LEFT JOIN users vu ON ar.volunteer_id = vu.id
      ORDER BY ar.created_at DESC LIMIT 15
    `);

    const [serviceBreakdown] = await pool.query(`
      SELECT st.name, COUNT(ar.id) as count
      FROM service_types st
      LEFT JOIN assistance_requests ar ON st.id = ar.service_type_id
      GROUP BY st.id, st.name
    `);

    const [volunteers] = await pool.query(`
      SELECT u.id, u.name, u.phone, vp.is_available, vp.rating, vp.total_jobs
      FROM users u
      JOIN volunteer_profiles vp ON u.id = vp.user_id
      ORDER BY vp.total_jobs DESC
    `);

    res.json({
      stats: stats[0],
      recentRequests,
      serviceBreakdown,
      volunteers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load admin dashboard' });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, phone, name, email, role, is_verified, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
