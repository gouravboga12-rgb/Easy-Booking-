import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Ensure banners table exists and load mock initial values if empty
const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(255),
      image LONGTEXT,
      cta VARCHAR(255),
      page VARCHAR(255) DEFAULT 'Home Slide 1',
      active BOOLEAN DEFAULT TRUE,
      vehicleId VARCHAR(255)
    )
  `);

  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM banners LIKE 'redirectUrl'");
    if (columns.length === 0) {
      await pool.query("ALTER TABLE banners ADD COLUMN redirectUrl VARCHAR(1000)");
      console.log("Successfully added redirectUrl column to banners table.");
    }
  } catch (err) {
    console.error("Error ensuring redirectUrl column exists:", err);
  }

  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM banners LIKE 'showCta'");
    if (columns.length === 0) {
      await pool.query("ALTER TABLE banners ADD COLUMN showCta TINYINT(1) DEFAULT 1");
      console.log("Successfully added showCta column to banners table.");
    }
  } catch (err) {
    console.error("Error ensuring showCta column exists:", err);
  }

  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM banners LIKE 'showBrowseAll'");
    if (columns.length === 0) {
      await pool.query("ALTER TABLE banners ADD COLUMN showBrowseAll TINYINT(1) DEFAULT 1");
      console.log("Successfully added showBrowseAll column to banners table.");
    }
  } catch (err) {
    console.error("Error ensuring showBrowseAll column exists:", err);
  }

  const [rows] = await pool.query('SELECT COUNT(*) as count FROM banners');
  if (rows[0].count === 0) {
    const defaultBanners = [
      ['Electricians & Plumbers', 'Verified professionals at your doorstep in 60 mins', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80', 'Book Electrician', 'Home Slide 1', true, 'electricians'],
      ['Deep Cleaning Staff', 'Expert housekeepers & deep cleaning for your home', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80', 'Book Cleaner', 'Home Slide 2', true, 'cleaning-staff'],
      ['Construction & Site Labour', 'Experienced masons, welders & fabricators on demand', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', 'Book Labour', 'Home Slide 3', true, 'construction-labour'],
      ['Cooking Chefs & Home Cooks', 'Hire private chefs & daily home cooks instantly', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80', 'Book Cook', 'Home Slide 4', true, 'home-cooks'],
    ];

    for (const b of defaultBanners) {
      await pool.query(
        'INSERT INTO banners (title, subtitle, image, cta, page, active, vehicleId) VALUES (?, ?, ?, ?, ?, ?, ?)',
        b
      );
    }
  }
};
ensureTable().catch(err => console.error('Banners table initialisation error:', err));

// GET /api/banners (Public) — fetch all active banners
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY page ASC, id ASC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch banners error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/banners (Admin only) — create a new banner
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { title, subtitle, image, cta, page, active, vehicleId, redirectUrl, showCta, showBrowseAll } = req.body;
  if (!title || !image) {
    return res.status(400).json({ message: 'Title and image are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO banners (title, subtitle, image, cta, page, active, vehicleId, redirectUrl, showCta, showBrowseAll)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        subtitle || '',
        image,
        cta || 'Book Now',
        page || 'Home Slide 1',
        active !== false,
        vehicleId || '',
        redirectUrl || '',
        showCta !== false,
        showBrowseAll !== false
      ]
    );

    const [rows] = await pool.query('SELECT * FROM banners WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create banner error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/banners/:id (Admin only) — update a banner
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id } = req.params;
  const { title, subtitle, image, cta, page, active, vehicleId, redirectUrl, showCta, showBrowseAll } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    await pool.query(
      `UPDATE banners 
       SET title = ?, subtitle = ?, image = ?, cta = ?, page = ?, active = ?, vehicleId = ?, redirectUrl = ?, showCta = ?, showBrowseAll = ?
       WHERE id = ?`,
      [
        title !== undefined ? title : existing[0].title,
        subtitle !== undefined ? subtitle : existing[0].subtitle,
        image !== undefined ? image : existing[0].image,
        cta !== undefined ? cta : existing[0].cta,
        page !== undefined ? page : existing[0].page,
        active !== undefined ? active : existing[0].active,
        vehicleId !== undefined ? vehicleId : existing[0].vehicleId,
        redirectUrl !== undefined ? redirectUrl : existing[0].redirectUrl,
        showCta !== undefined ? showCta : existing[0].showCta,
        showBrowseAll !== undefined ? showBrowseAll : existing[0].showBrowseAll,
        id
      ]
    );

    const [rows] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Update banner error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/banners/:id (Admin only) — delete a banner
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access required' });
  }

  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    await pool.query('DELETE FROM banners WHERE id = ?', [id]);
    res.json({ message: 'Banner deleted successfully' });
  } catch (err) {
    console.error('Delete banner error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
