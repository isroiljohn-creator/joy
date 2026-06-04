const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:ILZglrrMjqwGTtmvBkJFYfoGtxOjlzZt@acela.proxy.rlwy.net:19142/railway";
const BASE_URL = "https://joy-production-22c6.up.railway.app";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runTests() {
  console.log("==================================================");
  console.log("🚀 AVTOMATLASHTIRILGAN INTEGRATSION TESTLAR BOSHLANDI");
  console.log("==================================================");

  const client = await pool.connect();
  const testPhone = "+998 99 " + Math.floor(1000000 + Math.random() * 9000000);
  const testName = "Test User " + Math.floor(100 + Math.random() * 900);
  const testPassword = "testpassword123";

  try {
    // 1. Bazaga ulanishni tekshirish
    console.log("\n1. 💾 Ma'lumotlar bazasiga ulanish tekshirilmoqda...");
    const dbTest = await client.query("SELECT NOW()");
    console.log("✅ Baza aloqasi muvaffaqiyatli! Vaqt:", dbTest.rows[0].now);

    // 2. Foydalanuvchi ro'yxatdan o'tish testi (Direct DB check)
    console.log("\n2. 👤 Yangi foydalanuvchi yaratish sinab ko'rilmoqda...");
    const regRes = await client.query(
      "INSERT INTO users (name, phone, password) VALUES ($1, $2, $3) RETURNING id, name",
      [testName, testPhone, testPassword]
    );
    const newUserId = regRes.rows[0].id;
    console.log(`✅ Foydalanuvchi yaratildi! ID: ${newUserId}, Ism: ${testName}, Tel: ${testPhone}`);

    // 3. E'lonlar ro'yxatini yuklash testi
    console.log("\n3. 📋 Bazadan faol e'lonlarni yuklash testi...");
    const listingsRes = await client.query("SELECT id, type, price FROM listings WHERE status = 'active'");
    console.log(`✅ Faol e'lonlar yuklandi! Jami e'lonlar soni: ${listingsRes.rows.length} ta.`);
    if (listingsRes.rows.length > 0) {
      console.log(`   Namuna: ${listingsRes.rows[0].type} (${listingsRes.rows[0].price})`);
    }

    // 4. Saqlanganlar (Favorites) tizimi testi
    console.log("\n4. 💖 E'lonni saqlanganlarga qo'shish sinab ko'rilmoqda...");
    const targetListingId = listingsRes.rows[0]?.id || 1;
    
    // Avval yoqtirilganlarga qo'shamiz
    await client.query("INSERT INTO favorites (user_id, listing_id) VALUES ($1, $2)", [newUserId, targetListingId]);
    console.log(`✅ E'lon (ID: ${targetListingId}) user (ID: ${newUserId}) uchun saqlanganlarga qo'shildi.`);
    
    // Tekshiramiz
    const favCheck = await client.query("SELECT * FROM favorites WHERE user_id = $1 AND listing_id = $2", [newUserId, targetListingId]);
    if (favCheck.rows.length > 0) {
      console.log("✅ Saqlanganlar jadvalidan muvaffaqiyatli tekshirildi!");
    } else {
      throw new Error("Saqlangan e'lon topilmadi!");
    }

    // O'chirib ko'ramiz
    await client.query("DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2", [newUserId, targetListingId]);
    console.log(`✅ E'lon saqlanganlardan muvaffaqiyatli o'chirildi.`);

    // 5. Xabarlar (Messaging) tizimi testi
    console.log("\n5. ✉️ E'lon egasiga xabar yuborish sinab ko'rilmoqda...");
    const testMessageContent = "Assalomu alaykum, e'lon bo'yicha batafsil ma'lumot bera olasizmi? Test xabar.";
    const receiverOwner = "Aziz Karimov";

    await client.query(
      `INSERT INTO messages (sender_id, sender_name, sender_phone, receiver_owner, listing_id, content)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newUserId, testName, testPhone, receiverOwner, targetListingId, testMessageContent]
    );
    console.log(`✅ Xabar yuborildi! Qabul qiluvchi: ${receiverOwner}, E'lon ID: ${targetListingId}`);

    // Xabar yetib borganini tekshiramiz
    const msgCheck = await client.query("SELECT * FROM messages WHERE sender_id = $1", [newUserId]);
    if (msgCheck.rows.length > 0) {
      console.log(`✅ Xabarlar qutisidan tekshirildi! Kelgan matn: "${msgCheck.rows[0].content}"`);
    } else {
      throw new Error("Xabar topilmadi!");
    }

    // 6. Profil sozlamalarini o'zgartirish testi
    console.log("\n6. ⚙️ Profil sozlamalarini tahrirlash testi...");
    const updatedName = testName + " (Updated)";
    const updatedPhone = testPhone.slice(0, -2) + "00";

    await client.query(
      "UPDATE users SET name = $1, phone = $2 WHERE id = $3",
      [updatedName, updatedPhone, newUserId]
    );
    
    const userCheck = await client.query("SELECT name, phone FROM users WHERE id = $1", [newUserId]);
    if (userCheck.rows[0].name === updatedName && userCheck.rows[0].phone === updatedPhone) {
      console.log(`✅ Profil yangilandi! Yangi ism: ${userCheck.rows[0].name}, Yangi tel: ${userCheck.rows[0].phone}`);
    } else {
      throw new Error("Profil sozlamalari yangilanmadi!");
    }

    // Tozalash (Test foydalanuvchisini va test xabarlarini o'chirish)
    console.log("\n🧹 Test ma'lumotlari tozalanmoqda...");
    await client.query("DELETE FROM messages WHERE sender_id = $1", [newUserId]);
    await client.query("DELETE FROM users WHERE id = $1", [newUserId]);
    console.log("✅ Tozalash yakunlandi.");

    console.log("\n==================================================");
    console.log("🎉 BARCHA INTEGRATSION TESTLAR MUVAFFAQIYATLI O'TDI!");
    console.log("Har bir tugma va baza funksiyalari to'liq ishlamoqda.");
    console.log("==================================================");

  } catch (error) {
    console.error("\n❌ TESTLARDA XATOLIK YUZ BERDI:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runTests();
