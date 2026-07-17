import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// PUT /api/tracking/worker/location (Worker updates their live location)
router.put('/worker/location', authenticateToken, async (req, res) => {
  const { lat, lng } = req.body;

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  try {
    // Insert or update worker's location
    await pool.query(
      `INSERT INTO worker_locations (worker_id, lat, lng)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng)`,
      [req.user.id, lat, lng]
    );

    res.json({ message: 'Location updated successfully', lat, lng });
  } catch (err) {
    console.error('Update worker location error:', err);
    res.status(500).json({ message: 'Server error updating location' });
  }
});

// PUT /api/tracking/order/:id/message (Worker updates status message to customer)
router.put('/order/:id/message', authenticateToken, async (req, res) => {
  const { message } = req.body;
  const { id } = req.params;

  try {
    await pool.query(
      "UPDATE bookings SET worker_message = ? WHERE id = ?",
      [message, id]
    );
    res.json({ message: 'Message updated successfully', workerMessage: message });
  } catch (err) {
    console.error('Update worker message error:', err);
    res.status(500).json({ message: 'Server error updating message' });
  }
});

// GET /api/tracking/order/:id (Fetch live location details for an active order)
router.get('/order/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [orders] = await pool.query(
      `SELECT b.id, b.status, b.customer_lat, b.customer_lng, b.worker_id, b.worker_message,
              b.booking_name, b.booking_phone, b.whatsapp_phone, b.email AS booking_email, b.manual_address,
              c.name AS customer_name, c.phone AS customer_phone,
              w.name AS worker_name, w.phone AS worker_phone, w.vehicle_details AS worker_vehicle, w.photo AS worker_photo, w.rating AS worker_rating
       FROM bookings b
       LEFT JOIN users c ON b.customer_id = c.id
       LEFT JOIN users w ON b.worker_id = w.id
       WHERE b.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // If no worker is assigned or order is completed/cancelled, tracking is inactive
    if (!order.worker_id) {
      return res.json({
        orderId: order.id,
        status: order.status,
        customerLat: order.customer_lat,
        customerLng: order.customer_lng,
        bookingName: order.booking_name || order.customer_name,
        bookingPhone: order.booking_phone || order.customer_phone,
        whatsappPhone: order.whatsapp_phone || '',
        email: order.booking_email || '',
        manualAddress: order.manual_address || '',
        workerLocation: null
      });
    }

    // Fetch worker's live location
    const [locations] = await pool.query(
      `SELECT lat, lng, updated_at FROM worker_locations WHERE worker_id = ?`,
      [order.worker_id]
    );

    let workerLocation = null;
    if (locations.length > 0) {
      workerLocation = {
        lat: parseFloat(locations[0].lat),
        lng: parseFloat(locations[0].lng),
        updatedAt: locations[0].updated_at
      };
    }

    res.json({
      orderId: order.id,
      status: order.status,
      customerLat: order.customer_lat ? parseFloat(order.customer_lat) : null,
      customerLng: order.customer_lng ? parseFloat(order.customer_lng) : null,
      bookingName: order.booking_name || order.customer_name,
      bookingPhone: order.booking_phone || order.customer_phone,
      whatsappPhone: order.whatsapp_phone || '',
      email: order.booking_email || '',
      manualAddress: order.manual_address || '',
      workerId: order.worker_id,
      workerName: order.worker_name,
      workerPhone: order.worker_phone,
      workerVehicle: order.worker_vehicle,
      workerPhoto: order.worker_photo,
      workerRating: order.worker_rating ? parseFloat(order.worker_rating) : 5.0,
      workerMessage: order.worker_message,
      workerLocation
    });
  } catch (err) {
    console.error('Fetch tracking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
