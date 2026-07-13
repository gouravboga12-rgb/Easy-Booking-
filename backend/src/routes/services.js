import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/services — Public: fetch all services
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM services ORDER BY category, sort_order ASC');
    rows.forEach(r => {
      if (typeof r.custom_fields === 'string') {
        try {
          r.custom_fields = JSON.parse(r.custom_fields);
        } catch (e) {
          r.custom_fields = [];
        }
      }
      r.custom_fields = r.custom_fields || [];
    });
    res.json(rows);
  } catch (err) {
    console.error('Fetch services error:', err);
    res.status(500).json({ message: 'Server error fetching services' });
  }
});

// POST /api/services — Admin only: add a new service
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id, name, desc, category, categoryLabel, rate, unit, image, custom_fields } = req.body;
  if (!id || !name || !category || !rate || !unit) {
    return res.status(400).json({ message: 'Missing required fields: id, name, category, rate, unit' });
  }

  try {
    const customFieldsJson = custom_fields ? JSON.stringify(custom_fields) : '[]';
    await pool.query(
      `INSERT INTO services (id, name, \`desc\`, category, category_label, rate, unit, image, custom_fields, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 99)`,
      [id, name, desc || '', category, categoryLabel || category, Number(rate), unit, image || '', customFieldsJson]
    );
    const [created] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    const service = created[0];
    if (typeof service.custom_fields === 'string') {
      try { service.custom_fields = JSON.parse(service.custom_fields); } catch (e) { service.custom_fields = []; }
    }
    res.status(201).json(service);
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ message: 'Server error creating service' });
  }
});

// PUT /api/services/:id — Admin only: update a service
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id } = req.params;
  const { name, desc, category, categoryLabel, rate, unit, image, custom_fields } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const customFieldsJson = custom_fields ? JSON.stringify(custom_fields) : undefined;

    await pool.query(
      `UPDATE services SET 
        name = ?, 
        \`desc\` = ?, 
        category = ?, 
        category_label = ?, 
        rate = ?, 
        unit = ?, 
        image = ?,
        custom_fields = COALESCE(?, custom_fields)
       WHERE id = ?`,
      [name, desc, category, categoryLabel || category, Number(rate), unit, image, customFieldsJson, id]
    );
    const [updated] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    const service = updated[0];
    if (typeof service.custom_fields === 'string') {
      try { service.custom_fields = JSON.parse(service.custom_fields); } catch (e) { service.custom_fields = []; }
    }
    res.json(service);
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ message: 'Server error updating service' });
  }
});

// DELETE /api/services/:id — Admin only: delete a service
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id } = req.params;
  try {
    const [existing] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    await pool.query('DELETE FROM services WHERE id = ?', [id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ message: 'Server error deleting service' });
  }
});

export default router;
