import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendInvoiceEmail } from '../utils/mailer.js';

const router = express.Router();

// POST /api/orders (Place an order / create booking)
router.post('/', authenticateToken, async (req, res) => {
  const { customerId, workerId, location, customerLat, customerLng, date, duration, totalAmount, vehicleId, bookingType, notes } = req.body;
  
  if (!customerId || !location || !date || !duration || !totalAmount || !vehicleId) {
    return res.status(400).json({ message: 'Missing required order fields' });
  }

  try {
    const id = `order-${Date.now()}`;
    const status = workerId ? 'assigned' : 'pending';

    // Fetch customer's phone number to generate suffix-based completion OTP
    const [custUsers] = await pool.query('SELECT phone FROM users WHERE id = ?', [customerId]);
    const phone = custUsers.length > 0 ? custUsers[0].phone : '';
    const digits = phone ? phone.replace(/\D/g, '') : '';
    const completionOtp = digits.length >= 4 ? digits.slice(-4) : '4821';

    await pool.query(
      `INSERT INTO bookings (id, customer_id, worker_id, status, location, customer_lat, customer_lng, booking_date, duration, total_amount, vehicle_id, booking_type, notes, completion_otp, otp_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, customerId, workerId || null, status, location, customerLat || null, customerLng || null, date, duration, totalAmount, vehicleId, bookingType || 'instant', notes || null, completionOtp]
    );


    // Fetch the newly created order
    const [orders] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
    res.status(201).json(orders[0]);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Server error placing order' });
  }
});

// GET /api/orders (List all orders - Admin view)
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  try {
    const [orders] = await pool.query(`
      SELECT b.*, 
             c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
             w.name AS worker_name, w.email AS worker_email, w.phone AS worker_phone
      FROM bookings b
      LEFT JOIN users c ON b.customer_id = c.id
      LEFT JOIN users w ON b.worker_id = w.id
      ORDER BY b.created_at DESC
    `);
    res.json(orders);
  } catch (err) {
    console.error('Fetch all orders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/orders/customer/:id (List orders for a customer)
router.get('/customer/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [orders] = await pool.query(`
      SELECT b.*, 
             w.name AS worker_name, w.phone AS worker_phone, w.vehicle_details AS worker_vehicle
      FROM bookings b
      LEFT JOIN users w ON b.worker_id = w.id
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
    `, [id]);
    res.json(orders);
  } catch (err) {
    console.error('Fetch customer orders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/orders/worker/:id (List orders for a worker)
router.get('/worker/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [orders] = await pool.query(`
      SELECT b.*, 
             c.name AS customer_name,
             CASE WHEN b.status = 'pending' THEN NULL ELSE c.phone END AS customer_phone,
             w.name AS worker_name, w.phone AS worker_phone, w.vehicle_details AS worker_vehicle
      FROM bookings b
      LEFT JOIN users c ON b.customer_id = c.id
      LEFT JOIN users w ON b.worker_id = w.id
      WHERE b.worker_id = ? OR b.status = 'pending'
      ORDER BY b.created_at DESC
    `, [id]);
    res.json(orders);
  } catch (err) {
    console.error('Fetch worker orders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/orders/:id/status (Accept, Complete, Cancel booking)
router.put('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, workerId } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    const [existing] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const order = existing[0];

    // Status logic updates
    if (status === 'assigned' && workerId) {
      // 1. Worker Subscription Validation
      const [workers] = await pool.query('SELECT subscription FROM users WHERE id = ?', [workerId]);
      if (workers.length === 0) {
        return res.status(404).json({ message: 'Worker profile not found' });
      }
      
      let sub = null;
      if (workers[0].subscription) {
        try {
          sub = typeof workers[0].subscription === 'string' ? JSON.parse(workers[0].subscription) : workers[0].subscription;
        } catch (e) {}
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const subActive = sub && sub.active && (!sub.expiresAt || sub.expiresAt >= todayStr);

      if (!subActive) {
        return res.status(403).json({ message: 'Your subscription package is inactive or expired. Please purchase/renew a plan to accept orders.' });
      }

      // 2. Single Active Service constraint
      const [activeAssignments] = await pool.query(
        "SELECT id FROM bookings WHERE worker_id = ? AND status IN ('assigned', 'active', 'arrived')",
        [workerId]
      );
      if (activeAssignments.length > 0) {
        return res.status(400).json({ message: 'You already have an active service order. Please complete your current order first.' });
      }

      // 3. Prevent race conditions: Check if this order is already assigned
      if (order.status !== 'pending' || order.worker_id !== null) {
        return res.status(409).json({ message: 'This service order has already been accepted by another worker.' });
      }

      // Accept the pending job
      await pool.query('UPDATE bookings SET status = ?, worker_id = ? WHERE id = ?', ['assigned', workerId, id]);
    } else if (status === 'pending') {
      // Worker cancelling active job, set back to pending and append to rejected_workers list
      const [current] = await pool.query('SELECT rejected_workers FROM bookings WHERE id = ?', [id]);
      let list = [];
      if (current.length > 0 && current[0].rejected_workers) {
        try {
          list = JSON.parse(current[0].rejected_workers);
        } catch (e) {}
      }
      const rejectWorkerId = req.body.rejectWorkerId || req.user.id;
      if (rejectWorkerId && !list.includes(rejectWorkerId)) {
        list.push(rejectWorkerId);
      }
      
      // Append worker cancellation audit to notes
      let updatedNotes = order.notes || '';
      if (req.body.cancelReason) {
        const cancelLog = `\n\n[Worker Cancelled] Reason: ${req.body.cancelReason}${req.body.cancelDetails ? ` (Details: ${req.body.cancelDetails})` : ''}`;
        updatedNotes += cancelLog;
      }

      await pool.query(
        'UPDATE bookings SET status = ?, worker_id = NULL, rejected_workers = ?, notes = ?, cancel_reason = ?, cancel_details = ? WHERE id = ?',
        ['pending', JSON.stringify(list), updatedNotes, req.body.cancelReason || null, req.body.cancelDetails || null, id]
      );
    } else if (status === 'completed') {
      // 1. Check if completion OTP has been verified
      if (!order.otp_verified) {
        return res.status(400).json({ message: 'Cannot complete service: Customer completion OTP must be verified first.' });
      }

      // 2. Check if payment collection option has been selected
      const paymentMode = req.body.paymentMode;
      if (!paymentMode || !['cash', 'online'].includes(paymentMode)) {
        return res.status(400).json({ message: 'Cannot complete service: Payment collection option (Online or Cash) must be selected.' });
      }

      const photos = req.body.completionPhotos ? JSON.stringify(req.body.completionPhotos) : null;
      await pool.query(
        'UPDATE bookings SET status = ?, completion_photos = ?, payment_mode = ?, payment_status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['completed', photos, paymentMode, 'paid', id]
      );
    } else if (status === 'cancelled') {
      await pool.query(
        'UPDATE bookings SET status = ?, cancel_reason = ?, cancel_details = ? WHERE id = ?',
        ['cancelled', req.body.cancelReason || null, req.body.cancelDetails || null, id]
      );
    } else {
      // General status transition (active, arrived, completed, cancelled)
      await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
    }

    // Trigger Invoice Email if status is completed
    if (status === 'completed') {
      try {
        const [orderRows] = await pool.query(`
          SELECT b.*, 
                 c.name AS customer_name, c.email AS customer_email,
                 w.name AS worker_name, w.email AS worker_email,
                 s.name AS vehicle_name, s.unit AS unit
          FROM bookings b
          LEFT JOIN users c ON b.customer_id = c.id
          LEFT JOIN users w ON b.worker_id = w.id
          LEFT JOIN services s ON b.vehicle_id = s.id
          WHERE b.id = ?
        `, [id]);

        if (orderRows.length > 0) {
          const orderData = orderRows[0];
          if (orderData.customer_email) {
            sendInvoiceEmail(orderData.customer_email, orderData.customer_name || 'Customer', orderData).catch(err => {
              console.error('Invoice email dispatch failed:', err);
            });
          }
          if (orderData.worker_email) {
            sendInvoiceEmail(orderData.worker_email, orderData.worker_name || 'Worker', orderData).catch(err => {
              console.error('Invoice email copy to worker failed:', err);
            });
          }
        }
      } catch (emailErr) {
        console.error('Fetch order for invoice email failed:', emailErr);
      }
    }

    const [updated] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/orders/:id/review (Submit review for a worker)
router.put('/:id/review', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!rating) {
    return res.status(400).json({ message: 'Rating is required' });
  }

  try {
    const [existing] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const order = existing[0];
    if (!order.worker_id) {
      return res.status(400).json({ message: 'Cannot review a booking without an assigned worker' });
    }

    // Record review (retrieve customer name, compute rolling rating, and save review object in reviews JSON array)
    const [customers] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    const authorName = customers.length > 0 ? customers[0].name : 'Customer';

    const [workers] = await pool.query('SELECT rating, reviews FROM users WHERE id = ?', [order.worker_id]);
    if (workers.length > 0) {
      const currentRating = parseFloat(workers[0].rating) || 5.0;
      const newRating = ((currentRating * 4) + parseFloat(rating)) / 5; // simplified rolling average of last 5 reviews
      
      let reviewsList = [];
      if (workers[0].reviews) {
        try {
          reviewsList = typeof workers[0].reviews === 'string' ? JSON.parse(workers[0].reviews) : workers[0].reviews;
        } catch (e) {
          reviewsList = [];
        }
      }
      if (!Array.isArray(reviewsList)) reviewsList = [];

      reviewsList.push({
        author: authorName,
        rating: Number(rating),
        comment,
        date: new Date().toLocaleDateString()
      });

      await pool.query('UPDATE users SET rating = ?, reviews = ? WHERE id = ?', [newRating, JSON.stringify(reviewsList), order.worker_id]);
    }

    res.json({ message: 'Review submitted successfully' });
  } catch (err) {
    console.error('Review submit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/orders/:id (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]); // Wait, SELECT * FROM bookings!
    // Ah, let's write SELECT * FROM bookings WHERE id = ?
    await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/orders/:id/verify-otp (Verify customer completion OTP)
router.post('/:id/verify-otp', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: 'OTP code is required' });
  }

  try {
    const [bookings] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const order = bookings[0];

    // Get expected completion OTP
    let expectedOtp = order.completion_otp;
    if (!expectedOtp) {
      // Fallback: calculate if not stored
      const [custUsers] = await pool.query('SELECT phone FROM users WHERE id = ?', [order.customer_id]);
      const phone = custUsers.length > 0 ? custUsers[0].phone : '';
      const digits = phone ? phone.replace(/\D/g, '') : '';
      expectedOtp = digits.length >= 4 ? digits.slice(-4) : '4821';
    }

    if (otp.trim() === expectedOtp.trim()) {
      await pool.query('UPDATE bookings SET otp_verified = 1 WHERE id = ?', [id]);
      const [updated] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
      return res.json({ success: true, message: 'OTP verified successfully', booking: updated[0] });
    } else {
      return res.status(400).json({ message: 'Invalid OTP. Please check the code with the customer.' });
    }
  } catch (err) {
    console.error('Verify completion OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
