const { Pool } = require("pg");
const { hashPassword } = require("./hash");
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
    console.log("🚀 Starting ERP & CRM database migration...");

    // 1. Drop existing ERP tables if they exist (for a clean seed)
    await client.query("DROP TABLE IF EXISTS erp_sales CASCADE;");
    await client.query("DROP TABLE IF EXISTS erp_meetings CASCADE;");
    await client.query("DROP TABLE IF EXISTS erp_leads CASCADE;");
    await client.query("DROP TABLE IF EXISTS erp_units CASCADE;");
    await client.query("DROP TABLE IF EXISTS erp_projects CASCADE;");

    console.log("🧹 Dropped old ERP tables.");

    // 2. Create erp_projects
    await client.query(`
      CREATE TABLE erp_projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        budget BIGINT,
        status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'in_progress', 'completed', 'on_hold'
        start_date DATE,
        end_date DATE,
        progress_kotlovan INTEGER DEFAULT 0,
        progress_brick INTEGER DEFAULT 0,
        progress_facade INTEGER DEFAULT 0,
        progress_interior INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Created 'erp_projects' table.");

    // 3. Create erp_units
    await client.query(`
      CREATE TABLE erp_units (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES erp_projects(id) ON DELETE CASCADE,
        unit_number VARCHAR(50) NOT NULL,
        floor INTEGER,
        area NUMERIC(10, 2),
        rooms INTEGER,
        price BIGINT,
        status VARCHAR(50) DEFAULT 'available', -- 'available', 'reserved', 'sold'
        reserved_until TIMESTAMP,
        reserved_by INTEGER, -- REFERENCES users(id) handled manually to avoid cascading/circular dependency
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Created 'erp_units' table.");

    // 4. Create erp_leads
    await client.query(`
      CREATE TABLE erp_leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        source VARCHAR(100), -- 'website', 'telegram', 'instagram', 'recommendation', 'walk_in'
        status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'meeting_scheduled', 'negotiation', 'won', 'lost'
        budget BIGINT,
        notes TEXT,
        assigned_to INTEGER, -- REFERENCES users(id) handled manually
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Created 'erp_leads' table.");

    // 5. Create erp_meetings
    await client.query(`
      CREATE TABLE erp_meetings (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES erp_leads(id) ON DELETE CASCADE,
        user_id INTEGER, -- responsible seller
        scheduled_time TIMESTAMP NOT NULL,
        location VARCHAR(255) DEFAULT 'Ofis',
        notes TEXT,
        status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Created 'erp_meetings' table.");

    // 6. Create erp_sales
    await client.query(`
      CREATE TABLE erp_sales (
        id SERIAL PRIMARY KEY,
        unit_id INTEGER REFERENCES erp_units(id) ON DELETE CASCADE,
        lead_id INTEGER REFERENCES erp_leads(id) ON DELETE CASCADE,
        sold_price BIGINT NOT NULL,
        payment_plan VARCHAR(50) DEFAULT 'cash', -- 'cash', 'installments', 'mortgage'
        initial_payment BIGINT DEFAULT 0,
        paid_amount BIGINT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
        sold_by INTEGER, -- responsible seller
        sold_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Created 'erp_sales' table.");

    // 7. Seed ERP specific users or update existing ones
    console.log("👥 Seeding users...");
    const seedUsers = [
      { name: "Alisher Usmonov", phone: "+998 90 999 99 99", password: "password", role: "owner" },
      { name: "Sardor Raximov", phone: "+998 90 888 88 88", password: "password", role: "rop" },
      { name: "Jasur Alimov", phone: "+998 90 777 77 77", password: "password", role: "seller" },
      { name: "Madina Karimova", phone: "+998 90 666 66 66", password: "password", role: "seller" }
    ];

    for (const u of seedUsers) {
      // Check if user exists
      const { rows } = await client.query("SELECT id FROM users WHERE phone = $1", [u.phone]);
      const hashedPassword = hashPassword(u.password);
      if (rows.length > 0) {
        // Update user
        await client.query(
          "UPDATE users SET name = $1, password = $2, role = $3 WHERE phone = $4",
          [u.name, hashedPassword, u.role, u.phone]
        );
      } else {
        // Insert user
        await client.query(
          "INSERT INTO users (name, phone, password, role) VALUES ($1, $2, $3, $4)",
          [u.name, u.phone, hashedPassword, u.role]
        );
      }
    }
    console.log("✅ Seeded ERP users.");

    // Retrieve user IDs for seeding leads, meetings, and sales
    const userIds = {};
    const { rows: dbUsers } = await client.query("SELECT id, role FROM users");
    dbUsers.forEach(u => {
      userIds[u.role] = u.id;
      // also keep a list of sellers
      if (u.role === 'seller') {
        if (!userIds.sellers) userIds.sellers = [];
        userIds.sellers.push(u.id);
      }
    });

    const seller1Id = userIds.sellers?.[0] || 1;
    const seller2Id = userIds.sellers?.[1] || seller1Id;

    // 8. Seed erp_projects
    console.log("🏗️ Seeding projects...");
    const projectInsert = await client.query(`
      INSERT INTO erp_projects (name, description, location, budget, status, start_date, end_date, progress_kotlovan, progress_brick, progress_facade, progress_interior)
      VALUES 
      ('Olmazor City B-4', 'Premium klassdagi 16 qavatli turar joy majmuasi', 'Olmazor tumani, Toshkent', 25000000000, 'in_progress', '2025-01-10', '2026-12-30', 100, 80, 40, 15) RETURNING id;
    `);
    const project1Id = projectInsert.rows[0].id;

    const project2Insert = await client.query(`
      INSERT INTO erp_projects (name, description, location, budget, status, start_date, end_date, progress_kotlovan, progress_brick, progress_facade, progress_interior)
      VALUES 
      ('Chilonzor Deluxe', 'Shinam 9 qavatli g''ishtli uy loyihasi, yopiq hovli va yer osti avtoturargohi bilan', 'Chilonzor 6-kvartal, Toshkent', 12000000000, 'in_progress', '2025-05-15', '2026-08-30', 100, 45, 10, 0) RETURNING id;
    `);
    const project2Id = project2Insert.rows[0].id;

    const project3Insert = await client.query(`
      INSERT INTO erp_projects (name, description, location, budget, status, start_date, end_date, progress_kotlovan, progress_brick, progress_facade, progress_interior)
      VALUES 
      ('Yunusobod Heights', 'Biznes klassdagi osmono''par majmua', 'Yunusobod 19-kvartal, Toshkent', 45000000000, 'planning', '2026-09-01', '2028-06-30', 10, 0, 0, 0) RETURNING id;
    `);
    const project3Id = project3Insert.rows[0].id;

    console.log("✅ Seeded 3 projects.");

    // 9. Seed erp_units (Apartments for project 1 and 2)
    console.log("🏢 Seeding units (apartments)...");
    const units = [
      // Project 1: Olmazor City B-4 (8 units: floors 1-3)
      { project_id: project1Id, unit_number: "101", floor: 1, area: 54.5, rooms: 2, price: 420000000, status: "sold" },
      { project_id: project1Id, unit_number: "102", floor: 1, area: 78.2, rooms: 3, price: 610000000, status: "sold" },
      { project_id: project1Id, unit_number: "201", floor: 2, area: 54.5, rooms: 2, price: 430000000, status: "reserved", reserved_until: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
      { project_id: project1Id, unit_number: "202", floor: 2, area: 78.2, rooms: 3, price: 620000000, status: "available" },
      { project_id: project1Id, unit_number: "301", floor: 3, area: 54.5, rooms: 2, price: 440000000, status: "available" },
      { project_id: project1Id, unit_number: "302", floor: 3, area: 78.2, rooms: 3, price: 630000000, status: "available" },
      { project_id: project1Id, unit_number: "401", floor: 4, area: 102.0, rooms: 4, price: 820000000, status: "available" },
      { project_id: project1Id, unit_number: "402", floor: 4, area: 102.0, rooms: 4, price: 820000000, status: "sold" },

      // Project 2: Chilonzor Deluxe (8 units)
      { project_id: project2Id, unit_number: "11", floor: 1, area: 42.0, rooms: 1, price: 340000000, status: "sold" },
      { project_id: project2Id, unit_number: "12", floor: 1, area: 65.0, rooms: 2, price: 510000000, status: "available" },
      { project_id: project2Id, unit_number: "21", floor: 2, area: 42.0, rooms: 1, price: 350000000, status: "available" },
      { project_id: project2Id, unit_number: "22", floor: 2, area: 65.0, rooms: 2, price: 520000000, status: "reserved", reserved_until: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }, // Expired reservation!
      { project_id: project2Id, unit_number: "31", floor: 3, area: 88.0, rooms: 3, price: 710000000, status: "available" },
      { project_id: project2Id, unit_number: "32", floor: 3, area: 65.0, rooms: 2, price: 530000000, status: "available" },
      { project_id: project2Id, unit_number: "41", floor: 4, area: 88.0, rooms: 3, price: 720000000, status: "available" },
      { project_id: project2Id, unit_number: "42", floor: 4, area: 120.0, rooms: 4, price: 980000000, status: "available" }
    ];

    const seededUnits = [];
    for (const u of units) {
      const res = await client.query(
        `INSERT INTO erp_units (project_id, unit_number, floor, area, rooms, price, status, reserved_until, reserved_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, status, price`,
        [u.project_id, u.unit_number, u.floor, u.area, u.rooms, u.price, u.status, u.reserved_until || null, u.status === 'reserved' ? seller1Id : null]
      );
      seededUnits.push({ id: res.rows[0].id, status: res.rows[0].status, price: parseInt(res.rows[0].price) });
    }
    console.log(`✅ Seeded ${units.length} units.`);

    // 10. Seed erp_leads
    console.log("👤 Seeding leads...");
    const leads = [
      { name: "Sardor Alimov", phone: "+998 93 111 22 33", email: "sardor@example.com", source: "telegram", status: "new", budget: 500000000, notes: "Telegram guruhimizdan yozdi. 2 xonali uylarga qiziqyapti.", assigned_to: seller1Id },
      { name: "Kamola Karimova", phone: "+998 94 444 55 66", email: "kamola@example.com", source: "instagram", status: "meeting_scheduled", budget: 700000000, notes: "Instagramdan topgan. Olmazor City loyihasiga qiziqmoqda.", assigned_to: seller1Id },
      { name: "Bobur Mansurov", phone: "+998 97 777 88 99", email: "bobur@example.com", source: "recommendation", status: "won", budget: 420000000, notes: "Do''stining tavsiyasi bilan kelgan. Olmazor City 101-uyni sotib oldi.", assigned_to: seller1Id },
      { name: "Shirin Ergasheva", phone: "+998 90 222 33 44", email: "shirin@example.com", source: "website", status: "negotiation", budget: 650000000, notes: "Saytdan so''rov qoldirgan. Narxlar bo''yicha kelishuv ketyapti.", assigned_to: seller2Id },
      { name: "Diyorbek Toshpo'latov", phone: "+998 99 555 66 77", email: "diyor@example.com", source: "walk_in", status: "contacted", budget: 350000000, notes: "Ofisimizga shaxsan keldi. Chilonzor Deluxe loyihasini ko''rdi.", assigned_to: seller2Id },
      { name: "Umida G'ofurova", phone: "+998 91 888 99 00", email: "umida@example.com", source: "website", status: "new", budget: 800000000, notes: "Katta maydonli uylarga qiziqyapti, 3-4 xonali.", assigned_to: null }, // Unassigned lead for ROP to assign!
      { name: "Jamshid Qodirov", phone: "+998 93 999 11 22", email: "jamshid@example.com", source: "telegram", status: "won", budget: 610000000, notes: "Olmazor City 102-xonadon xaridori.", assigned_to: seller2Id },
      { name: "Farhod Karimov", phone: "+998 95 333 44 55", email: "farhod@example.com", source: "instagram", status: "won", budget: 340000000, notes: "Chilonzor Deluxe 11-xonadon xaridori.", assigned_to: seller2Id }
    ];

    const seededLeads = [];
    for (const l of leads) {
      const res = await client.query(
        `INSERT INTO erp_leads (name, phone, email, source, status, budget, notes, assigned_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, status, name`,
        [l.name, l.phone, l.email, l.source, l.status, l.budget, l.notes, l.assigned_to]
      );
      seededLeads.push({ id: res.rows[0].id, status: res.rows[0].status, name: res.rows[0].name });
    }
    console.log(`✅ Seeded ${leads.length} CRM leads.`);

    // Map lead IDs
    const getLeadIdByName = name => seededLeads.find(l => l.name === name)?.id;
    const leadBoburId = getLeadIdByName("Bobur Mansurov");
    const leadJamshidId = getLeadIdByName("Jamshid Qodirov");
    const leadFarhodId = getLeadIdByName("Farhod Karimov");
    const leadKamolaId = getLeadIdByName("Kamola Karimova");
    const leadShirinId = getLeadIdByName("Shirin Ergasheva");

    // 11. Seed erp_meetings
    console.log("📅 Seeding meetings...");
    const meetings = [
      { lead_id: leadKamolaId, user_id: seller1Id, scheduled_time: new Date(Date.now() + 2 * 60 * 60 * 1000), location: "Olmazor City qurilish maydoni", notes: "Loyiha bilan joyida tanishish va xonadon planirovkasini ko'rish.", status: "scheduled" },
      { lead_id: leadShirinId, user_id: seller2Id, scheduled_time: new Date(Date.now() + 24 * 60 * 60 * 1000), location: "Bosh ofis, 2-xona", notes: "Nasiya shartnomasining boshlang'ich to'lovi foizi bo'yicha muzokara.", status: "scheduled" },
      { lead_id: leadBoburId, user_id: seller1Id, scheduled_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), location: "Bosh ofis", notes: "Shartnoma imzolash uchrashuvi.", status: "completed" },
      { lead_id: leadFarhodId, user_id: seller2Id, scheduled_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), location: "Chilonzor Deluxe ob'ekti", notes: "Ob'ektni borib ko'rish.", status: "completed" }
    ];

    for (const m of meetings) {
      await client.query(
        `INSERT INTO erp_meetings (lead_id, user_id, scheduled_time, location, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [m.lead_id, m.user_id, m.scheduled_time, m.location, m.notes, m.status]
      );
    }
    console.log("✅ Seeded 4 meetings.");

    // 12. Seed erp_sales
    console.log("💰 Seeding sales (deals) & payments...");
    // Find unit IDs by unit numbers
    const unit101Id = (await client.query("SELECT id FROM erp_units WHERE unit_number = '101' AND project_id = $1", [project1Id])).rows[0].id;
    const unit102Id = (await client.query("SELECT id FROM erp_units WHERE unit_number = '102' AND project_id = $1", [project1Id])).rows[0].id;
    const unit11Id = (await client.query("SELECT id FROM erp_units WHERE unit_number = '11' AND project_id = $1", [project2Id])).rows[0].id;
    const unit402Id = (await client.query("SELECT id FROM erp_units WHERE unit_number = '402' AND project_id = $1", [project1Id])).rows[0].id;

    // We also need another lead for unit 402
    const leadDiyorId = getLeadIdByName("Diyorbek Toshpo'latov");

    const sales = [
      { unit_id: unit101Id, lead_id: leadBoburId, sold_price: 420000000, payment_plan: "cash", initial_payment: 420000000, paid_amount: 420000000, status: "completed", sold_by: seller1Id, sold_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { unit_id: unit102Id, lead_id: leadJamshidId, sold_price: 610000000, payment_plan: "installments", initial_payment: 200000000, paid_amount: 300000000, status: "active", sold_by: seller2Id, sold_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
      { unit_id: unit11Id, lead_id: leadFarhodId, sold_price: 340000000, payment_plan: "mortgage", initial_payment: 100000000, paid_amount: 340000000, status: "completed", sold_by: seller2Id, sold_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { unit_id: unit402Id, lead_id: leadDiyorId, sold_price: 820000000, payment_plan: "installments", initial_payment: 300000000, paid_amount: 300000000, status: "active", sold_by: seller1Id, sold_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
    ];

    for (const s of sales) {
      await client.query(
        `INSERT INTO erp_sales (unit_id, lead_id, sold_price, payment_plan, initial_payment, paid_amount, status, sold_by, sold_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [s.unit_id, s.lead_id, s.sold_price, s.payment_plan, s.initial_payment, s.paid_amount, s.status, s.sold_by, s.sold_at]
      );
    }
    console.log("✅ Seeded 4 sales agreements.");

    console.log("🎉 ERP Database Migration & Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
