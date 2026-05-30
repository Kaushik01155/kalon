import express from 'express';
import pool from '../config/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { generateTransactionId } from '../utils/helpers.js';

const router = express.Router();

router.use(authenticate);

router.post('/create', async (req, res) => {
  try {
    const { request_id, payment_method } = req.body;
    if (!request_id) return res.status(400).json({ error: 'Request ID required' });

    const [requests] = await pool.query(
      'SELECT * FROM assistance_requests WHERE id = ? AND customer_id = ?',
      [request_id, req.user.id]
    );

    if (!requests.length) return res.status(404).json({ error: 'Request not found' });

    const request = requests[0];
    const amount = request.final_price || request.estimated_price;
    const transactionId = generateTransactionId();

    const [result] = await pool.query(
      'INSERT INTO payments (request_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?)',
      [request_id, amount, payment_method || 'card', transactionId, 'pending']
    );

    res.json({
      payment: {
        id: result.insertId,
        amount,
        currency: 'INR',
        transaction_id: transactionId,
        status: 'pending',
      },
      client_secret: `kalon_test_${transactionId}`,
      message: 'Payment initiated. Confirm to complete.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
});

router.post('/confirm', async (req, res) => {
  try {
    const { payment_id, request_id } = req.body;

    const [payments] = await pool.query('SELECT * FROM payments WHERE id = ?', [payment_id]);
    if (!payments.length) return res.status(404).json({ error: 'Payment not found' });

    const payment = payments[0];

    await pool.query('UPDATE payments SET status = ? WHERE id = ?', ['success', payment_id]);
    await pool.query(
      'UPDATE assistance_requests SET payment_status = ?, payment_id = ?, final_price = ? WHERE id = ?',
      ['paid', payment.transaction_id, payment.amount, request_id || payment.request_id]
    );

    res.json({
      success: true,
      payment: { ...payment, status: 'success' },
      message: 'Payment successful',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment confirmation failed' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const [payments] = await pool.query(
      `SELECT p.*, ar.request_code, st.name as service_name
       FROM payments p
       JOIN assistance_requests ar ON p.request_id = ar.id
       JOIN service_types st ON ar.service_type_id = st.id
       WHERE ar.customer_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

export default router;
