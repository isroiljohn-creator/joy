"use server";
import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { hashPassword, verifyPassword } from "@/lib/hash";

// Cookie sozlamalari (30 kunlik muddat, xavfsiz HttpOnly)
const COOKIE_OPTIONS = { 
  path: "/", 
  maxAge: 60 * 60 * 24 * 30,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
};

// Client o'qishi uchun xavfsiz bo'lmagan parallel cookie
const PUBLIC_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
};

// Tuman koordinatalari xaritasi
const DISTRICT_PINS = {
  "Chilonzor": { x: 58, y: 80 },
  "Yunusobod": { x: 200, y: 200 },
  "Mirzo Ulug'bek": { x: 260, y: 140 },
  "Sergeli": { x: 120, y: 300 },
  "Yakkasaroy": { x: 360, y: 260 },
  "Shayxontohur": { x: 80, y: 180 },
  "Olmazor": { x: 150, y: 420 },
  "Uchtepa": { x: 280, y: 370 },
  "Mirabad": { x: 340, y: 190 },
  "Bektemir": { x: 380, y: 450 },
  "Yashnobod": { x: 300, y: 290 }
};

// Sessiyadagi joriy foydalanuvchini olish
export async function getCurrentUser() {
  const cookieStore = cookies();
  const id = cookieStore.get("user_id")?.value;
  const name = cookieStore.get("user_name")?.value;
  const phone = cookieStore.get("user_phone")?.value;
  if (!id) return null;

  try {
    const { rows } = await pool.query("SELECT created_at FROM users WHERE id = $1", [parseInt(id)]);
    const createdAt = rows.length > 0 ? rows[0].created_at : null;
    return { id: parseInt(id), name, phone, createdAt };
  } catch (error) {
    return { id: parseInt(id), name, phone, createdAt: null };
  }
}

// Kirish (Login)
export async function loginAction(formData) {
  const phone = formData.get("phone");
  const password = formData.get("password");

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
    if (rows.length === 0 || !verifyPassword(password, rows[0].password)) {
      return { error: "Telefon raqami yoki parol noto'g'ri" };
    }

    const user = rows[0];
    const cookieStore = cookies();
    cookieStore.set("user_id", String(user.id), COOKIE_OPTIONS);
    cookieStore.set("user_name", user.name, COOKIE_OPTIONS);
    cookieStore.set("user_phone", user.phone, COOKIE_OPTIONS);
    cookieStore.set("is_logged_in", "true", PUBLIC_COOKIE_OPTIONS);
  } catch (error) {
    console.error("loginAction error:", error);
    return { error: "Tizimga kirishda xatolik yuz berdi" };
  }

  redirect("/profile");
}

// Ro'yxatdan o'tish (Register)
export async function registerAction(formData) {
  const name = formData.get("name");
  const phone = formData.get("phone");
  const password = formData.get("password");
  const hashedPassword = hashPassword(password);

  try {
    const { rows } = await pool.query(
      "INSERT INTO users (name, phone, password) VALUES ($1, $2, $3) RETURNING *",
      [name, phone, hashedPassword]
    );
    const user = rows[0];
    const cookieStore = cookies();
    cookieStore.set("user_id", String(user.id), COOKIE_OPTIONS);
    cookieStore.set("user_name", user.name, COOKIE_OPTIONS);
    cookieStore.set("user_phone", user.phone, COOKIE_OPTIONS);
    cookieStore.set("is_logged_in", "true", PUBLIC_COOKIE_OPTIONS);
  } catch (error) {
    console.error("registerAction error:", error);
    return { error: "Ushbu telefon raqami allaqachon ro'yxatdan o'tgan" };
  }

  redirect("/profile");
}

// Tizimdan chiqish (Logout)
export async function logoutAction() {
  const cookieStore = cookies();
  cookieStore.delete("user_id");
  cookieStore.delete("user_name");
  cookieStore.delete("user_phone");
  cookieStore.delete("is_logged_in");
  redirect("/");
}

// E'lon yaratish
export async function createListingAction(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const catRaw = formData.get("cat");
  const title = formData.get("title") || "3 xonali kvartira";
  const rooms = parseInt(formData.get("rooms")) || 3;
  const baths = parseInt(formData.get("baths")) || 1;
  const area = parseInt(formData.get("area")) || 78;
  const floor = formData.get("floor") || "5/9";
  const priceInput = formData.get("price") || "72000";
  const desc = formData.get("desc") || "";
  const district = formData.get("district") || "Chilonzor";
  const quarter = formData.get("quarter") || "9-kvartal";

  const priceNum = parseInt(priceInput.replace(/\s/g, "")) || 0;
  const priceFormatted = "$" + priceNum.toLocaleString().replace(/,/g, " ");

  let cat = catRaw || "Yangi uylar";
  if (cat === "Yangi uy") {
    cat = "Yangi uylar";
  }

  const addr = `${district} ${quarter}`;
  
  // Tuman koordinatalarini dinamik olamiz
  const coords = DISTRICT_PINS[district] || { x: 150, y: 150 };
  const pinX = coords.x;
  const pinY = coords.y;

  // Haqiqiy rasm faylini Base64 ko'rinishida olamiz
  const photo = formData.get("photo") || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=75";
  const status = "active";
  const top = false;

  try {
    await pool.query(
      `INSERT INTO listings (price, price_num, type, cat, addr, rooms, baths, area, floor, top, photo, owner_id, views, saves, status, pin_x, pin_y, description, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [priceFormatted, priceNum, title, cat, addr, rooms, baths, area, floor, top, photo, user.id, 0, 0, status, pinX, pinY, desc, user.phone]
    );

    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/profile");
  } catch (error) {
    console.error("createListingAction error:", error);
    return { error: "Ma'lumotlar bazasiga yozishda xatolik yuz berdi" };
  }

  redirect("/profile");
}

// E'lonni o'chirish (Tranzaksiya bilan)
export async function deleteListingAction(listingId) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "unauthorized" };
  }

  try {
    // Egalikni tekshiramiz (ID bo'yicha)
    const { rows } = await pool.query(
      "SELECT * FROM listings WHERE id = $1 AND owner_id = $2",
      [listingId, user.id]
    );

    if (rows.length === 0) {
      return { error: "E'lon topilmadi yoki sizga tegishli emas" };
    }

    // ACID tranzaksiyasi
    await pool.query("BEGIN");
    await pool.query("DELETE FROM favorites WHERE listing_id = $1", [listingId]);
    await pool.query("DELETE FROM listings WHERE id = $1", [listingId]);
    await pool.query("COMMIT");

    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("deleteListingAction error:", error);
    return { error: "E'lonni o'chirishda xatolik yuz berdi" };
  }
}

// E'lonni yangilash
export async function updateListingAction(formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "unauthorized" };
  }

  const listingId = parseInt(formData.get("id"));

  try {
    // Egalikni tekshiramiz (ID bo'yicha)
    const { rows: existing } = await pool.query(
      "SELECT * FROM listings WHERE id = $1 AND owner_id = $2",
      [listingId, user.id]
    );

    if (existing.length === 0) {
      return { error: "E'lon topilmadi yoki sizga tegishli emas" };
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    const title = formData.get("title");
    if (title) { updates.push(`type = $${paramIndex++}`); values.push(title); }

    const price = formData.get("price");
    if (price) {
      const priceNum = parseInt(price.replace(/\s/g, "")) || 0;
      const priceFormatted = "$" + priceNum.toLocaleString().replace(/,/g, " ");
      updates.push(`price = $${paramIndex++}`); values.push(priceFormatted);
      updates.push(`price_num = $${paramIndex++}`); values.push(priceNum);
    }

    const rooms = formData.get("rooms");
    if (rooms) { updates.push(`rooms = $${paramIndex++}`); values.push(parseInt(rooms)); }

    const baths = formData.get("baths");
    if (baths) { updates.push(`baths = $${paramIndex++}`); values.push(parseInt(baths)); }

    const area = formData.get("area");
    if (area) { updates.push(`area = $${paramIndex++}`); values.push(parseInt(area)); }

    const floor = formData.get("floor");
    if (floor) { updates.push(`floor = $${paramIndex++}`); values.push(floor); }

    const desc = formData.get("desc");
    if (desc !== null && desc !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(desc); }

    const cat = formData.get("cat");
    if (cat) { updates.push(`cat = $${paramIndex++}`); values.push(cat === "Yangi uy" ? "Yangi uylar" : cat); }

    if (updates.length === 0) {
      return { error: "Yangilanadigan ma'lumotlar topilmadi" };
    }

    values.push(listingId);
    await pool.query(
      `UPDATE listings SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      values
    );

    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/profile");
    revalidatePath(`/property/${listingId}`);
    return { success: true };
  } catch (error) {
    console.error("updateListingAction error:", error);
    return { error: "E'lonni yangilashda xatolik yuz berdi" };
  }
}

// Ko'rishlar sonini oshirish
export async function incrementViewAction(listingId) {
  try {
    await pool.query("UPDATE listings SET views = views + 1 WHERE id = $1", [listingId]);
    return { success: true };
  } catch (error) {
    console.error("incrementViewAction error:", error);
    return { error: "Ko'rishlarni yangilashda xatolik" };
  }
}

// Saqlanganlarga qo'shish / o'chirish (Toggle Favorite)
export async function toggleFavoriteAction(listingId) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "unauthorized" };
  }

  try {
    const { rows } = await pool.query(
      "SELECT * FROM favorites WHERE user_id = $1 AND listing_id = $2",
      [user.id, listingId]
    );

    if (rows.length > 0) {
      await pool.query("DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2", [user.id, listingId]);
      await pool.query("UPDATE listings SET saves = GREATEST(0, saves - 1) WHERE id = $1", [listingId]);
    } else {
      await pool.query("INSERT INTO favorites (user_id, listing_id) VALUES ($1, $2)", [user.id, listingId]);
      await pool.query("UPDATE listings SET saves = saves + 1 WHERE id = $1", [listingId]);
    }

    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/profile");
    revalidatePath(`/property/${listingId}`);
    return { success: true };
  } catch (error) {
    console.error("toggleFavoriteAction error:", error);
    return { error: "Xatolik yuz berdi" };
  }
}

// Xabar yuborish (Send message to owner - referenced with IDs)
export async function sendMessageAction(formData) {
  const user = await getCurrentUser();
  const listingId = parseInt(formData.get("listing_id"));
  const receiverId = parseInt(formData.get("receiver_id"));
  const content = formData.get("content");
  
  let senderId = user ? user.id : null;
  let senderName = formData.get("sender_name");
  let senderPhone = formData.get("sender_phone");

  if (user) {
    senderName = user.name;
    senderPhone = user.phone;
  }

  if (!senderName || !senderPhone || !content || !receiverId || !listingId) {
    return { error: "Ma'lumotlar to'liq kiritilmadi" };
  }

  try {
    await pool.query(
      `INSERT INTO messages (sender_id, sender_name, sender_phone, receiver_id, listing_id, content)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [senderId, senderName, senderPhone, receiverId, listingId, content]
    );
    return { success: true };
  } catch (error) {
    console.error("sendMessageAction error:", error);
    return { error: "Xabar yuborishda xatolik yuz berdi" };
  }
}

// Xabarni o'qilgan deb belgilash
export async function markMessageReadAction(messageId) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "unauthorized" };
  }

  try {
    await pool.query(
      "UPDATE messages SET is_read = TRUE WHERE id = $1 AND receiver_id = $2",
      [messageId, user.id]
    );
    return { success: true };
  } catch (error) {
    console.error("markMessageReadAction error:", error);
    return { error: "Xabarni belgilashda xatolik" };
  }
}

// Xabarni o'chirish
export async function deleteMessageAction(messageId) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "unauthorized" };
  }

  try {
    const { rowCount } = await pool.query(
      "DELETE FROM messages WHERE id = $1 AND receiver_id = $2",
      [messageId, user.id]
    );

    if (rowCount === 0) {
      return { error: "Xabar topilmadi yoki sizga tegishli emas" };
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("deleteMessageAction error:", error);
    return { error: "Xabarni o'chirishda xatolik" };
  }
}

// O'qilmagan xabarlar sonini olish
export async function getUnreadMessageCount(userId) {
  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = FALSE",
      [userId]
    );
    return parseInt(rows[0].count, 10);
  } catch (error) {
    console.error("getUnreadMessageCount error:", error);
    return 0;
  }
}

// Parolni o'zgartirish
export async function changePasswordAction(formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "unauthorized" };
  }

  const oldPassword = formData.get("oldPassword");
  const newPassword = formData.get("newPassword");

  if (!oldPassword || !newPassword) {
    return { error: "Eski va yangi parolni kiriting" };
  }

  if (newPassword.length < 6) {
    return { error: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak" };
  }

  try {
    // Eski parolni tekshiramiz
    const { rows } = await pool.query("SELECT password FROM users WHERE id = $1", [user.id]);
    if (rows.length === 0 || !verifyPassword(oldPassword, rows[0].password)) {
      return { error: "Eski parol noto'g'ri" };
    }

    // Yangi parolni shifrlab saqlaymiz
    const hashedNew = hashPassword(newPassword);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedNew, user.id]);
    return { success: true };
  } catch (error) {
    console.error("changePasswordAction error:", error);
    return { error: "Parolni o'zgartirishda xatolik yuz berdi" };
  }
}

// Sozlamalarni yangilash (Update settings)
export async function updateSettingsAction(formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "unauthorized" };
  }

  const name = formData.get("name");
  const phone = formData.get("phone");

  if (!name || !phone) {
    return { error: "Ma'lumotlarni to'ldiring" };
  }

  try {
    await pool.query("UPDATE users SET name = $1, phone = $2 WHERE id = $3", [name, phone, user.id]);
    
    // Cookie-larni yangilaymiz
    const cookieStore = cookies();
    cookieStore.set("user_name", name, COOKIE_OPTIONS);
    cookieStore.set("user_phone", phone, COOKIE_OPTIONS);
    
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("updateSettingsAction error:", error);
    return { error: "Sozlamalarni yangilashda xatolik yuz berdi" };
  }
}
