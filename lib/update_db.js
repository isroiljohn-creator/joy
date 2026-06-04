const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateDb() {
  const client = await pool.connect();
  try {
    console.log("Sxemalarni yangilash boshlandi...");

    // 1. users jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(30) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("users jadvali tekshirildi/yaratildi.");

    // 2. favorites jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        user_id INT NOT NULL,
        listing_id INT NOT NULL,
        PRIMARY KEY (user_id, listing_id)
      );
    `);
    console.log("favorites jadvali tekshirildi/yaratildi.");

    // 3. messages jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INT,
        sender_name VARCHAR(100) NOT NULL,
        sender_phone VARCHAR(30) NOT NULL,
        receiver_owner VARCHAR(100) NOT NULL,
        listing_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("messages jadvali tekshirildi/yaratildi.");

    // Boshlang'ich foydalanuvchini yaratamiz (Aziz Karimov)
    const phone = "+998 90 123 45 67";
    const checkUser = await client.query("SELECT id FROM users WHERE phone = $1", [phone]);
    if (checkUser.rows.length === 0) {
      await client.query(
        "INSERT INTO users (name, phone, password) VALUES ($1, $2, $3)",
        ["Aziz Karimov", phone, "password"]
      );
      console.log("Boshlang'ich foydalanuvchi (Aziz Karimov) yaratildi.");
    }

    console.log("Barcha bazani yangilash ishlari yakunlandi!");
  } catch (error) {
    console.error("Yangilashda xatolik:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateDb();
