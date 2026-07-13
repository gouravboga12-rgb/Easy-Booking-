import pool from './db.js';

async function migrate() {
  console.log("Running migrations for Mapbox live tracking...");
  try {
    const [columnsUsers] = await pool.query("SHOW COLUMNS FROM users");
    const colNamesUsers = columnsUsers.map(c => c.Field);

    if (!colNamesUsers.includes('photo')) {
      await pool.query("ALTER TABLE users ADD COLUMN photo LONGTEXT NULL");
      console.log("Column 'photo' added to users.");
    }
    if (!colNamesUsers.includes('aadhar_photo')) {
      await pool.query("ALTER TABLE users ADD COLUMN aadhar_photo LONGTEXT NULL");
      console.log("Column 'aadhar_photo' added to users.");
    }
    if (!colNamesUsers.includes('pan_photo')) {
      await pool.query("ALTER TABLE users ADD COLUMN pan_photo LONGTEXT NULL");
      console.log("Column 'pan_photo' added to users.");
    }

    // Bookings table coordinates
    const [columnsBookings] = await pool.query("SHOW COLUMNS FROM bookings");
    const colNamesBookings = columnsBookings.map(c => c.Field);

    if (!colNamesBookings.includes('customer_lat')) {
      await pool.query("ALTER TABLE bookings ADD COLUMN customer_lat DECIMAL(10, 8) NULL");
      console.log("Column 'customer_lat' added to bookings.");
    }
    if (!colNamesBookings.includes('customer_lng')) {
      await pool.query("ALTER TABLE bookings ADD COLUMN customer_lng DECIMAL(11, 8) NULL");
      console.log("Column 'customer_lng' added to bookings.");
    }
    if (!colNamesBookings.includes('worker_message')) {
      await pool.query("ALTER TABLE bookings ADD COLUMN worker_message VARCHAR(255) NULL");
      console.log("Column 'worker_message' added to bookings.");
    }
    if (!colNamesBookings.includes('rejected_workers')) {
      await pool.query("ALTER TABLE bookings ADD COLUMN rejected_workers TEXT NULL");
      console.log("Column 'rejected_workers' added to bookings.");
    }
    if (!colNamesBookings.includes('completion_photos')) {
      await pool.query("ALTER TABLE bookings ADD COLUMN completion_photos LONGTEXT NULL");
      console.log("Column 'completion_photos' added to bookings.");
    }
    // Update bookings status column ENUM to include 'arrived' status
    await pool.query("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'assigned', 'active', 'arrived', 'completed', 'cancelled') DEFAULT 'pending'");
    console.log("Bookings status ENUM updated to include 'arrived'.");

    // Create worker_locations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS worker_locations (
        worker_id VARCHAR(255) PRIMARY KEY,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Table 'worker_locations' verified/created.");

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();

