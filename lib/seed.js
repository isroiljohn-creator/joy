const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const listings = [
  { id: 1, price: "$72 000", priceNum: 72000, type: "3 xonali kvartira", cat: "Yangi uylar",
    addr: "Chilonzor 9-kvartal", rooms: 3, baths: 1, area: 78, floor: "5/9", top: true,
    photo: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=75",
    owner: "Aziz Karimov", views: 842, saves: 64, status: "active", pinX: 58, pinY: 80 },
  { id: 2, price: "$54 000", priceNum: 54000, type: "2 xonali kvartira", cat: "Ikkilamchi",
    addr: "Yunusobod 12-kvartal", rooms: 2, baths: 1, area: 54, floor: "3/5", top: false,
    photo: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=75",
    owner: "Dilnoza Yusupova", views: 531, saves: 38, status: "active", pinX: 200, pinY: 200 },
  { id: 3, price: "$88 000", priceNum: 88000, type: "4 xonali kvartira", cat: "Yangi uylar",
    addr: "Mirzo Ulug'bek tumani", rooms: 4, baths: 2, area: 102, floor: "7/9", top: true,
    photo: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=75",
    owner: "Sardor Toshmatov", views: 0, saves: 0, status: "pending", pinX: 300, pinY: 150 },
  { id: 4, price: "$61 000", priceNum: 61000, type: "2 xonali kvartira", cat: "Ikkilamchi",
    addr: "Sergeli 6-kvartal", rooms: 2, baths: 1, area: 58, floor: "2/4", top: false,
    photo: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=75",
    owner: "Aziz Karimov", views: 412, saves: 29, status: "active", pinX: 120, pinY: 320 },
  { id: 5, price: "$130 000", priceNum: 130000, type: "Hovli uy, 5 xona", cat: "Ikkilamchi",
    addr: "Qibray tumani", rooms: 5, baths: 2, area: 180, floor: "2 qavat", top: false,
    photo: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=75",
    owner: "Aziz Karimov", views: 298, saves: 21, status: "active", pinX: 360, pinY: 260 },
  { id: 6, price: "$45 000", priceNum: 45000, type: "1 xonali kvartira", cat: "Ijara",
    addr: "Olmazor tumani", rooms: 1, baths: 1, area: 38, floor: "4/9", top: false,
    photo: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=75",
    owner: "Dilnoza Yusupova", views: 0, saves: 0, status: "pending", pinX: 80, pinY: 420 },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Ma'lumotlar bazasini tozalash va jadval yaratish boshlandi...");
    
    await client.query(`DROP TABLE IF EXISTS listings;`);
    
    await client.query(`
      CREATE TABLE listings (
        id SERIAL PRIMARY KEY,
        price VARCHAR(50),
        price_num INT,
        type VARCHAR(100),
        cat VARCHAR(50),
        addr VARCHAR(255),
        rooms INT,
        baths INT,
        area INT,
        floor VARCHAR(20),
        top BOOLEAN DEFAULT FALSE,
        photo TEXT,
        owner VARCHAR(100),
        views INT DEFAULT 0,
        saves INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        pin_x INT,
        pin_y INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Jadval yaratildi. Namuna ma'lumotlar yuklanmoqda...");
    
    for (const l of listings) {
      await client.query(`
        INSERT INTO listings (id, price, price_num, type, cat, addr, rooms, baths, area, floor, top, photo, owner, views, saves, status, pin_x, pin_y)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);
      `, [l.id, l.price, l.priceNum, l.type, l.cat, l.addr, l.rooms, l.baths, l.area, l.floor, l.top, l.photo, l.owner, l.views, l.saves, l.status, l.pinX, l.pinY]);
    }
    
    // Serial-ni to'g'irlab qo'yamiz keyingi insertlar uchun
    await client.query(`SELECT setval('listings_id_seq', (SELECT MAX(id) FROM listings));`);
    
    console.log("Ma'lumotlar muvaffaqiyatli yuklandi!");
  } catch (err) {
    console.error("Xatolik yuz berdi:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
