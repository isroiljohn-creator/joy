const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

// Load env variables manually for raw node execution if .env exists
try {
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach(line => {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env file", e);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Adding email column to users table if not exists...");
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE;
    `);
    
    console.log("Updating email addresses for seeded users...");
    await client.query("UPDATE users SET email = 'aziz@gmail.com' WHERE id = 1");
    await client.query("UPDATE users SET email = 'dilnoza@gmail.com' WHERE id = 2");
    
    console.log("Database update completed successfully.");
  } catch (err) {
    console.error("Error updating database:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
