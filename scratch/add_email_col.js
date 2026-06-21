const pg = require('pg');
const fs = require('fs');
const path = require('path');

// Parse .env manually
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
if (!match) {
  console.error("Could not find DATABASE_URL in .env");
  process.exit(1);
}
const connectionString = match[1];

const { Pool } = pg;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Checking if email column exists...");
    const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='email'
    `);
    
    if (checkRes.rows.length === 0) {
      console.log("Adding column email to users...");
      await pool.query("ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE");
      console.log("Column email added successfully.");
    } else {
      console.log("Column email already exists.");
    }
  } catch (err) {
    console.error("Error executing database query:", err);
  } finally {
    await pool.end();
  }
}

main();
