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
  if (!id) return null;

  try {
    const { rows } = await pool.query("SELECT name, phone, email, role, is_verified, subscription_plan, balance, agency_id, created_at FROM users WHERE id = $1", [parseInt(id)]);
    if (rows.length > 0) {
      return { 
        id: parseInt(id), 
        name: rows[0].name || name, 
        phone: rows[0].phone, 
        email: rows[0].email,
        role: rows[0].role || 'user',
        isVerified: rows[0].is_verified || false,
        subscriptionPlan: rows[0].subscription_plan || 'free',
        balance: rows[0].balance || 0,
        agencyId: rows[0].agency_id,
        createdAt: rows[0].created_at 
      };
    }
    return { id: parseInt(id), name, phone: "", email: "", role: 'user', isVerified: false, subscriptionPlan: 'free', balance: 0, agencyId: null, createdAt: null };
  } catch (error) {
    return { id: parseInt(id), name, phone: "", email: "", role: 'user', isVerified: false, subscriptionPlan: 'free', balance: 0, agencyId: null, createdAt: null };
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
    cookieStore.set("user_display_name", user.name, PUBLIC_COOKIE_OPTIONS);
    cookieStore.set("user_phone", user.phone, COOKIE_OPTIONS);
    cookieStore.set("user_role", user.role || "user", PUBLIC_COOKIE_OPTIONS);
    cookieStore.set("is_logged_in", "true", PUBLIC_COOKIE_OPTIONS);
    return { success: true };
  } catch (error) {
    console.error("loginAction error:", error);
    return { error: "Tizimga kirishda xatolik yuz berdi" };
  }
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
    cookieStore.set("user_display_name", user.name, PUBLIC_COOKIE_OPTIONS);
    cookieStore.set("user_phone", user.phone, COOKIE_OPTIONS);
    cookieStore.set("user_role", user.role || "user", PUBLIC_COOKIE_OPTIONS);
    cookieStore.set("is_logged_in", "true", PUBLIC_COOKIE_OPTIONS);
    return { success: true };
  } catch (error) {
    console.error("registerAction error:", error);
    return { error: "Ushbu telefon raqami allaqachon ro'yxatdan o'tgan" };
  }
}

// SMS OTP yuborish
export async function sendOtpAction(phone) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await pool.query("DELETE FROM verification_codes WHERE phone = $1", [phone]);
    await pool.query("INSERT INTO verification_codes (phone, code) VALUES ($1, $2)", [phone, code]);
    
    console.log(`[SMS OTP] Verification code for ${phone} is: ${code}`);
    return { success: true, demoCode: code };
  } catch (error) {
    console.error("sendOtpAction error:", error);
    return { error: "SMS kod yuborishda xatolik yuz berdi" };
  }
}

// SMS OTP tekshirish va Kirish
export async function verifyOtpAction(phone, code) {
  try {
    const { rows: codeRows } = await pool.query(
      "SELECT * FROM verification_codes WHERE phone = $1 AND code = $2 AND created_at > NOW() - INTERVAL '5 minutes'",
      [phone, code]
    );

    if (codeRows.length === 0) {
      return { error: "Tasdiqlash kodi noto'g'ri yoki muddati o'tgan" };
    }

    const { rows: userRows } = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
    
    if (userRows.length > 0) {
      await pool.query("DELETE FROM verification_codes WHERE phone = $1", [phone]);

      const user = userRows[0];
      const cookieStore = cookies();
      cookieStore.set("user_id", String(user.id), COOKIE_OPTIONS);
      cookieStore.set("user_name", user.name, COOKIE_OPTIONS);
      cookieStore.set("user_display_name", user.name, PUBLIC_COOKIE_OPTIONS);
      cookieStore.set("user_phone", user.phone, COOKIE_OPTIONS);
      cookieStore.set("user_role", user.role || "user", PUBLIC_COOKIE_OPTIONS);
      cookieStore.set("is_logged_in", "true", PUBLIC_COOKIE_OPTIONS);
      
      return { success: true, exists: true };
    } else {
      return { success: true, exists: false };
    }
  } catch (error) {
    console.error("verifyOtpAction error:", error);
    return { error: "Kod tekshirishda xatolik yuz berdi" };
  }
}

// SMS orqali ro'yxatdan o'tishni yakunlash
export async function completeSmsRegisterAction(phone, code, name) {
  try {
    const { rows: codeRows } = await pool.query(
      "SELECT * FROM verification_codes WHERE phone = $1 AND code = $2 AND created_at > NOW() - INTERVAL '5 minutes'",
      [phone, code]
    );

    if (codeRows.length === 0) {
      return { error: "Tasdiqlash kodi noto'g'ri yoki muddati o'tgan. Iltimos, qaytadan kod oling." };
    }

    await pool.query("DELETE FROM verification_codes WHERE phone = $1", [phone]);

    const { rows: existingUser } = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
    if (existingUser.length > 0) {
      return { error: "Ushbu telefon raqami allaqachon ro'yxatdan o'tgan" };
    }

    const dummyPassword = hashPassword(Math.random().toString(36));
    const { rows: userRows } = await pool.query(
      "INSERT INTO users (name, phone, password) VALUES ($1, $2, $3) RETURNING *",
      [name, phone, dummyPassword]
    );

    const user = userRows[0];
    const cookieStore = cookies();
    cookieStore.set("user_id", String(user.id), COOKIE_OPTIONS);
    cookieStore.set("user_name", user.name, COOKIE_OPTIONS);
    cookieStore.set("user_display_name", user.name, PUBLIC_COOKIE_OPTIONS);
    cookieStore.set("user_phone", user.phone, COOKIE_OPTIONS);
    cookieStore.set("user_role", user.role || "user", PUBLIC_COOKIE_OPTIONS);
    cookieStore.set("is_logged_in", "true", PUBLIC_COOKIE_OPTIONS);

    return { success: true };
  } catch (error) {
    console.error("completeSmsRegisterAction error:", error);
    return { error: "Ro'yxatdan o'tishda xatolik yuz berdi" };
  }
}

// Google orqali kirish / ro'yxatdan o'tish
export async function googleLoginAction(email, name) {
  try {
    const { rows: existingUser } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (existingUser.length > 0) {
      const user = existingUser[0];
      const cookieStore = cookies();
      cookieStore.set("user_id", String(user.id), COOKIE_OPTIONS);
      cookieStore.set("user_name", user.name, COOKIE_OPTIONS);
      cookieStore.set("user_display_name", user.name, PUBLIC_COOKIE_OPTIONS);
      cookieStore.set("user_phone", user.phone, COOKIE_OPTIONS);
      cookieStore.set("user_role", user.role || "user", PUBLIC_COOKIE_OPTIONS);
      cookieStore.set("is_logged_in", "true", PUBLIC_COOKIE_OPTIONS);
      
      return { success: true };
    } else {
      const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
      const placeholderPhone = `google_${randomDigits}`;
      const dummyPassword = hashPassword(Math.random().toString(36));

      const { rows: newUser } = await pool.query(
        "INSERT INTO users (name, phone, password, email) VALUES ($1, $2, $3, $4) RETURNING *",
        [name, placeholderPhone, dummyPassword, email]
      );

      const user = newUser[0];
      const cookieStore = cookies();
      cookieStore.set("user_id", String(user.id), COOKIE_OPTIONS);
      cookieStore.set("user_name", user.name, COOKIE_OPTIONS);
      cookieStore.set("user_display_name", user.name, PUBLIC_COOKIE_OPTIONS);
      cookieStore.set("user_phone", user.phone, COOKIE_OPTIONS);
      cookieStore.set("user_role", user.role || "user", PUBLIC_COOKIE_OPTIONS);
      cookieStore.set("is_logged_in", "true", PUBLIC_COOKIE_OPTIONS);

      return { success: true };
    }
  } catch (error) {
    console.error("googleLoginAction error:", error);
    return { error: "Google orqali tizimga kirishda xatolik yuz berdi" };
  }
}

// Google akkauntlar ro'yxatini DB dan olish
export async function getGoogleAccountsAction() {
  try {
    const { rows } = await pool.query(
      "SELECT name, email FROM users WHERE email IS NOT NULL AND email != '' ORDER BY id ASC LIMIT 5"
    );
    return rows;
  } catch (error) {
    console.error("getGoogleAccountsAction error:", error);
    return [];
  }
}

// Google OAuth yo'naltirish URLini olish
export async function getGoogleAuthUrlAction(clientOrigin) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = clientOrigin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId) {
    // Development/Local mode fallback - redirect to the gorgeous simulated Google Login page
    return { url: `${appUrl}/login/google-oauth` };
  }
  
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent("openid email profile")}&state=google`;
  
  return { url };
}

// Tizimdan chiqish (Logout)
export async function logoutAction() {
  const cookieStore = cookies();
  cookieStore.delete("user_id");
  cookieStore.delete("user_name");
  cookieStore.delete("user_display_name");
  cookieStore.delete("user_phone");
  cookieStore.delete("user_role");
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
  const hasMortgage = formData.get("has_mortgage") === "true";
  const cadastreNumber = formData.get("cadastre_number") || null;
  const hasCadastreVerified = formData.get("has_cadastre_verified") === "true";
  const status = "active";
  const top = false;
  let agencyId = null;
  const postAsAgency = formData.get("postAsAgency") === "true";
  if (postAsAgency && user.agencyId) {
    agencyId = user.agencyId;
    
    // Agentlik e'lonlar kvotasini tekshiramiz
    const { rows: agencyRows } = await pool.query("SELECT listing_quota FROM agencies WHERE id = $1", [agencyId]);
    if (agencyRows.length > 0) {
      const quota = agencyRows[0].listing_quota;
      const { rows: countRows } = await pool.query("SELECT COUNT(*) FROM listings WHERE agency_id = $1", [agencyId]);
      const currentCount = parseInt(countRows[0].count, 10);
      if (currentCount >= quota) {
        return { error: `Agentlik e'lonlar kvotasi to'lgan (${quota} ta).` };
      }
    }
  }

  try {
    await pool.query(
      `INSERT INTO listings (price, price_num, type, cat, addr, rooms, baths, area, floor, top, photo, owner_id, agency_id, views, saves, status, pin_x, pin_y, description, phone, has_mortgage, has_cadastre_verified, cadastre_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
      [priceFormatted, priceNum, title, cat, addr, rooms, baths, area, floor, top, photo, user.id, agencyId, 0, 0, status, pinX, pinY, desc, user.phone, hasMortgage, hasCadastreVerified, cadastreNumber]
    );

    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/profile");
    if (agencyId) {
      revalidatePath(`/agencies/${agencyId}`);
      revalidatePath("/agency-dashboard");
    }
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

    const hasMortgage = formData.get("has_mortgage");
    if (hasMortgage !== null && hasMortgage !== undefined) {
      updates.push(`has_mortgage = $${paramIndex++}`);
      values.push(hasMortgage === "true" || hasMortgage === "on");
    }

    const cadastreNumber = formData.get("cadastre_number");
    if (cadastreNumber !== null && cadastreNumber !== undefined) {
      updates.push(`cadastre_number = $${paramIndex++}`);
      values.push(cadastreNumber || null);
    }

    const hasCadastreVerified = formData.get("has_cadastre_verified");
    if (hasCadastreVerified !== null && hasCadastreVerified !== undefined) {
      updates.push(`has_cadastre_verified = $${paramIndex++}`);
      values.push(hasCadastreVerified === "true" || hasCadastreVerified === "on");
    }

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

// Kadastr raqamini simulyatsiya qilib tekshirish va tasdiqlash
export async function verifyCadastreAction(listingId, cadastreNumber) {
  const user = await getCurrentUser();
  if (!user) return { error: "Ro'yxatdan o'tmagansiz" };

  try {
    const { rows: listingRows } = await pool.query("SELECT owner_id FROM listings WHERE id = $1", [listingId]);
    if (listingRows.length === 0) return { error: "E'lon topilmadi" };
    if (listingRows[0].owner_id !== user.id && user.role !== "admin") {
      return { error: "Sizda ushbu e'lonni tahrirlash huquqi yo'q" };
    }

    // Kadastr raqami formati tekshiruvi (XX:XX:XX:XX:XX:XXXX)
    const isValidFormat = /^\d{2}:\d{2}:\d{2}:\d{2}:\d{2}:\d{4}$/.test(cadastreNumber);
    if (!isValidFormat) {
      return { error: "Kadastr raqami formati noto'g'ri. Namuna: 01:05:03:02:01:0005" };
    }

    await pool.query(
      "UPDATE listings SET cadastre_number = $1, has_cadastre_verified = TRUE WHERE id = $2",
      [cadastreNumber, listingId]
    );

    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/profile");
    revalidatePath(`/property/${listingId}`);
    return { success: true };
  } catch (error) {
    console.error("verifyCadastreAction error:", error);
    return { error: "Kadastrni tasdiqlashda xatolik yuz berdi" };
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

  const idNum = parseInt(listingId);
  if (isNaN(idNum)) {
    return { error: "invalid_id" };
  }

  try {
    const { rows } = await pool.query(
      "SELECT * FROM favorites WHERE user_id = $1 AND listing_id = $2",
      [user.id, idNum]
    );

    if (rows.length > 0) {
      await pool.query("DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2", [user.id, idNum]);
      await pool.query("UPDATE listings SET saves = GREATEST(0, saves - 1) WHERE id = $1", [idNum]);
    } else {
      await pool.query("INSERT INTO favorites (user_id, listing_id) VALUES ($1, $2)", [user.id, idNum]);
      await pool.query("UPDATE listings SET saves = saves + 1 WHERE id = $1", [idNum]);
    }

    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/profile");
    revalidatePath(`/property/${idNum}`);
    return { success: true };
  } catch (error) {
    console.error("toggleFavoriteAction error:", error);
    return { error: error.message || "Xatolik yuz berdi" };
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
    // E'lon agentlikka tegishli ekanligini va uni kim yuklaganini tekshiramiz
    const { rows: listingRows } = await pool.query(
      "SELECT agency_id, owner_id FROM listings WHERE id = $1",
      [listingId]
    );

    let agencyId = null;
    let assignedTo = null;

    if (listingRows.length > 0) {
      agencyId = listingRows[0].agency_id;
      if (agencyId) {
        // Agar listing agentlikka tegishli bo'lsa, avtomatik ravishda e'lon egasiga (maklerga) taqsimlaymiz
        assignedTo = listingRows[0].owner_id;
      }
    }

    await pool.query(
      `INSERT INTO messages (sender_id, sender_name, sender_phone, receiver_id, listing_id, content, agency_id, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [senderId, senderName, senderPhone, receiverId, listingId, content, agencyId, assignedTo]
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
    cookieStore.set("user_display_name", name, PUBLIC_COOKIE_OPTIONS);
    cookieStore.set("user_phone", phone, COOKIE_OPTIONS);
    
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("updateSettingsAction error:", error);
    return { error: "Sozlamalarni yangilashda xatolik yuz berdi" };
  }
}

// Admin action: E'lonni tasdiqlash
export async function adminApproveListingAction(listingId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Ruxsat berilmagan (unauthorized)" };
  }

  try {
    await pool.query(
      "UPDATE listings SET status = 'active' WHERE id = $1",
      [listingId]
    );
    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("adminApproveListingAction error:", error);
    return { error: "E'lonni tasdiqlashda xatolik yuz berdi" };
  }
}

// Admin action: E'lonni top-ga chiqarish / top-dan olish
export async function adminToggleTopListingAction(listingId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Ruxsat berilmagan (unauthorized)" };
  }

  try {
    await pool.query(
      "UPDATE listings SET top = NOT top WHERE id = $1",
      [listingId]
    );
    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("adminToggleTopListingAction error:", error);
    return { error: "E'lon holatini o'zgartirishda xatolik yuz berdi" };
  }
}

// Admin action: E'lonni o'chirish (Tranzaksiya bilan)
export async function adminDeleteListingAction(listingId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Ruxsat berilmagan (unauthorized)" };
  }

  try {
    await pool.query("BEGIN");
    await pool.query("DELETE FROM favorites WHERE listing_id = $1", [listingId]);
    await pool.query("DELETE FROM messages WHERE listing_id = $1", [listingId]);
    await pool.query("DELETE FROM listings WHERE id = $1", [listingId]);
    await pool.query("COMMIT");

    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("adminDeleteListingAction error:", error);
    return { error: "E'lonni o'chirishda xatolik yuz berdi" };
  }
}

// Admin action: Foydalanuvchi rolini o'zgartirish
export async function adminUpdateUserRoleAction(userId, role) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Ruxsat berilmagan (unauthorized)" };
  }

  if (user.id === userId && role !== "admin") {
    return { error: "O'z rolingizni o'zgartira olmaysiz" };
  }

  try {
    await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2",
      [role, userId]
    );
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("adminUpdateUserRoleAction error:", error);
    return { error: "Rolni o'zgartirishda xatolik yuz berdi" };
  }
}

// Admin action: Foydalanuvchini o'chirish (barcha bog'liq e'lonlar, xabarlar o'chib ketadi CASCADE orqali)
export async function adminDeleteUserAction(userId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Ruxsat berilmagan (unauthorized)" };
  }

  if (user.id === userId) {
    return { error: "O'zingizni o'chira olmaysiz" };
  }

  try {
    await pool.query("BEGIN");
    await pool.query("DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1", [userId]);
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    await pool.query("COMMIT");

    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("adminDeleteUserAction error:", error);
    return { error: "Foydalanuvchini o'chirishda xatolik yuz berdi" };
  }
}

// ======================================================
// B2B AGENTLIK ACTIONS
// ======================================================

// Yangi agentlik yaratish
export async function createAgencyAction(formData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Tizimga kiring" };

  const name = formData.get("name");
  let slug = formData.get("slug") || name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

  if (!name) return { error: "Agentlik nomi majburiy" };

  try {
    // Slug unique qilish
    const { rows: existing } = await pool.query("SELECT id FROM agencies WHERE slug = $1", [slug]);
    if (existing.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const { rows } = await pool.query(
      `INSERT INTO agencies (name, slug, phone, address, description, website, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        name,
        slug,
        formData.get("phone") || "",
        formData.get("address") || "",
        formData.get("description") || "",
        formData.get("website") || "",
        user.id
      ]
    );

    const agency = rows[0];

    // Egani ham xodim sifatida qo'shamiz (role: owner)
    await pool.query(
      "INSERT INTO agency_members (agency_id, user_id, role) VALUES ($1, $2, 'owner') ON CONFLICT DO NOTHING",
      [agency.id, user.id]
    );

    // Foydalanuvchining agency_id sini yangilaymiz
    await pool.query("UPDATE users SET agency_id = $1 WHERE id = $2", [agency.id, user.id]);

    revalidatePath("/agencies");
    revalidatePath("/agency-dashboard");
    return { success: true, agency };
  } catch (error) {
    console.error("createAgencyAction error:", error);
    return { error: "Agentlik yaratishda xatolik yuz berdi" };
  }
}

// Agentlik ma'lumotlarini yangilash
export async function updateAgencyAction(formData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Tizimga kiring" };

  const agencyId = parseInt(formData.get("agency_id"));

  try {
    const { rows } = await pool.query(
      "SELECT id FROM agencies WHERE id = $1 AND owner_id = $2",
      [agencyId, user.id]
    );
    if (rows.length === 0) return { error: "Ruxsat yo'q" };

    await pool.query(
      `UPDATE agencies SET name=$1, phone=$2, address=$3, description=$4, website=$5 WHERE id=$6`,
      [
        formData.get("name"),
        formData.get("phone") || "",
        formData.get("address") || "",
        formData.get("description") || "",
        formData.get("website") || "",
        agencyId
      ]
    );

    revalidatePath("/agency-dashboard");
    revalidatePath("/agencies");
    return { success: true };
  } catch (error) {
    console.error("updateAgencyAction error:", error);
    return { error: "Yangilashda xatolik yuz berdi" };
  }
}

// Agentlikka xodim qo'shish (telefon raqami orqali)
export async function addAgencyMemberAction(agencyId, phone) {
  const user = await getCurrentUser();
  if (!user) return { error: "Tizimga kiring" };

  try {
    // Egasini tekshiramiz
    const { rows: agencyRows } = await pool.query(
      "SELECT id FROM agencies WHERE id = $1 AND owner_id = $2",
      [agencyId, user.id]
    );
    if (agencyRows.length === 0) return { error: "Ruxsat yo'q" };

    // Foydalanuvchini topamiz
    const { rows: userRows } = await pool.query(
      "SELECT id, name, phone FROM users WHERE phone = $1",
      [phone]
    );
    if (userRows.length === 0) {
      return { error: "Bu telefon raqamli foydalanuvchi topilmadi" };
    }

    const member = userRows[0];

    const { rows: insertRows } = await pool.query(
      "INSERT INTO agency_members (agency_id, user_id, role) VALUES ($1, $2, 'agent') ON CONFLICT (agency_id, user_id) DO NOTHING RETURNING id",
      [agencyId, member.id]
    );

    if (insertRows.length === 0) {
      return { error: "Bu foydalanuvchi allaqachon jamoada" };
    }

    // Xodimning agency_id sini yangilaymiz
    await pool.query("UPDATE users SET agency_id = $1 WHERE id = $2", [agencyId, member.id]);

    revalidatePath("/agency-dashboard");
    return {
      success: true,
      member: { ...member, role: "agent", member_id: insertRows[0].id }
    };
  } catch (error) {
    console.error("addAgencyMemberAction error:", error);
    return { error: "Xodim qo'shishda xatolik" };
  }
}

// Agentlikdan xodimni chiqarish
export async function removeAgencyMemberAction(memberRowId) {
  const user = await getCurrentUser();
  if (!user) return { error: "Tizimga kiring" };

  try {
    const { rows } = await pool.query(
      `SELECT am.*, a.owner_id FROM agency_members am
       JOIN agencies a ON am.agency_id = a.id
       WHERE am.id = $1`,
      [memberRowId]
    );

    if (rows.length === 0) return { error: "Xodim topilmadi" };
    if (rows[0].owner_id !== user.id) return { error: "Ruxsat yo'q" };
    if (rows[0].role === "owner") return { error: "Agentlik egasini chiqarib bo'lmaydi" };

    const membUserId = rows[0].user_id;

    await pool.query("DELETE FROM agency_members WHERE id = $1", [memberRowId]);
    await pool.query("UPDATE users SET agency_id = NULL WHERE id = $1", [membUserId]);

    revalidatePath("/agency-dashboard");
    return { success: true };
  } catch (error) {
    console.error("removeAgencyMemberAction error:", error);
    return { error: "Xodim chiqarishda xatolik" };
  }
}

// Lidni xodimga taqsimlash
export async function assignLeadAction(messageId, assignedUserId) {
  const user = await getCurrentUser();
  if (!user) return { error: "Tizimga kiring" };

  try {
    // Agentlik egasimi tekshiramiz
    const { rows } = await pool.query(
      `SELECT m.id FROM messages m
       JOIN agencies a ON m.agency_id = a.id
       WHERE m.id = $1 AND a.owner_id = $2`,
      [messageId, user.id]
    );

    if (rows.length === 0) return { error: "Ruxsat yo'q" };

    await pool.query(
      "UPDATE messages SET assigned_to = $1 WHERE id = $2",
      [assignedUserId, messageId]
    );

    return { success: true };
  } catch (error) {
    console.error("assignLeadAction error:", error);
    return { error: "Taqsimlashda xatolik" };
  }
}

// Feed import (JSON dan e'lonlar yuklash)
export async function importFeedAction(agencyId, listings) {
  const user = await getCurrentUser();
  if (!user) return { error: "Tizimga kiring" };

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

  try {
    const { rows: agencyRows } = await pool.query(
      "SELECT * FROM agencies WHERE id = $1 AND owner_id = $2",
      [agencyId, user.id]
    );
    if (agencyRows.length === 0) return { error: "Ruxsat yo'q" };

    const agency = agencyRows[0];

    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*) FROM listings WHERE agency_id = $1",
      [agencyId]
    );
    const currentCount = parseInt(countRows[0].count, 10);

    if (currentCount + listings.length > agency.listing_quota) {
      return {
        error: `Kvota yetarli emas. Sizda ${agency.listing_quota - currentCount} ta e'lon joyi qolgan.`
      };
    }

    let imported = 0;
    let errors = 0;

    for (const item of listings) {
      try {
        const priceNum = parseInt(item.price) || 0;
        const priceFormatted = item.cat === "Ijara"
          ? `$${priceNum.toLocaleString().replace(/,/g, " ")}/oy`
          : `$${priceNum.toLocaleString().replace(/,/g, " ")}`;
        const district = item.district || "Chilonzor";
        const coords = DISTRICT_PINS[district] || { x: 150, y: 150 };

        await pool.query(
          `INSERT INTO listings
            (price, price_num, type, cat, addr, rooms, baths, area, floor, top, photo, owner_id, agency_id, views, saves, status, pin_x, pin_y, description, phone, has_mortgage)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
          [
            priceFormatted, priceNum,
            item.title || "E'lon",
            item.cat || "Yangi uylar",
            item.address || district,
            parseInt(item.rooms) || 1,
            parseInt(item.baths) || 1,
            parseInt(item.area) || 50,
            item.floor || "1/5",
            false,
            item.photo || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=75",
            user.id, agencyId,
            0, 0, "active",
            coords.x, coords.y,
            item.description || "",
            item.phone || agency.phone || "",
            false
          ]
        );
        imported++;
      } catch (err) {
        console.error("Feed item error:", err.message);
        errors++;
      }
    }

    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/agency-dashboard");
    return { success: true, imported, updated: 0, errors };
  } catch (error) {
    console.error("importFeedAction error:", error);
    return { error: "Import xatosi: " + error.message };
  }
}

// ======================================================
// REVIEW (REYTING VA SHARHLAR) ACTIONS
// ======================================================

// Sharh qo'shish
export async function addReviewAction(formData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Tizimga kiring" };

  const reviewedUserId = parseInt(formData.get("reviewed_user_id"));
  const listingId = parseInt(formData.get("listing_id")) || null;
  const rating = parseInt(formData.get("rating"));
  const comment = formData.get("comment") || "";

  if (!reviewedUserId || !rating || rating < 1 || rating > 5) {
    return { error: "To'liq ma'lumot kiriting" };
  }

  if (user.id === reviewedUserId) {
    return { error: "O'zingizga sharh yozib bo'lmaydi" };
  }

  try {
    // Bir e'longa bir marta sharh yozish mumkin
    if (listingId) {
      const { rows: existing } = await pool.query(
        "SELECT id FROM reviews WHERE reviewer_id = $1 AND listing_id = $2",
        [user.id, listingId]
      );
      if (existing.length > 0) {
        return { error: "Siz bu e'lon uchun allaqachon sharh yozgansiz" };
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO reviews (reviewer_id, reviewed_user_id, listing_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, reviewedUserId, listingId, rating, comment]
    );

    revalidatePath(`/property/${listingId}`);
    return { success: true, review: rows[0] };
  } catch (error) {
    console.error("addReviewAction error:", error);
    return { error: "Sharh qo'shishda xatolik yuz berdi" };
  }
}

// Sharhlarni olish
export async function getReviewsAction(reviewedUserId) {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.name AS reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewed_user_id = $1
       ORDER BY r.created_at DESC`,
      [reviewedUserId]
    );
    return rows;
  } catch (error) {
    console.error("getReviewsAction error:", error);
    return [];
  }
}

// Solishtirish sahifasi uchun tanlangan e'lonlarni ID bo'yicha olish
export async function getListingsByIdsAction(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  
  try {
    const { rows } = await pool.query(
      `SELECT l.*, u.name as owner_name, u.is_verified as owner_verified FROM listings l
       LEFT JOIN users u ON l.owner_id = u.id
       WHERE l.id = ANY($1)`,
      [ids.map(id => parseInt(id))]
    );
    
    return rows.map(row => ({
      id: row.id,
      price: row.price,
      priceNum: row.price_num,
      type: row.type,
      cat: row.cat,
      addr: row.addr,
      rooms: row.rooms,
      baths: row.baths,
      area: row.area,
      floor: row.floor,
      photo: row.photo,
      owner: row.owner_name || "",
      ownerVerified: row.owner_verified ?? false,
      hasCadastreVerified: row.has_cadastre_verified ?? false,
      cadastreNumber: row.cadastre_number || ""
    }));
  } catch (error) {
    console.error("getListingsByIdsAction error:", error);
    return [];
  }
}

