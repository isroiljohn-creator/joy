const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Load env variables manually
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

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("🔄 Agentlik tizimi migratsiyasi boshlanmoqda...");

    // 1. agencies jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS agencies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        logo TEXT,
        description TEXT,
        phone VARCHAR(50),
        website TEXT,
        address TEXT,
        owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        listing_quota INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ 'agencies' jadvali yaratildi (yoki allaqachon mavjud).");

    // 2. agency_members jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS agency_members (
        id SERIAL PRIMARY KEY,
        agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'agent',
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(agency_id, user_id)
      );
    `);
    console.log("✅ 'agency_members' jadvali yaratildi (yoki allaqachon mavjud).");

    // 3. reviews jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reviewed_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ 'reviews' jadvali yaratildi (yoki allaqachon mavjud).");

    // 4. users jadvaliga agency_id ustuni qo'shamiz
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL;
    `);
    console.log("✅ users.agency_id ustuni qo'shildi.");

    // 5. listings jadvaliga agency_id ustuni qo'shamiz
    await client.query(`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL;
    `);
    console.log("✅ listings.agency_id ustuni qo'shildi.");

    // 6. messages jadvaliga assigned_to va agency_id ustunlari
    await client.query(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;
    `);
    await client.query(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL;
    `);
    console.log("✅ messages jadvaliga assigned_to va agency_id ustunlari qo'shildi.");

    // 7. verification_codes jadvali (agar mavjud bo'lmasa)
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(50) NOT NULL,
        code VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ 'verification_codes' jadvali yaratildi (yoki allaqachon mavjud).");

    console.log("\n🎉 Barcha migratsiyalar muvaffaqiyatli yakunlandi!");
  } catch (err) {
    console.error("❌ Migratsiyada xatolik:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
