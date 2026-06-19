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
    // 1. Check if column exists
    const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='listings' AND column_name='has_mortgage'
    `);
    
    if (checkRes.rows.length === 0) {
      console.log("Adding column has_mortgage...");
      await pool.query("ALTER TABLE listings ADD COLUMN has_mortgage BOOLEAN DEFAULT false");
      console.log("Column added successfully.");
    } else {
      console.log("Column has_mortgage already exists.");
    }

    // Update existing listings so that some have has_mortgage = true and some false
    // let's make it so listings with id % 2 === 0 have mortgage = true for testing
    await pool.query("UPDATE listings SET has_mortgage = true WHERE id % 2 = 0");
    await pool.query("UPDATE listings SET has_mortgage = false WHERE id % 2 != 0");
    console.log("Mock data for has_mortgage updated.");

    const sample = await pool.query("SELECT id, type, has_mortgage FROM listings LIMIT 5");
    console.log("Sample listings:", sample.rows);
  } catch (err) {
    console.error("Error executing database query:", err);
  } finally {
    await pool.end();
  }
}

main();
