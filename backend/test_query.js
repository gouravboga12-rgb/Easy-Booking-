import pool from './src/config/db.js';

async function test() {
  try {
    const [workers] = await pool.query('SELECT id, name, categories, skills, vehicle_details, available, city, radius FROM users WHERE role = "worker"');
    console.log('=== WORKERS IN DB ===');
    console.log(workers);

    const [orders] = await pool.query(`
      SELECT b.id, b.status, b.vehicle_id, b.location, b.customer_lat, b.customer_lng,
             s.name as service_name, s.category as service_category
      FROM bookings b
      LEFT JOIN services s ON b.vehicle_id = s.id
      WHERE b.status = 'pending'
    `);
    console.log('=== PENDING ORDERS IN DB ===');
    console.log(orders);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

test();
