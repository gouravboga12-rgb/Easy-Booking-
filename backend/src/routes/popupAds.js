import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS popup_ads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      mediaUrl LONGTEXT NOT NULL,
      redirectUrl VARCHAR(1000),
      active TINYINT(1) DEFAULT 1,
      delaySeconds INT DEFAULT 15,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await pool.query('SELECT COUNT(*) as count FROM popup_ads');
  if (rows[0].count === 0) {
    const defaultAds = [
      [
        'Exclusive Event Services Discount',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
        '/browse',
        1,
        15
      ]
    ];
    for (const ad of defaultAds) {
      await pool.query(
        'INSERT INTO popup_ads (title, mediaUrl, redirectUrl, active, delaySeconds) VALUES (?, ?, ?, ?, ?)',
        ad
      );
    }
  }
}

ensureTable().catch(err => console.error('Popup Ads table initialization error:', err));

// GET /api/popup-ads — public endpoint
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM popup_ads ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch popup ads error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/popup-ads (Admin only) — create new popup ad
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { title, mediaUrl, redirectUrl, active, delaySeconds } = req.body;
  if (!mediaUrl) {
    return res.status(400).json({ message: 'Media (Image or Video) is required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO popup_ads (title, mediaUrl, redirectUrl, active, delaySeconds)
       VALUES (?, ?, ?, ?, ?)`,
      [
        title || '',
        mediaUrl,
        redirectUrl || '',
        active !== false ? 1 : 0,
        delaySeconds ? parseInt(delaySeconds, 10) : 15
      ]
    );

    const [rows] = await pool.query('SELECT * FROM popup_ads WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create popup ad error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/popup-ads/:id (Admin only) — update popup ad
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id } = req.params;
  const { title, mediaUrl, redirectUrl, active, delaySeconds } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM popup_ads WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Popup ad not found' });
    }

    await pool.query(
      `UPDATE popup_ads
       SET title = ?, mediaUrl = ?, redirectUrl = ?, active = ?, delaySeconds = ?
       WHERE id = ?`,
      [
        title !== undefined ? title : existing[0].title,
        mediaUrl !== undefined ? mediaUrl : existing[0].mediaUrl,
        redirectUrl !== undefined ? redirectUrl : existing[0].redirectUrl,
        active !== undefined ? (active ? 1 : 0) : existing[0].active,
        delaySeconds !== undefined ? parseInt(delaySeconds, 10) : existing[0].delaySeconds,
        id
      ]
    );

    const [rows] = await pool.query('SELECT * FROM popup_ads WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Update popup ad error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/popup-ads/:id (Admin only) — delete popup ad
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM popup_ads WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Popup ad not found' });
    }
    res.json({ message: 'Popup ad deleted successfully' });
  } catch (err) {
    console.error('Delete popup ad error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
