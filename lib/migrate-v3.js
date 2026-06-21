const { Pool } = require("pg");
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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting database migration v3...");
    await client.query("BEGIN");

    // 1. Add chk_listings_cat constraint to listings table
    console.log("Adding listings category constraint...");
    await client.query(`
      UPDATE listings SET cat = 'Yangi uylar' WHERE cat NOT IN ('Yangi uylar', 'Ikkilamchi', 'Ijara', 'Ofis') OR cat IS NULL;
    `);
    await client.query(`
      ALTER TABLE listings DROP CONSTRAINT IF EXISTS chk_listings_cat;
    `);
    await client.query(`
      ALTER TABLE listings ADD CONSTRAINT chk_listings_cat CHECK (cat IN ('Yangi uylar', 'Ikkilamchi', 'Ijara', 'Ofis'));
    `);

    // 2. Add index on listings(status, cat)
    console.log("Creating index on listings(status, cat)...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_listings_status_cat ON listings(status, cat);
    `);

    // 3. Add index on messages(sender_id, receiver_id)
    console.log("Creating index on messages(sender_id, receiver_id)...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
    `);

    // 4. Add index on transactions(user_id, status)
    console.log("Creating index on transactions(user_id, status)...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON transactions(user_id, status);
    `);

    await client.query("COMMIT");
    console.log("🎉 Migration v3 completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration v3 failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
