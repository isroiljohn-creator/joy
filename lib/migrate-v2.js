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
    console.log("🚀 Starting database migration v2...");
    await client.query("BEGIN");

    // 1. users table: Add check constraint for non-negative balance
    console.log("Adding users balance constraint...");
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_balance;
    `);
    await client.query(`
      ALTER TABLE users ADD CONSTRAINT chk_user_balance CHECK (balance >= 0);
    `);

    // 2. transactions table: Add check constraint for transaction status
    console.log("Adding transactions status constraint...");
    await client.query(`
      ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_tx_status;
    `);
    await client.query(`
      ALTER TABLE transactions ADD CONSTRAINT chk_tx_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));
    `);

    // 3. verification_codes table: Add is_used column
    console.log("Adding verification_codes.is_used column...");
    await client.query(`
      ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE;
    `);

    // 4. reviews table: Remove duplicate reviews and add unique constraint
    console.log("Cleaning duplicate reviews...");
    await client.query(`
      DELETE FROM reviews a USING reviews b
      WHERE a.id < b.id 
        AND a.reviewer_id = b.reviewer_id 
        AND a.reviewed_user_id = b.reviewed_user_id 
        AND (a.listing_id = b.listing_id OR (a.listing_id IS NULL AND b.listing_id IS NULL));
    `);
    
    console.log("Adding reviews unique constraint...");
    await client.query(`
      ALTER TABLE reviews DROP CONSTRAINT IF EXISTS uq_reviewer_reviewed_listing;
    `);
    await client.query(`
      ALTER TABLE reviews ADD CONSTRAINT uq_reviewer_reviewed_listing UNIQUE(reviewer_id, reviewed_user_id, listing_id);
    `);

    // 5. erp_units table: Remove duplicate unit numbers per project and add unique constraint
    console.log("Cleaning duplicate erp_units...");
    await client.query(`
      DELETE FROM erp_units a USING erp_units b
      WHERE a.id < b.id
        AND a.project_id = b.project_id
        AND a.unit_number = b.unit_number;
    `);

    console.log("Adding erp_units unique constraint...");
    await client.query(`
      ALTER TABLE erp_units DROP CONSTRAINT IF EXISTS uq_project_unit;
    `);
    await client.query(`
      ALTER TABLE erp_units ADD CONSTRAINT uq_project_unit UNIQUE(project_id, unit_number);
    `);

    // 6. erp_units table: Add foreign key for listing_id
    console.log("Adding erp_units foreign key constraint for listing_id...");
    await client.query(`
      ALTER TABLE erp_units DROP CONSTRAINT IF EXISTS fk_unit_listing;
    `);
    await client.query(`
      ALTER TABLE erp_units ADD CONSTRAINT fk_unit_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL;
    `);

    // 7. Add agency_id to erp_projects, erp_units, erp_leads, erp_meetings, and erp_sales
    console.log("Adding agency_id columns to ERP tables...");
    const erpTables = ["erp_projects", "erp_units", "erp_leads", "erp_meetings", "erp_sales"];
    for (const table of erpTables) {
      await client.query(`
        ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE;
      `);
    }

    // 8. Seed default agency_id for existing ERP records (link to the first agency)
    console.log("Seeding default agency_id for existing ERP records...");
    const { rows: agencies } = await client.query("SELECT id FROM agencies LIMIT 1");
    if (agencies.length > 0) {
      const defaultAgencyId = agencies[0].id;
      for (const table of erpTables) {
        await client.query(`
          UPDATE ${table} SET agency_id = $1 WHERE agency_id IS NULL;
        `, [defaultAgencyId]);
      }
      console.log(`Associated existing ERP data with Agency ID: ${defaultAgencyId}`);
    } else {
      console.log("No agencies found, leaving agency_id columns NULL for now.");
    }

    await client.query("COMMIT");
    console.log("🎉 Migration v2 completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration v2 failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
