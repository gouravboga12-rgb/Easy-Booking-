import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendInvoiceEmail } from '../utils/mailer.js';

const router = express.Router();

// POST /api/orders (Place an order / create booking)
router.post('/', authenticateToken, async (req, res) => {
  const { 
    customerId, workerId, location, customerLat, customerLng, date, duration, 
    totalAmount, vehicleId, bookingType, notes, customAnswers,
    bookingName, bookingPhone, whatsappPhone, email, manualAddress,
    timeSlot
  } = req.body;
  
  if (!customerId || !location || !date || !duration || !totalAmount || !vehicleId) {
    return res.status(400).json({ message: 'Missing required order fields' });
  }

  try {
    const id = `order-${Date.now()}`;
    const status = workerId ? 'assigned' : 'pending';

    // Fetch customer's phone number to generate suffix-based completion OTP (universal customer OTP based on registration phone)
    const [custUsers] = await pool.query('SELECT phone FROM users WHERE id = ?', [customerId]);
    const phone = custUsers.length > 0 ? custUsers[0].phone : '';
    const digits = phone ? phone.replace(/\D/g, '') : '';
    const completionOtp = digits.length >= 4 ? digits.slice(-4) : '4821';

    const customAnswersStr = customAnswers ? JSON.stringify(customAnswers) : null;
    console.log(`[ORDER CREATE] bookingType=${bookingType} timeSlot=${timeSlot} date=${date}`);

    await pool.query(
      `INSERT INTO bookings (id, customer_id, worker_id, status, location, customer_lat, customer_lng, booking_date, duration, total_amount, vehicle_id, booking_type, notes, completion_otp, otp_verified, custom_answers, booking_name, booking_phone, whatsapp_phone, email, manual_address, time_slot)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
      [id, customerId, workerId || null, status, location, customerLat || null, customerLng || null, date, duration, totalAmount, vehicleId, bookingType || 'instant', notes || null, completionOtp, customAnswersStr, bookingName || null, bookingPhone || null, whatsappPhone || null, email || null, manualAddress || null, timeSlot || null]
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
             w.name AS worker_name, w.email AS worker_email, w.phone AS worker_phone,
             s.custom_fields AS service_custom_fields
      FROM bookings b
      LEFT JOIN users c ON b.customer_id = c.id
      LEFT JOIN users w ON b.worker_id = w.id
      LEFT JOIN services s ON b.vehicle_id = s.id
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
             w.name AS worker_name, w.phone AS worker_phone, w.vehicle_details AS worker_vehicle,
             s.custom_fields AS service_custom_fields
      FROM bookings b
      LEFT JOIN users w ON b.worker_id = w.id
      LEFT JOIN services s ON b.vehicle_id = s.id
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
    `, [id]);
    res.json(orders);
  } catch (err) {
    console.error('Fetch customer orders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Haversine formula for distance calculation in kilometers
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return Infinity;
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return Infinity;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Active Subscription check helper
function isSubscriptionActive(user) {
  let sub = null;
  if (user.subscription) {
    try {
      sub = typeof user.subscription === 'string' ? JSON.parse(user.subscription) : user.subscription;
    } catch (e) {}
  }
  const todayStr = new Date().toISOString().split('T')[0];
  return sub && sub.active && (!sub.expiresAt || sub.expiresAt >= todayStr);
}

// Worker service role & work experience matching helper
function workerMatchesRole(worker, serviceId, serviceName, serviceCategory) {
  let categories = [];
  if (Array.isArray(worker?.categories)) {
    categories = worker.categories;
  } else if (typeof worker?.categories === 'string') {
    try { categories = JSON.parse(worker.categories); } catch (e) { categories = []; }
  }

  let skills = [];
  if (Array.isArray(worker?.skills)) {
    skills = worker.skills.map(s => String(s).toLowerCase());
  } else if (typeof worker?.skills === 'string') {
    try { skills = JSON.parse(worker.skills).map(s => String(s).toLowerCase()); } catch (e) { skills = []; }
  }

  const designation = (worker?.vehicle_details || worker?.vehicle || '').toLowerCase();
  const cleanDesignation = designation.replace(/&/g, ' and ').replace(/[-_]/g, ' ');
  
  const sCat = (serviceCategory || '').toLowerCase();
  const sName = (serviceName || '').toLowerCase();
  const vId = (serviceId || '').toLowerCase();

  // 1. Direct Category Match (worker selected this category ID/label or "all")
  if (categories.length > 0) {
    if (
      categories.includes('all') || 
      categories.includes(serviceCategory) || 
      categories.includes(sCat) ||
      categories.some(c => String(c).toLowerCase().replace(/[-_]/g, '') === sCat.replace(/[-_]/g, ''))
    ) {
      return true;
    }
  }

  // 2. Unrestricted worker (no categories selected AND no designation/skills configured)
  if (categories.length === 0 && skills.length === 0 && !designation) {
    return true;
  }

  // 3. Work Experience / Skills / Designation Keyword Match
  const searchTerms = [
    sCat, sName, vId,
    ...sCat.split(/[-_\s&]+/),
    ...sName.split(/[-_\s&]+/),
    ...vId.split(/[-_\s&]+/)
  ].map(t => t.trim().toLowerCase()).filter(t => t && t.length > 2);

  // Check if designation or any skill contains search terms
  if (searchTerms.some(term => cleanDesignation.includes(term))) return true;
  if (skills.some(skill => searchTerms.some(term => skill.includes(term) || term.includes(skill)))) return true;

  // Domain synonym matching:
  if (sCat.includes('construction') || sName.includes('labour') || vId.includes('labour') || sName.includes('construction')) {
    if (cleanDesignation.includes('construction') || cleanDesignation.includes('labour') || cleanDesignation.includes('mason') || cleanDesignation.includes('civil') || cleanDesignation.includes('site') || cleanDesignation.includes('helper')) return true;
    if (skills.some(s => s.includes('construction') || s.includes('labour') || s.includes('mason') || s.includes('cement') || s.includes('brick'))) return true;
  }

  if (sCat.includes('driver') || sCat.includes('logistics') || sName.includes('driver') || sName.includes('goods')) {
    if (cleanDesignation.includes('driver') || cleanDesignation.includes('logistics') || cleanDesignation.includes('auto') || cleanDesignation.includes('truck') || cleanDesignation.includes('mover')) return true;
    if (skills.some(s => s.includes('driver') || s.includes('driving') || s.includes('logistics') || s.includes('loading'))) return true;
  }

  if (sName.includes('electrician') || sName.includes('electrical')) {
    if (cleanDesignation.includes('electrician') || cleanDesignation.includes('electrical')) return true;
    if (skills.some(s => s.includes('wiring') || s.includes('circuit') || s.includes('electric'))) return true;
  }

  if (sName.includes('plumber') || sName.includes('plumbing')) {
    if (cleanDesignation.includes('plumber') || cleanDesignation.includes('plumbing')) return true;
    if (skills.some(s => s.includes('pipe') || s.includes('leak') || s.includes('tap') || s.includes('water'))) return true;
  }

  if (sName.includes('painter') || sName.includes('painting')) {
    if (cleanDesignation.includes('painter') || cleanDesignation.includes('painting')) return true;
    if (skills.some(s => s.includes('paint') || s.includes('wall') || s.includes('putty'))) return true;
  }

  if (sName.includes('carpenter') || sName.includes('carpentry')) {
    if (cleanDesignation.includes('carpenter') || cleanDesignation.includes('carpentry')) return true;
    if (skills.some(s => s.includes('wood') || s.includes('furniture') || s.includes('lock'))) return true;
  }

  if (sName.includes('clean') || sCat.includes('housekeeping')) {
    if (cleanDesignation.includes('clean') || cleanDesignation.includes('housekeeping') || cleanDesignation.includes('laundry')) return true;
    if (skills.some(s => s.includes('clean') || s.includes('pest') || s.includes('wash'))) return true;
  }

  return false;
}

// GET /api/orders/worker/:id (List orders for a worker)
router.get('/worker/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [workers] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (workers.length === 0) {
      return res.status(404).json({ message: 'Worker profile not found' });
    }
    const worker = workers[0];

    try {
      worker.skills = typeof worker.skills === 'string' ? JSON.parse(worker.skills) : (worker.skills || []);
    } catch (e) { worker.skills = []; }
    try {
      worker.categories = typeof worker.categories === 'string' ? JSON.parse(worker.categories) : (worker.categories || []);
    } catch (e) { worker.categories = []; }

    const isOnline = Number(worker.available) === 1 || worker.available === true || worker.available === '1';
    const isSubActive = isSubscriptionActive(worker);
    
    const [activeAssignments] = await pool.query(
      "SELECT id FROM bookings WHERE worker_id = ? AND (status IN ('active', 'arrived') OR (status = 'assigned' AND booking_type != 'scheduled'))",
      [id]
    );
    const isBusy = activeAssignments.length > 0;

    const canReceivePending = isOnline && isSubActive && !isBusy;

    const [workerScheduled] = await pool.query(
      "SELECT booking_date FROM bookings WHERE worker_id = ? AND status = 'assigned' AND booking_type = 'scheduled'",
      [id]
    );
    const scheduledDates = workerScheduled.map(w => w.booking_date);

    let sql = '';
    let params = [];
    if (canReceivePending) {
      let dateFilter = '';
      if (scheduledDates.length > 0) {
        // Exclude pending scheduled orders on the same dates
        dateFilter = `AND NOT (b.status = 'pending' AND b.booking_type = 'scheduled' AND b.booking_date IN (${scheduledDates.map(() => '?').join(', ')}))`;
      }
      sql = `
        SELECT b.*, 
               c.name AS customer_name,
               CASE WHEN b.status = 'pending' THEN NULL ELSE c.phone END AS customer_phone,
               CASE WHEN b.status = 'pending' THEN NULL ELSE b.booking_phone END AS booking_phone,
               CASE WHEN b.status = 'pending' THEN NULL ELSE b.whatsapp_phone END AS whatsapp_phone,
               w.name AS worker_name, w.phone AS worker_phone, w.vehicle_details AS worker_vehicle,
               s.custom_fields AS service_custom_fields,
               s.category AS service_category,
               s.name AS service_name
        FROM bookings b
        LEFT JOIN users c ON b.customer_id = c.id
        LEFT JOIN users w ON b.worker_id = w.id
        LEFT JOIN services s ON b.vehicle_id = s.id
        WHERE (b.worker_id = ? OR b.status = 'pending') ${dateFilter}
        ORDER BY b.created_at DESC
      `;
      params = [id, ...scheduledDates];
    } else {
      sql = `
        SELECT b.*, 
               c.name AS customer_name,
               CASE WHEN b.status = 'pending' THEN NULL ELSE c.phone END AS customer_phone,
               CASE WHEN b.status = 'pending' THEN NULL ELSE b.booking_phone END AS booking_phone,
               CASE WHEN b.status = 'pending' THEN NULL ELSE b.whatsapp_phone END AS whatsapp_phone,
               w.name AS worker_name, w.phone AS worker_phone, w.vehicle_details AS worker_vehicle,
               s.custom_fields AS service_custom_fields,
               s.category AS service_category,
               s.name AS service_name
        FROM bookings b
        LEFT JOIN users c ON b.customer_id = c.id
        LEFT JOIN users w ON b.worker_id = w.id
        LEFT JOIN services s ON b.vehicle_id = s.id
        WHERE b.worker_id = ?
        ORDER BY b.created_at DESC
      `;
      params = [id];
    }

    const [orders] = await pool.query(sql, params);

    let activeJobs = [];
    let pendingJobs = [];

    for (const o of orders) {
      if (o.status !== 'pending') {
        activeJobs.push(o);
        continue;
      }

      // Check if worker chosen categories OR work experience/skills match the service
      if (!workerMatchesRole(worker, o.vehicle_id, o.service_name || '', o.service_category || '')) {
        continue;
      }

      let wLat = worker.lat;
      let wLng = worker.lng;

      // Always try to fetch live coords from worker_locations first
      const [liveCoords] = await pool.query(
        'SELECT lat, lng FROM worker_locations WHERE worker_id = ? ORDER BY updated_at DESC LIMIT 1',
        [id]
      );
      if (liveCoords.length > 0 && liveCoords[0].lat !== null && liveCoords[0].lng !== null) {
        wLat = liveCoords[0].lat;
        wLng = liveCoords[0].lng;
      }

      const custLocLower = (o.location || '').toLowerCase();

      // Target locations check
      let targetLocs = [];
      if (worker.target_locations) {
        try {
          targetLocs = typeof worker.target_locations === 'string' ? JSON.parse(worker.target_locations) : worker.target_locations;
        } catch (e) {}
      }
      const matchesTarget = (targetLocs && targetLocs.length > 0) ? targetLocs.some(loc => custLocLower.includes(loc.toLowerCase())) : false;

      // Distance radius check
      let distance = null;
      if (wLat !== null && wLng !== null && o.customer_lat !== null && o.customer_lng !== null) {
        distance = getHaversineDistance(
          parseFloat(wLat),
          parseFloat(wLng),
          parseFloat(o.customer_lat),
          parseFloat(o.customer_lng)
        );
      }

      const radiusLimit = worker.radius || 10;
      const matchesRadius = distance !== null ? distance <= radiusLimit : true;

      // If worker specified target locations, check if matches target or radius.
      // Operational City & Location Radius Filter:
      // Worker receives orders within their operational city (e.g. Hyderabad) or within their radius limit; out-of-city jobs (e.g. Nalgonda, Suryapet) are excluded.
      const workerCity = (worker.city || '').split(',')[0].trim().toLowerCase();
      if (workerCity && workerCity.length > 2) {
        const orderInCity = custLocLower.includes(workerCity);
        const withinRadius = distance !== null && distance <= radiusLimit;
        if (!orderInCity && !withinRadius) {
          continue;
        }
      } else if (!matchesRadius) {
        continue;
      }

      // Set priority score: 3 for target match, 1 for nearby radius match
      const priority = matchesTarget ? 3 : 1;

      pendingJobs.push({
        ...o,
        _priority: priority,
        _distance: distance !== null ? distance : Infinity
      });
    }

    // Sort pending jobs by:
    // 1. Highest Priority (Targeted locations first, then nearby radius matches)
    // 2. Closest Distance
    // 3. Newest created_at timestamp
    pendingJobs.sort((a, b) => {
      if (b._priority !== a._priority) {
        return b._priority - a._priority;
      }
      if (a._distance !== b._distance) {
        return a._distance - b._distance;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    // Remove temp sorting properties before output
    const cleanPending = pendingJobs.map(({ _priority, _distance, ...cleanJob }) => cleanJob);
    const finalOrders = [...activeJobs, ...cleanPending];

    res.json(finalOrders);
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

      // 2.5 Overlapping scheduled orders check
      if (order.booking_type === 'scheduled') {
        const [existingScheduled] = await pool.query(
          "SELECT id FROM bookings WHERE worker_id = ? AND status = 'assigned' AND booking_type = 'scheduled' AND booking_date = ?",
          [workerId, order.booking_date]
        );
        if (existingScheduled.length > 0) {
          return res.status(400).json({ message: 'You have already accepted another scheduled order on this date. You cannot accept overlapping scheduled bookings.' });
        }
      }

      // 2. Single Active Service constraint (only for instant orders)
      if (order.booking_type !== 'scheduled') {
        const [activeAssignments] = await pool.query(
          "SELECT id FROM bookings WHERE worker_id = ? AND (status IN ('active', 'arrived') OR (status = 'assigned' AND booking_type != 'scheduled'))",
          [workerId]
        );
        if (activeAssignments.length > 0) {
          return res.status(400).json({ message: 'You already have an active service order. Please complete your current order first.' });
        }
      }

      // 3. Prevent race conditions: Check if this order is already assigned
      if (order.status !== 'pending' || order.worker_id !== null) {
        return res.status(409).json({ message: 'This service order has already been accepted by another worker.' });
      }

      // Accept the pending job
      await pool.query('UPDATE bookings SET status = ?, worker_id = ? WHERE id = ?', ['assigned', workerId, id]);
      
      // Only mark worker as unavailable if the accepted order is NOT a scheduled order
      if (order.booking_type !== 'scheduled') {
        await pool.query('UPDATE users SET available = 0 WHERE id = ?', [workerId]);
      }
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
      // Set worker available status back to 1 (available)
      await pool.query('UPDATE users SET available = 1 WHERE id = ?', [rejectWorkerId]);
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
      // Set worker available status back to 1
      await pool.query('UPDATE users SET available = 1 WHERE id = ?', [order.worker_id]);
    } else if (status === 'cancelled') {
      await pool.query(
        'UPDATE bookings SET status = ?, cancel_reason = ?, cancel_details = ? WHERE id = ?',
        ['cancelled', req.body.cancelReason || null, req.body.cancelDetails || null, id]
      );
      // Set worker available status back to 1
      if (order.worker_id) {
        await pool.query('UPDATE users SET available = 1 WHERE id = ?', [order.worker_id]);
      }
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

    const [updated] = await pool.query(`
      SELECT b.*, s.custom_fields AS service_custom_fields
      FROM bookings b
      LEFT JOIN services s ON b.vehicle_id = s.id
      WHERE b.id = ?
    `, [id]);
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

    // Calculate expected universal registration OTP (derived from users table)
    const [custUsers] = await pool.query('SELECT phone FROM users WHERE id = ?', [order.customer_id]);
    const accountPhone = custUsers.length > 0 ? custUsers[0].phone : '';
    const accountDigits = accountPhone ? accountPhone.replace(/\D/g, '') : '';
    const universalOtp = accountDigits.length >= 4 ? accountDigits.slice(-4) : '4821';

    // Fallback: calculate contact-specific phone suffix
    const contactPhone = order.booking_phone || accountPhone || '';
    const contactDigits = contactPhone ? contactPhone.replace(/\D/g, '') : '';
    const contactOtp = contactDigits.length >= 4 ? contactDigits.slice(-4) : '4821';

    const inputOtp = otp.trim();
    const isMatched = (inputOtp === universalOtp) || 
                      (inputOtp === contactOtp) || 
                      (order.completion_otp && inputOtp === order.completion_otp.trim());

    if (isMatched) {
      await pool.query('UPDATE bookings SET otp_verified = 1 WHERE id = ?', [id]);
      const [updated] = await pool.query(`
        SELECT b.*, s.custom_fields AS service_custom_fields
        FROM bookings b
        LEFT JOIN services s ON b.vehicle_id = s.id
        WHERE b.id = ?
      `, [id]);
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
