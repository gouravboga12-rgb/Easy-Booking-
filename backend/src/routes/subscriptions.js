import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/subscriptions (Public/Authenticated)
router.get('/', async (req, res) => {
  try {
    const [plans] = await pool.query('SELECT * FROM subscription_plans ORDER BY price ASC');
    // Parse features JSON for each plan
    plans.forEach(p => {
      if (typeof p.features === 'string') {
        try {
          p.features = JSON.parse(p.features);
        } catch (e) {
          p.features = [];
        }
      }
      p.features = p.features || [];
    });
    res.json(plans);
  } catch (err) {
    console.error('Fetch subscription plans error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/subscriptions (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { name, price, duration, duration_unit, description, features, active, type } = req.body;
  if (!name || price === undefined || duration === undefined) {
    return res.status(400).json({ message: 'Name, price, and duration are required' });
  }

  try {
    const featuresJson = features ? JSON.stringify(features) : '[]';
    const [result] = await pool.query(
      `INSERT INTO subscription_plans (name, price, duration, duration_unit, description, features, active, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, price, duration, duration_unit || 'month', description || '', featuresJson, active !== undefined ? active : 1, type || 'worker']
    );

    const [created] = await pool.query('SELECT * FROM subscription_plans WHERE id = ?', [result.insertId]);
    const plan = created[0];
    if (typeof plan.features === 'string') {
      try { plan.features = JSON.parse(plan.features); } catch (e) { plan.features = []; }
    }
    res.status(201).json(plan);
  } catch (err) {
    console.error('Create subscription plan error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/subscriptions/:id (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id } = req.params;
  const { name, price, duration, duration_unit, description, features, active, type } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM subscription_plans WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    const current = existing[0];
    const featuresJson = features ? JSON.stringify(features) : undefined;

    await pool.query(
      `UPDATE subscription_plans SET
        name = COALESCE(?, name),
        price = COALESCE(?, price),
        duration = COALESCE(?, duration),
        duration_unit = COALESCE(?, duration_unit),
        description = COALESCE(?, description),
        features = COALESCE(?, features),
        active = COALESCE(?, active),
        type = COALESCE(?, type)
       WHERE id = ?`,
      [name, price, duration, duration_unit, description, featuresJson, active, type, id]
    );

    const [updated] = await pool.query('SELECT * FROM subscription_plans WHERE id = ?', [id]);
    const plan = updated[0];
    if (typeof plan.features === 'string') {
      try { plan.features = JSON.parse(plan.features); } catch (e) { plan.features = []; }
    }
    res.json(plan);
  } catch (err) {
    console.error('Update subscription plan error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/subscriptions/:id (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT * FROM subscription_plans WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    await pool.query('DELETE FROM subscription_plans WHERE id = ?', [id]);
    res.json({ message: 'Subscription plan deleted successfully' });
  } catch (err) {
    console.error('Delete subscription plan error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
