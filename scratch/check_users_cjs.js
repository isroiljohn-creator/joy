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
    const res = await pool.query("SELECT id, name, phone, email, created_at FROM users ORDER BY id DESC LIMIT 20");
    console.log("Recent Users in DB:");
    console.table(res.rows);
  } catch (err) {
    console.error("Error executing database query:", err);
  } finally {
    await pool.end();
  }
}

main();
