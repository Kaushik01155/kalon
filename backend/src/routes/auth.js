import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { generateOTP } from '../utils/helpers.js';

const router = express.Router();

router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Valid 10-digit phone number required' });
    }

    const code = generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await pool.query(
      'INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)',
      [phone, code, expiresAt]
    );

    console.log(`[Kalon OTP] Phone: ${phone} | Code: ${code}`);

    res.json({
      message: 'OTP sent successfully',
      ...(process.env.NODE_ENV !== 'production' && { otp: code }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, code, name, role } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    const [rows] = await pool.query(
      `SELECT * FROM otp_codes WHERE phone = ? AND code = ? AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code]
    );

    if (!rows.length) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    await pool.query('UPDATE otp_codes SET used = TRUE WHERE id = ?', [rows[0].id]);

    let [users] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);

    if (!users.length) {
      const userRole = ['customer', 'volunteer', 'admin'].includes(role) ? role : 'customer';
      const [result] = await pool.query(
        'INSERT INTO users (phone, name, role, is_verified) VALUES (?, ?, ?, TRUE)',
        [phone, name || null, userRole]
      );
      [users] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);

      if (userRole === 'volunteer') {
        await pool.query(
          'INSERT INTO volunteer_profiles (user_id, services_offered) VALUES (?, ?)',
          [result.insertId, JSON.stringify(['fuel_delivery', 'tyre_puncture', 'battery_jump', 'towing'])]
        );
      }
    } else {
      await pool.query('UPDATE users SET is_verified = TRUE WHERE id = ?', [users[0].id]);
    }

    const user = users[0];
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'kalon_super_secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kalon_super_secret');
    const [users] = await pool.query(
      'SELECT id, phone, name, email, role, created_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!users.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: users[0] });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
