import express from 'express';
import pool from '../config/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { generateRequestCode } from '../utils/helpers.js';

const router = express.Router();

function emitTracking(io, requestId, data) {
  if (io) {
    io.to(`request:${requestId}`).emit('tracking:update', data);
    io.to('volunteers').emit('request:update', data);
    io.to('admin').emit('request:update', data);
  }
}

router.use(authenticate);

router.post('/', requireRole('customer', 'admin'), async (req, res) => {
  try {
    const { service_type_id, vehicle_id, latitude, longitude, address, notes } = req.body;

    if (!service_type_id || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Service type and location are required' });
    }

    const [serviceTypes] = await pool.query('SELECT * FROM service_types WHERE id = ?', [service_type_id]);
    if (!serviceTypes.length) return res.status(400).json({ error: 'Invalid service type' });

    const requestCode = generateRequestCode();
    const estimatedPrice = serviceTypes[0].base_price;

    const [result] = await pool.query(
      `INSERT INTO assistance_requests
       (request_code, customer_id, vehicle_id, service_type_id, latitude, longitude, address, notes, estimated_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestCode,
        req.user.id,
        vehicle_id || null,
        service_type_id,
        latitude,
        longitude,
        address || null,
        notes || null,
        estimatedPrice,
      ]
    );

    const requestId = result.insertId;

    await pool.query(
      'INSERT INTO request_tracking (request_id, status, latitude, longitude, message) VALUES (?, ?, ?, ?, ?)',
      [requestId, 'pending', latitude, longitude, 'Request submitted. Finding nearby volunteer...']
    );

    const io = req.app.get('io');
    emitTracking(io, requestId, { requestId, status: 'pending' });
    io?.to('volunteers').emit('request:new', { requestId });

    const [requests] = await pool.query(
      `SELECT ar.*, st.name as service_name, st.slug as service_slug, st.icon as service_icon
       FROM assistance_requests ar
       JOIN service_types st ON ar.service_type_id = st.id
       WHERE ar.id = ?`,
      [requestId]
    );

    res.status(201).json({ request: requests[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

router.get('/my', async (req, res) => {
  try {
    let query = `
      SELECT ar.*, st.name as service_name, st.slug as service_slug, st.icon as service_icon,
             u.name as volunteer_name, u.phone as volunteer_phone,
             v.make, v.model, v.license_plate
      FROM assistance_requests ar
      JOIN service_types st ON ar.service_type_id = st.id
      LEFT JOIN users u ON ar.volunteer_id = u.id
      LEFT JOIN vehicles v ON ar.vehicle_id = v.id
    `;
    const params = [];

    if (req.user.role === 'customer') {
      query += ' WHERE ar.customer_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'volunteer') {
      query += ' WHERE ar.volunteer_id = ? OR (ar.status = "pending" AND ar.volunteer_id IS NULL)';
      params.push(req.user.id);
    }

    query += ' ORDER BY ar.created_at DESC';

    const [requests] = await pool.query(query, params);
    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT ar.*, st.name as service_name, st.slug as service_slug, st.icon as service_icon,
              cu.name as customer_name, cu.phone as customer_phone,
              vu.name as volunteer_name, vu.phone as volunteer_phone,
              v.make, v.model, v.license_plate, v.color
       FROM assistance_requests ar
       JOIN service_types st ON ar.service_type_id = st.id
       JOIN users cu ON ar.customer_id = cu.id
       LEFT JOIN users vu ON ar.volunteer_id = vu.id
       LEFT JOIN vehicles v ON ar.vehicle_id = v.id
       WHERE ar.id = ?`,
      [req.params.id]
    );

    if (!requests.length) return res.status(404).json({ error: 'Request not found' });

    const request = requests[0];
    const canView =
      req.user.role === 'admin' ||
      request.customer_id === req.user.id ||
      request.volunteer_id === req.user.id ||
      (req.user.role === 'volunteer' && request.status === 'pending');

    if (!canView) return res.status(403).json({ error: 'Access denied' });

    const [tracking] = await pool.query(
      'SELECT * FROM request_tracking WHERE request_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({ request, tracking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status, latitude, longitude, message } = req.body;
    const validStatuses = ['accepted', 'en_route', 'in_progress', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [requests] = await pool.query('SELECT * FROM assistance_requests WHERE id = ?', [req.params.id]);
    if (!requests.length) return res.status(404).json({ error: 'Request not found' });

    const request = requests[0];

    if (status === 'accepted' && req.user.role === 'volunteer') {
      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Request already taken' });
      }
      await pool.query('UPDATE assistance_requests SET volunteer_id = ?, status = ? WHERE id = ?', [
        req.user.id,
        status,
        req.params.id,
      ]);
    } else if (req.user.role === 'admin' || request.volunteer_id === req.user.id) {
      await pool.query('UPDATE assistance_requests SET status = ? WHERE id = ?', [status, req.params.id]);
      if (status === 'completed') {
        await pool.query('UPDATE assistance_requests SET completed_at = NOW() WHERE id = ?', [req.params.id]);
        await pool.query(
          'UPDATE volunteer_profiles SET total_jobs = total_jobs + 1 WHERE user_id = ?',
          [request.volunteer_id]
        );
      }
    } else {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const statusMessages = {
      accepted: 'Volunteer accepted your request',
      en_route: 'Volunteer is on the way',
      in_progress: 'Service in progress',
      completed: 'Service completed successfully',
      cancelled: 'Request cancelled',
    };

    await pool.query(
      'INSERT INTO request_tracking (request_id, status, latitude, longitude, message) VALUES (?, ?, ?, ?, ?)',
      [
        req.params.id,
        status,
        latitude || null,
        longitude || null,
        message || statusMessages[status],
      ]
    );

    const io = req.app.get('io');
    emitTracking(io, req.params.id, {
      requestId: parseInt(req.params.id, 10),
      status,
      latitude,
      longitude,
      message: message || statusMessages[status],
    });

    const [updated] = await pool.query(
      `SELECT ar.*, st.name as service_name FROM assistance_requests ar
       JOIN service_types st ON ar.service_type_id = st.id WHERE ar.id = ?`,
      [req.params.id]
    );

    res.json({ request: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.patch('/:id/location', requireRole('volunteer'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const [requests] = await pool.query(
      'SELECT * FROM assistance_requests WHERE id = ? AND volunteer_id = ?',
      [req.params.id, req.user.id]
    );

    if (!requests.length) return res.status(404).json({ error: 'Request not found' });

    await pool.query(
      'UPDATE volunteer_profiles SET current_latitude = ?, current_longitude = ? WHERE user_id = ?',
      [latitude, longitude, req.user.id]
    );

    const io = req.app.get('io');
    io?.to(`request:${req.params.id}`).emit('tracking:location', {
      requestId: parseInt(req.params.id, 10),
      latitude,
      longitude,
    });

    res.json({ message: 'Location updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

export default router;
