import pool from './db.js';
import bcrypt from 'bcrypt';

async function init() {
  console.log("Initializing database tables on RDS MySQL...");
  try {
    // 0. Drop existing tables to recreate with new schema
    await pool.query("DROP TABLE IF EXISTS bookings");
    await pool.query("DROP TABLE IF EXISTS users");
    console.log("Existing tables dropped.");

    // 1. Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('customer', 'worker', 'admin') NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        vehicle_details VARCHAR(255),
        rating DECIMAL(3, 2) DEFAULT 5.00,
        skills JSON,
        categories JSON,
        radius INT DEFAULT 10,
        address VARCHAR(255),
        pan VARCHAR(50),
        aadhar VARCHAR(50),
        bank VARCHAR(255),
        available TINYINT(1) DEFAULT 1,
        approved TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Users table created or verified.");

    // 2. Create Bookings Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(255) PRIMARY KEY,
        customer_id VARCHAR(255),
        worker_id VARCHAR(255),
        status ENUM('pending', 'assigned', 'active', 'completed', 'cancelled') DEFAULT 'pending',
        location TEXT NOT NULL,
        booking_date VARCHAR(50) NOT NULL,
        duration INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        vehicle_id VARCHAR(100) NOT NULL,
        booking_type VARCHAR(50) DEFAULT 'instant',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log("Bookings table created or verified.");

    // 3. Seed Users
    const saltRounds = 10;
    const adminHash = await bcrypt.hash('Ak39@3901', saltRounds);
    const workerHash = await bcrypt.hash('worker123', saltRounds);
    const custHash = await bcrypt.hash('cust123', saltRounds);

    const demoUsers = [
      ['a1', 'tameemansarkhan@gmail.com', adminHash, 'admin', 'Admin User', '+91 98000 00001', null, 5.00, '[]', '[]', 10, 'Admin HQ, Sydney', null, null, null, 1, 1],
      ['w1', 'ravi@parrowskills.in', workerHash, 'worker', 'Ravi Kumar', '+91 98765 43210', 'Electrician • Lic. 09384', 4.80, JSON.stringify(['Wiring', 'Panel Repair', 'Short Circuit Detection']), JSON.stringify(['professionals']), 10, 'Marathahalli, Bangalore, KA', 'ABCDE1234F', '123456789012', 'Acct: 918273645, IFSC: SBIN0001234', 1, 1],
      ['w2', 'suresh@parrowskills.in', workerHash, 'worker', 'Suresh Reddy', '+91 97654 32109', 'Plumber • Lic. 48291', 4.60, JSON.stringify(['Tap repair', 'Pipe leaks', 'Water Tank cleaning']), JSON.stringify(['professionals']), 15, 'Indiranagar, Bangalore, KA', 'FGHIJ5678K', '987654321098', 'Acct: 109283746, IFSC: ICIC0000456', 1, 1],
      ['w3', 'mohan@parrowskills.in', workerHash, 'worker', 'Mohan Das', '+91 96543 21098', 'Mason • Exp. 8 Yrs', 4.90, JSON.stringify(['Plastering', 'Cement work', 'Brick laying']), JSON.stringify(['construction-labour']), 8, 'Whitefield, Bangalore, KA', 'LMNOP9012Q', '543210987654', 'Acct: 564738291, IFSC: HDFC0000789', 0, 0],
      ['c1', 'customer@parrowskills.in', custHash, 'customer', 'Arjun Sharma', '+91 95432 10987', null, 5.00, '[]', '[]', 10, 'Sydney, AU', null, null, null, 1, 1]
    ];

    for (const u of demoUsers) {
      await pool.query(`
        INSERT INTO users (id, email, password_hash, role, name, phone, vehicle_details, rating, skills, categories, radius, address, pan, aadhar, bank, available, approved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE email=VALUES(email), name=VALUES(name), phone=VALUES(phone)
      `, u);
    }
    console.log("Demo users seeded successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exit(1);
  }
}

init();
