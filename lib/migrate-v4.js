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
    console.log("🚀 Starting database hardening migration v4...");
    await client.query("BEGIN");

    // 1. Create audit_logs table
    console.log("Creating 'audit_logs' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        table_name VARCHAR(100) NOT NULL,
        record_id INTEGER NOT NULL,
        action VARCHAR(20) NOT NULL,
        old_data JSONB,
        new_data JSONB,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create audit trigger function
    console.log("Creating audit trigger function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION audit_trigger_func()
      RETURNS TRIGGER AS $$
      DECLARE
        old_val JSONB := NULL;
        new_val JSONB := NULL;
      BEGIN
        IF (TG_OP = 'DELETE') THEN
          old_val := to_jsonb(OLD);
        ELSIF (TG_OP = 'UPDATE') THEN
          old_val := to_jsonb(OLD);
          new_val := to_jsonb(NEW);
        ELSIF (TG_OP = 'INSERT') THEN
          new_val := to_jsonb(NEW);
        END IF;

        -- Mask password hashes for security
        IF (new_val ? 'password') THEN
          new_val := new_val || jsonb_build_object('password', '********');
        END IF;
        IF (old_val ? 'password') THEN
          old_val := old_val || jsonb_build_object('password', '********');
        END IF;

        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_OP, old_val, new_val);

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. Attach audit triggers to tables
    const tablesToAudit = ["users", "listings", "transactions", "erp_sales", "erp_units", "erp_leads", "erp_meetings"];
    for (const table of tablesToAudit) {
      console.log(`Attaching audit trigger to '${table}'...`);
      await client.query(`
        DROP TRIGGER IF EXISTS trg_audit_${table} ON ${table};
        CREATE TRIGGER trg_audit_${table}
        AFTER INSERT OR UPDATE OR DELETE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
      `);
    }

    // 4. Soft Delete support for listings
    console.log("Adding deleted_at column to listings...");
    await client.query(`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
    `);

    // 5. Upgrade foreign keys: CASCADE -> RESTRICT to prevent financial/agreement data loss
    console.log("Hardening transactions and sales constraints...");
    await client.query(`
      ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
      ALTER TABLE transactions ADD CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

      ALTER TABLE erp_sales DROP CONSTRAINT IF EXISTS erp_sales_unit_id_fkey;
      ALTER TABLE erp_sales ADD CONSTRAINT fk_sale_unit FOREIGN KEY (unit_id) REFERENCES erp_units(id) ON DELETE RESTRICT;

      ALTER TABLE erp_sales DROP CONSTRAINT IF EXISTS erp_sales_lead_id_fkey;
      ALTER TABLE erp_sales ADD CONSTRAINT fk_sale_lead FOREIGN KEY (lead_id) REFERENCES erp_leads(id) ON DELETE RESTRICT;
    `);

    // 6. Apply missing foreign keys for implicit columns
    console.log("Adding missing foreign keys for users references...");
    await client.query(`
      UPDATE erp_units SET reserved_by = NULL WHERE reserved_by IS NOT NULL AND reserved_by NOT IN (SELECT id FROM users);
      ALTER TABLE erp_units DROP CONSTRAINT IF EXISTS fk_unit_reserved_by;
      ALTER TABLE erp_units ADD CONSTRAINT fk_unit_reserved_by FOREIGN KEY (reserved_by) REFERENCES users(id) ON DELETE SET NULL;

      UPDATE erp_leads SET assigned_to = NULL WHERE assigned_to IS NOT NULL AND assigned_to NOT IN (SELECT id FROM users);
      ALTER TABLE erp_leads DROP CONSTRAINT IF EXISTS fk_lead_assigned_to;
      ALTER TABLE erp_leads ADD CONSTRAINT fk_lead_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

      UPDATE erp_meetings SET user_id = NULL WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);
      ALTER TABLE erp_meetings DROP CONSTRAINT IF EXISTS fk_meeting_user_id;
      ALTER TABLE erp_meetings ADD CONSTRAINT fk_meeting_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

      UPDATE erp_sales SET sold_by = NULL WHERE sold_by IS NOT NULL AND sold_by NOT IN (SELECT id FROM users);
      ALTER TABLE erp_sales DROP CONSTRAINT IF EXISTS fk_sale_sold_by;
      ALTER TABLE erp_sales ADD CONSTRAINT fk_sale_sold_by FOREIGN KEY (sold_by) REFERENCES users(id) ON DELETE SET NULL;
    `);

    // 7. Enforce strict CHECK constraints for statuses
    console.log("Adding status CHECK constraints...");
    await client.query(`
      UPDATE erp_projects SET status = 'planning' WHERE status NOT IN ('planning', 'in_progress', 'completed', 'on_hold') OR status IS NULL;
      ALTER TABLE erp_projects DROP CONSTRAINT IF EXISTS chk_project_status;
      ALTER TABLE erp_projects ADD CONSTRAINT chk_project_status CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold'));

      UPDATE erp_units SET status = 'available' WHERE status NOT IN ('available', 'reserved', 'sold') OR status IS NULL;
      ALTER TABLE erp_units DROP CONSTRAINT IF EXISTS chk_unit_status;
      ALTER TABLE erp_units ADD CONSTRAINT chk_unit_status CHECK (status IN ('available', 'reserved', 'sold'));

      UPDATE erp_leads SET status = 'new' WHERE status NOT IN ('new', 'contacted', 'meeting_scheduled', 'negotiation', 'won', 'lost') OR status IS NULL;
      ALTER TABLE erp_leads DROP CONSTRAINT IF EXISTS chk_lead_status;
      ALTER TABLE erp_leads ADD CONSTRAINT chk_lead_status CHECK (status IN ('new', 'contacted', 'meeting_scheduled', 'negotiation', 'won', 'lost'));

      UPDATE erp_meetings SET status = 'scheduled' WHERE status NOT IN ('scheduled', 'completed', 'cancelled') OR status IS NULL;
      ALTER TABLE erp_meetings DROP CONSTRAINT IF EXISTS chk_meeting_status;
      ALTER TABLE erp_meetings ADD CONSTRAINT chk_meeting_status CHECK (status IN ('scheduled', 'completed', 'cancelled'));

      UPDATE erp_sales SET status = 'active' WHERE status NOT IN ('active', 'completed', 'cancelled') OR status IS NULL;
      ALTER TABLE erp_sales DROP CONSTRAINT IF EXISTS chk_sale_status;
      ALTER TABLE erp_sales ADD CONSTRAINT chk_sale_status CHECK (status IN ('active', 'completed', 'cancelled'));
    `);

    await client.query("COMMIT");
    console.log("🎉 Database hardening migration v4 completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration v4 failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
