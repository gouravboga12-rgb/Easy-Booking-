import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
});

try {
  // Check if time_slot column exists
  const [cols] = await pool.query(`SHOW COLUMNS FROM bookings LIKE 'time_slot'`);
  if (cols.length === 0) {
    console.log('time_slot column MISSING — adding it now...');
    await pool.query(`ALTER TABLE bookings ADD COLUMN time_slot VARCHAR(100) NULL AFTER booking_date`);
    console.log('✅ time_slot column added successfully.');
  } else {
    console.log('✅ time_slot column already EXISTS:', JSON.stringify(cols[0]));
  }

  // Show a sample of recent scheduled orders to verify data
  const [sample] = await pool.query(
    `SELECT id, booking_type, booking_date, time_slot FROM bookings WHERE booking_type='scheduled' ORDER BY created_at DESC LIMIT 5`
  );
  console.log('Recent scheduled orders:');
  sample.forEach(r => console.log(`  #${r.id} | date=${r.booking_date} | time_slot=${r.time_slot}`));
} catch(e) {
  console.error('Migration error:', e.message);
} finally {
  await pool.end();
}
