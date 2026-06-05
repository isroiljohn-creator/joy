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

// ======== Foydalanuvchilar ========
const users = [
  { id: 1, name: "Aziz Karimov", phone: "+998 90 123 45 67", password: "password", role: "admin" },
  { id: 2, name: "Dilnoza Yusupova", phone: "+998 93 321 65 43", password: "password123", role: "user" },
];

// ======== E'lonlar (barcha 4 toifa uchun) ========
const listings = [
  // --- Yangi uylar (3 ta) ---
  {
    id: 1, price: "$72 000", priceNum: 72000, type: "3 xonali kvartira", cat: "Yangi uylar",
    addr: "Chilonzor 9-kvartal, Toshkent", rooms: 3, baths: 1, area: 78, floor: "5/9", top: true,
    photo: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=75",
    owner_id: 1, views: 842, saves: 64, status: "active", pinX: 58, pinY: 80,
    description: "Chilonzor 9-kvartalda yangi qurilgan binoda zamonaviy 3 xonali kvartira. Evro ta'mir, issiq pol, konditsioner o'rnatilgan. Yaqin atrofda maktab, bog'cha va savdo markazi mavjud. Hujjatlari tayyor.",
    phone: "+998 90 123 45 67"
  },
  {
    id: 2, price: "$88 000", priceNum: 88000, type: "4 xonali kvartira", cat: "Yangi uylar",
    addr: "Mirzo Ulug'bek tumani, Buyuk Ipak Yo'li", rooms: 4, baths: 2, area: 102, floor: "7/9", top: true,
    photo: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=75",
    owner_id: 1, views: 673, saves: 41, status: "active", pinX: 300, pinY: 150,
    description: "Mirzo Ulug'bek tumanida yangi binoda keng 4 xonali kvartira. Panoramali deraza, 2 ta hammom, bolalar maydoni. Metro bekatiga 5 daqiqa piyoda. Ipoteka rasmiylashtirish mumkin.",
    phone: "+998 90 123 45 67"
  },
  {
    id: 3, price: "$95 000", priceNum: 95000, type: "3 xonali kvartira", cat: "Yangi uylar",
    addr: "Yunusobod 19-kvartal, Yangi bino", rooms: 3, baths: 2, area: 92, floor: "12/16", top: false,
    photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=75",
    owner_id: 2, views: 389, saves: 27, status: "active", pinX: 220, pinY: 100,
    description: "Yunusobod 19-kvartalda 16 qavatli yangi binoning 12-qavatida joylashgan kvartira. Shiftning balandligi 3 metr, lift ishlaydi, yopiq avtoturargoh. Atrofda park va sport maydonchasi bor.",
    phone: "+998 93 321 65 43"
  },

  // --- Ikkilamchi (3 ta) ---
  {
    id: 4, price: "$54 000", priceNum: 54000, type: "2 xonali kvartira", cat: "Ikkilamchi",
    addr: "Yunusobod 12-kvartal", rooms: 2, baths: 1, area: 54, floor: "3/5", top: false,
    photo: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=75",
    owner_id: 2, views: 531, saves: 38, status: "active", pinX: 200, pinY: 200,
    description: "Yunusobod 12-kvartalda g'ishtli 5 qavatli uyda 2 xonali kvartira. Ta'mirlangan, mebel va texnika bilan. Yaqinda bozor, dorixona va avtobus bekati mavjud. Tinch mahalla.",
    phone: "+998 93 321 65 43"
  },
  {
    id: 5, price: "$61 000", priceNum: 61000, type: "2 xonali kvartira", cat: "Ikkilamchi",
    addr: "Sergeli 6-kvartal", rooms: 2, baths: 1, area: 58, floor: "2/4", top: false,
    photo: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=75",
    owner_id: 1, views: 412, saves: 29, status: "active", pinX: 120, pinY: 320,
    description: "Sergeli 6-kvartalda yaxshi holatdagi ikki xonali kvartira. Xonalar keng va yorug'. Tabiiy gaz va issiq suv mavjud. Bolalar bog'chasi va maktab yaqinda.",
    phone: "+998 90 123 45 67"
  },
  {
    id: 6, price: "$130 000", priceNum: 130000, type: "Hovli uy, 5 xona", cat: "Ikkilamchi",
    addr: "Yakkasaroy tumani, Bobur ko'chasi", rooms: 5, baths: 2, area: 180, floor: "2 qavat", top: true,
    photo: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=75",
    owner_id: 1, views: 298, saves: 21, status: "active", pinX: 360, pinY: 260,
    description: "Yakkasaroy tumanida 2 qavatli hovli uy. 5 xona, 2 hammom, oshxona, mehmonxona. Hovlida bog' va avtoturargoh. Markaziy isitish tizimi. Shahar markaziga 10 daqiqa.",
    phone: "+998 90 123 45 67"
  },

  // --- Ijara (3 ta) ---
  {
    id: 7, price: "$350/oy", priceNum: 350, type: "2 xonali kvartira (oylik)", cat: "Ijara",
    addr: "Shayxontohur tumani, Navoiy ko'chasi", rooms: 2, baths: 1, area: 55, floor: "6/9", top: false,
    photo: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=75",
    owner_id: 2, views: 756, saves: 52, status: "active", pinX: 80, pinY: 180,
    description: "Shayxontohur tumanida to'liq jihozlangan 2 xonali kvartira ijaraga beriladi. Kir yuvish mashinasi, muzlatgich, konditsioner bor. Oylik to'lov: $350. Kommunal xarajatlar alohida.",
    phone: "+998 93 321 65 43"
  },
  {
    id: 8, price: "$500/oy", priceNum: 500, type: "3 xonali kvartira (oylik)", cat: "Ijara",
    addr: "Olmazor tumani, Beruniy ko'chasi", rooms: 3, baths: 1, area: 72, floor: "4/9", top: false,
    photo: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=75",
    owner_id: 1, views: 445, saves: 33, status: "active", pinX: 150, pinY: 420,
    description: "Olmazor tumanida keng 3 xonali kvartira ijaraga. Yangi ta'mir, to'liq meblangan. Oilaviy yashash uchun qulay. Metro va avtobus bekatiga yaqin. Uzoq muddatga afzal.",
    phone: "+998 90 123 45 67"
  },
  {
    id: 9, price: "$25/kun", priceNum: 25, type: "1 xonali kvartira (kunlik)", cat: "Ijara",
    addr: "Uchtepa tumani, Qo'yliq ko'chasi", rooms: 1, baths: 1, area: 38, floor: "3/5", top: false,
    photo: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=75",
    owner_id: 2, views: 923, saves: 15, status: "active", pinX: 280, pinY: 370,
    description: "Uchtepa tumanida kunlik ijaraga beriladigan 1 xonali kvartira. Wi-Fi, konditsioner, issiq suv. Mehmonlar uchun qulay. Choy-choq va tarqatish buyumlari bilan ta'minlangan.",
    phone: "+998 93 321 65 43"
  },

  // --- Ofis (3 ta) ---
  {
    id: 10, price: "$800/oy", priceNum: 800, type: "Ofis xonasi, 45 m²", cat: "Ofis",
    addr: "Chilonzor tumani, Bunyodkor ko'chasi", rooms: 2, baths: 1, area: 45, floor: "3/7", top: false,
    photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=75",
    owner_id: 1, views: 312, saves: 18, status: "active", pinX: 100, pinY: 140,
    description: "Chilonzor tumanida biznes markaz ichida zamonaviy ofis xonasi. 2 xona, kutish zali, internet va telefon liniyasi ulangan. Avtoturargoh mavjud. Yuridik manzil olish mumkin.",
    phone: "+998 90 123 45 67"
  },
  {
    id: 11, price: "$1 200/oy", priceNum: 1200, type: "Ofis, 80 m²", cat: "Ofis",
    addr: "Mirabad tumani, Amir Temur xiyoboni", rooms: 4, baths: 1, area: 80, floor: "5/12", top: true,
    photo: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=75",
    owner_id: 2, views: 567, saves: 42, status: "active", pinX: 340, pinY: 190,
    description: "Amir Temur xiyobonida nufuzli biznes markazda 80 m² ofis. 4 xona, konferensiya zali, oshxona. Zamonaviy lift, 24 soat qo'riqlash. Shahar markazida joyhazlangan.",
    phone: "+998 93 321 65 43"
  },
  {
    id: 12, price: "$450/oy", priceNum: 450, type: "Kovorking joy", cat: "Ofis",
    addr: "Yunusobod tumani, Amir Temur ko'chasi 50", rooms: 1, baths: 1, area: 25, floor: "2/5", top: false,
    photo: "https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800&q=75",
    owner_id: 1, views: 201, saves: 11, status: "pending", pinX: 240, pinY: 60,
    description: "Yunusobod tumanida kovorking maydoni. Tezkor internet, printer, skaner mavjud. Choy va qahva bepul. Erkin ish grafigi. Startaplar va frilanserlar uchun ideal.",
    phone: "+998 90 123 45 67"
  },
  {
    id: 13, price: "$42 000", priceNum: 42000, type: "1 xonali kvartira", cat: "Yangi uylar",
    addr: "Sergeli tumani, Yangi Sergeli JK", rooms: 1, baths: 1, area: 42, floor: "9/14", top: false,
    photo: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=75",
    owner_id: 2, views: 0, saves: 0, status: "pending", pinX: 170, pinY: 350,
    description: "Yangi Sergeli turar-joy majmuasida 1 xonali kvartira. Oq holatda topshiriladi. Lift, bolalar maydoni, yashil hudud. Ipoteka va bo'lib to'lash imkoniyati mavjud.",
    phone: "+998 93 321 65 43"
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Ma'lumotlar bazasini tozalash va jadvallar yaratish boshlandi...");

    // Avval bog'liq jadvallarni o'chiramiz
    await client.query(`DROP TABLE IF EXISTS messages;`);
    await client.query(`DROP TABLE IF EXISTS favorites;`);
    await client.query(`DROP TABLE IF EXISTS listings;`);
    await client.query(`DROP TABLE IF EXISTS users;`);

    // Foydalanuvchilar jadvali
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        phone VARCHAR(50) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("'users' jadvali yaratildi.");

    // E'lonlar jadvali
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
        owner_id INT REFERENCES users(id) ON DELETE CASCADE,
        views INT DEFAULT 0,
        saves INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        pin_x INT,
        pin_y INT,
        description TEXT,
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("'listings' jadvali yaratildi.");

    // Sevimlilar jadvali
    await client.query(`
      CREATE TABLE favorites (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        listing_id INT REFERENCES listings(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, listing_id)
      );
    `);
    console.log("'favorites' jadvali yaratildi.");

    // Xabarlar jadvali
    await client.query(`
      CREATE TABLE messages (
        id SERIAL PRIMARY KEY,
        sender_id INT REFERENCES users(id) ON DELETE SET NULL,
        sender_name VARCHAR(100),
        sender_phone VARCHAR(50),
        receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
        listing_id INT REFERENCES listings(id) ON DELETE CASCADE,
        content TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("'messages' jadvali yaratildi.");

    // ======== Ma'lumotlarni yuklash ========

    // Foydalanuvchilarni qo'shamiz
    for (const u of users) {
      const hashedPassword = hashPassword(u.password);
      await client.query(
        `INSERT INTO users (id, name, phone, password, role) VALUES ($1, $2, $3, $4, $5)`,
        [u.id, u.name, u.phone, hashedPassword, u.role || 'user']
      );
    }
    console.log(`${users.length} ta foydalanuvchi yuklandi.`);

    // E'lonlarni qo'shamiz
    for (const l of listings) {
      await client.query(
        `INSERT INTO listings (id, price, price_num, type, cat, addr, rooms, baths, area, floor, top, photo, owner_id, views, saves, status, pin_x, pin_y, description, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [l.id, l.price, l.priceNum, l.type, l.cat, l.addr, l.rooms, l.baths, l.area, l.floor, l.top, l.photo, l.owner_id, l.views, l.saves, l.status, l.pinX, l.pinY, l.description, l.phone]
      );
    }
    console.log(`${listings.length} ta e'lon yuklandi.`);

    // Serial ketma-ketliklarni to'g'irlaymiz
    await client.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`);
    await client.query(`SELECT setval('listings_id_seq', (SELECT MAX(id) FROM listings));`);

    console.log("Ma'lumotlar bazasi muvaffaqiyatli to'ldirildi!");
  } catch (err) {
    console.error("Xatolik yuz berdi:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
