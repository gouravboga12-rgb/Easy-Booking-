import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendInvoiceEmail } from '../utils/mailer.js';

const router = express.Router();

// POST /api/orders (Place an order / create booking)
router.post('/', authenticateToken, async (req, res) => {
  const { customerId, workerId, location, customerLat, customerLng, date, duration, totalAmount, vehicleId, bookingType } = req.body;
  
  if (!customerId || !location || !date || !duration || !totalAmount || !vehicleId) {
    return res.status(400).json({ message: 'Missing required order fields' });
  }

  try {
    const id = `order-${Date.now()}`;
    const status = workerId ? 'assigned' : 'pending';

    await pool.query(
      `INSERT INTO bookings (id, customer_id, worker_id, status, location, customer_lat, customer_lng, booking_date, duration, total_amount, vehicle_id, booking_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, customerId, workerId || null, status, location, customerLat || null, customerLng || null, date, duration, totalAmount, vehicleId, bookingType || 'instant']
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
             c.name AS customer_name, c.phone AS customer_phone,
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
      // Worker accepting a pending job
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
      await pool.query(
        'UPDATE bookings SET status = ?, worker_id = NULL, rejected_workers = ? WHERE id = ?',
        ['pending', JSON.stringify(list), id]
      );
    } else if (status === 'completed' && req.body.completionPhotos) {
      await pool.query(
        'UPDATE bookings SET status = ?, completion_photos = ? WHERE id = ?',
        ['completed', JSON.stringify(req.body.completionPhotos), id]
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
                 w.name AS worker_name,
                 s.name AS vehicle_name
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

export default router;
