"use server";
import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// Sessiyadagi joriy foydalanuvchini olish
export async function getCurrentUser() {
  const cookieStore = cookies();
  const id = cookieStore.get("user_id")?.value;
  const name = cookieStore.get("user_name")?.value;
  const phone = cookieStore.get("user_phone")?.value;
  if (!id) return null;
  return { id: parseInt(id), name, phone };
}

// Kirish (Login)
export async function loginAction(formData) {
  const phone = formData.get("phone");
  const password = formData.get("password");

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
    if (rows.length === 0 || rows[0].password !== password) {
      return { error: "Telefon raqami yoki parol noto'g'ri" };
    }

    const user = rows[0];
    const cookieStore = cookies();
    cookieStore.set("user_id", String(user.id), { path: "/" });
    cookieStore.set("user_name", user.name, { path: "/" });
    cookieStore.set("user_phone", user.phone, { path: "/" });
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

  try {
    const { rows } = await pool.query(
      "INSERT INTO users (name, phone, password) VALUES ($1, $2, $3) RETURNING *",
      [name, phone, password]
    );
    const user = rows[0];
    const cookieStore = cookies();
    cookieStore.set("user_id", String(user.id), { path: "/" });
    cookieStore.set("user_name", user.name, { path: "/" });
    cookieStore.set("user_phone", user.phone, { path: "/" });
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
  const pinX = Math.floor(Math.random() * 320) + 40;
  const pinY = Math.floor(Math.random() * 360) + 40;
  const photo = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=75";
  const status = "active";
  const top = false;

  try {
    await pool.query(
      `INSERT INTO listings (price, price_num, type, cat, addr, rooms, baths, area, floor, top, photo, owner, views, saves, status, pin_x, pin_y)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [priceFormatted, priceNum, title, cat, addr, rooms, baths, area, floor, top, photo, user.name, 0, 0, status, pinX, pinY]
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
      // Saqlanganlardan o'chirish
      await pool.query("DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2", [user.id, listingId]);
      await pool.query("UPDATE listings SET saves = GREATEST(0, saves - 1) WHERE id = $1", [listingId]);
    } else {
      // Saqlanganlarga qo'shish
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

// Xabar yuborish (Send message to owner)
export async function sendMessageAction(formData) {
  const user = await getCurrentUser();
  const listingId = parseInt(formData.get("listing_id"));
  const receiverOwner = formData.get("receiver_owner");
  const content = formData.get("content");
  
  let senderId = user ? user.id : null;
  let senderName = formData.get("sender_name");
  let senderPhone = formData.get("sender_phone");

  if (user) {
    senderName = user.name;
    senderPhone = user.phone;
  }

  if (!senderName || !senderPhone || !content) {
    return { error: "Ma'lumotlar to'liq kiritilmadi" };
  }

  try {
    await pool.query(
      `INSERT INTO messages (sender_id, sender_name, sender_phone, receiver_owner, listing_id, content)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [senderId, senderName, senderPhone, receiverOwner, listingId, content]
    );
    return { success: true };
  } catch (error) {
    console.error("sendMessageAction error:", error);
    return { error: "Xabar yuborishda xatolik yuz berdi" };
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
    cookieStore.set("user_name", name, { path: "/" });
    cookieStore.set("user_phone", phone, { path: "/" });
    
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("updateSettingsAction error:", error);
    return { error: "Sozlamalarni yangilashda xatolik yuz berdi" };
  }
}
