import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/services — Public: fetch all services
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM services ORDER BY category, sort_order ASC');
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

  const { id, name, desc, category, categoryLabel, rate, unit, image } = req.body;
  if (!id || !name || !category || !rate || !unit) {
    return res.status(400).json({ message: 'Missing required fields: id, name, category, rate, unit' });
  }

  try {
    await pool.query(
      `INSERT INTO services (id, name, \`desc\`, category, category_label, rate, unit, image, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 99)`,
      [id, name, desc || '', category, categoryLabel || category, Number(rate), unit, image || '']
    );
    const [created] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    res.status(201).json(created[0]);
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
  const { name, desc, category, categoryLabel, rate, unit, image } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await pool.query(
      `UPDATE services SET name = ?, \`desc\` = ?, category = ?, category_label = ?, rate = ?, unit = ?, image = ?
       WHERE id = ?`,
      [name, desc, category, categoryLabel || category, Number(rate), unit, image, id]
    );
    const [updated] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    res.json(updated[0]);
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
