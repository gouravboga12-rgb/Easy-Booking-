import pool from './db.js';

async function migrate() {
  console.log("Running migration: Alter users table to add photo, aadhar_photo, and pan_photo columns...");
  try {
    // Check if columns already exist to avoid errors
    const [columns] = await pool.query("SHOW COLUMNS FROM users");
    const colNames = columns.map(c => c.Field);

    if (!colNames.includes('photo')) {
      await pool.query("ALTER TABLE users ADD COLUMN photo LONGTEXT NULL");
      console.log("Column 'photo' added.");
    }
    if (!colNames.includes('aadhar_photo')) {
      await pool.query("ALTER TABLE users ADD COLUMN aadhar_photo LONGTEXT NULL");
      console.log("Column 'aadhar_photo' added.");
    }
    if (!colNames.includes('pan_photo')) {
      await pool.query("ALTER TABLE users ADD COLUMN pan_photo LONGTEXT NULL");
      console.log("Column 'pan_photo' added.");
    }

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
