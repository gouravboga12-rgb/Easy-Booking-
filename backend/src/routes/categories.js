import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM service_categories ORDER BY label ASC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/categories (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id, label, icon, image_url, color, icon_name, labour_types } = req.body;
  if (!id || !label) {
    return res.status(400).json({ message: 'Category ID and label are required' });
  }

  try {
    const labourJson = labour_types ? (typeof labour_types === 'string' ? labour_types : JSON.stringify(labour_types)) : '[]';
    await pool.query(
      `INSERT INTO service_categories (id, label, icon, image_url, color, icon_name, labour_types)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, label, icon || '📦', image_url || '', color || '#6d28d9', icon_name || 'MdBuild', labourJson]
    );

    const [rows] = await pool.query('SELECT * FROM service_categories WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/categories/:id (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id } = req.params;
  const { label, icon, image_url, color, icon_name, labour_types } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM service_categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const labourJson = labour_types ? (typeof labour_types === 'string' ? labour_types : JSON.stringify(labour_types)) : undefined;

    await pool.query(
      `UPDATE service_categories SET
        label = COALESCE(?, label),
        icon = COALESCE(?, icon),
        image_url = COALESCE(?, image_url),
        color = COALESCE(?, color),
        icon_name = COALESCE(?, icon_name),
        labour_types = COALESCE(?, labour_types)
       WHERE id = ?`,
      [label, icon, image_url, color, icon_name, labourJson, id]
    );

    const [rows] = await pool.query('SELECT * FROM service_categories WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/categories/:id (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT * FROM service_categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await pool.query('DELETE FROM service_categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
