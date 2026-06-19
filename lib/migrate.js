const fs = require("fs");
const path = require("path");

// Load env variables manually for raw node execution
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
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Migrating database schema...");

    // Add columns to users table
    try {
      await client.query("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;");
    } catch (e) { console.log("users.is_verified may already exist or error:", e.message); }

    try {
      await client.query("ALTER TABLE users ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'free';");
    } catch (e) { console.log("users.subscription_plan may already exist or error:", e.message); }

    try {
      await client.query("ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP;");
    } catch (e) { console.log("users.subscription_expires_at may already exist or error:", e.message); }

    try {
      await client.query("ALTER TABLE users ADD COLUMN balance INT DEFAULT 0;");
    } catch (e) { console.log("users.balance may already exist or error:", e.message); }

    try {
      await client.query("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';");
    } catch (e) { console.log("users.role may already exist or error:", e.message); }

    // Add columns to listings table
    try {
      await client.query("ALTER TABLE listings ADD COLUMN top_expires_at TIMESTAMP;");
    } catch (e) { console.log("listings.top_expires_at may already exist or error:", e.message); }

    // Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        amount INT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_type VARCHAR(50) NOT NULL,
        reference_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
