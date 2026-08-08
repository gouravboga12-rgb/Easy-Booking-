import axios from 'axios';
import pool from '../config/db.js';

export async function sendPushNotificationToUser(userId, title, body, data = {}) {
  try {
    if (!userId) return;
    const [rows] = await pool.query('SELECT expo_push_token FROM users WHERE id = ?', [userId]);
    if (!rows || rows.length === 0) return;
    const token = rows[0].expo_push_token;
    if (!token || !token.startsWith('ExponentPushToken[')) return;

    await axios.post('https://exp.host/--/api/v2/push/send', {
      to: token,
      sound: 'default',
      title: title || 'Parrow Skills Alert',
      body: body || 'Order update notification',
      data: data,
      channelId: 'default',
      priority: 'high',
    }, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      }
    });
    console.log(`[PUSH NOTIF SUCCESS] User #${userId} | Title: ${title}`);
  } catch (e) {
    console.error('[PUSH NOTIF ERROR]', e.message);
  }
}
