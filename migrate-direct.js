import mysql from 'mysql2/promise';

const config = {
  host: 'database-1.cta24ek0qs5d.ap-southeast-2.rds.amazonaws.com',
  user: 'admin',
  password: 'j3Baif9bQUA9pYc',
  database: 'parrowskills',
  port: 3306
};

async function run() {
  const c = await mysql.createConnection(config);
  console.log("Connected to RDS.");
  try {
    await c.query("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'assigned', 'active', 'arrived', 'completed', 'cancelled') DEFAULT 'pending'");
    console.log("ENUM updated!");
  } catch(e) {
    console.log("ENUM error:", e.message);
  }
  try {
    await c.query("ALTER TABLE bookings ADD COLUMN worker_message VARCHAR(255) NULL");
    console.log("worker_message added!");
  } catch(e) {
    console.log("worker_message error:", e.message);
  }
  try {
    await c.query("ALTER TABLE bookings ADD COLUMN rejected_workers TEXT NULL");
    console.log("rejected_workers added!");
  } catch(e) {
    console.log("rejected_workers error:", e.message);
  }
  await c.end();
  console.log("Migration script execution completed!");
  process.exit(0);
}
run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
