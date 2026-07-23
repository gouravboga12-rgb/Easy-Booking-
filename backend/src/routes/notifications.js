import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Ensure notifications table exists
const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      channel ENUM('push', 'sms', 'email') DEFAULT 'push',
      audience ENUM('all', 'workers', 'customers') DEFAULT 'all',
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      recipients INT DEFAULT 0
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      user_id VARCHAR(255) NOT NULL,
      notification_id INT NOT NULL,
      cleared TINYINT DEFAULT 1,
      PRIMARY KEY (user_id, notification_id)
    )
  `);
};
ensureTable().catch(err => console.error('Notifications table error:', err));

// GET /api/notifications — fetch all notifications (newest first)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications ORDER BY sent_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/notifications/for/:role — fetch notifications for a specific role
router.get('/for/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const audience = role === 'worker' ? ['all', 'workers'] : ['all', 'customers'];
    
    // Check if user is authenticated (optional, fallback to all notifications if no token)
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (jwtErr) {
        // ignore jwt verify error, proceed without userId filtering
      }
    }

    let rows;
    if (userId) {
      [rows] = await pool.query(
        `SELECT n.* FROM notifications n
         LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = ?
         WHERE n.audience IN (?) AND (un.cleared IS NULL OR un.cleared = 0)
         ORDER BY n.sent_at DESC LIMIT 50`,
        [userId, audience]
      );
    } else {
      [rows] = await pool.query(
        'SELECT * FROM notifications WHERE audience IN (?) ORDER BY sent_at DESC LIMIT 50',
        [audience]
      );
    }
    res.json(rows);
  } catch (err) {
    console.error('Fetch notifications for role error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/notifications/clear-all — clear all current notifications for user
router.post('/clear-all', authenticateToken, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ message: 'Notification IDs array is required' });
    }
    const userId = req.user.id;
    for (const notifId of notificationIds) {
      await pool.query(
        'INSERT IGNORE INTO user_notifications (user_id, notification_id) VALUES (?, ?)',
        [userId, notifId]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Clear notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/notifications — admin sends a notification (requires auth)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, body, channel, audience, recipients } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO notifications (title, body, channel, audience, recipients) VALUES (?, ?, ?, ?, ?)',
      [title, body, channel || 'push', audience || 'all', recipients || 0]
    );
    const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/notifications/:id — admin deletes a notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
