const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

(async () => {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  console.log(`Connecting to database at ${host}...`);

  const pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 1
  });

  const cols = [
    { name: 'booking_name', type: 'VARCHAR(255) NULL' },
    { name: 'booking_phone', type: 'VARCHAR(50) NULL' },
    { name: 'whatsapp_phone', type: 'VARCHAR(50) NULL' },
    { name: 'email', type: 'VARCHAR(255) NULL' },
    { name: 'manual_address', type: 'TEXT NULL' }
  ];

  for (const col of cols) {
    try {
      await pool.query(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Column ${col.name} added successfully.`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`Column ${col.name} already exists.`);
      } else {
        console.error(`Error adding column ${col.name}:`, err);
      }
    }
  }

  console.log('Migration completed successfully.');
  process.exit(0);
})();
