"use server";
import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createListingAction(formData) {
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

  // Narxni formatlaymiz ($72 000 ko'rinishida)
  const priceNum = parseInt(priceInput.replace(/\s/g, "")) || 0;
  const priceFormatted = "$" + priceNum.toLocaleString().replace(/,/g, " ");

  // Toifa birlik/ko'plik nomuvofiqligini to'g'irlaymiz
  let cat = catRaw || "Yangi uylar";
  if (cat === "Yangi uy") {
    cat = "Yangi uylar";
  }

  const addr = `${district} ${quarter}`;

  // Random xarita pin koordinatalarini generatsiya qilamiz (xaritadan tashqariga chiqib ketmasligi uchun)
  const pinX = Math.floor(Math.random() * 320) + 40; // 40-360 oralig'ida
  const pinY = Math.floor(Math.random() * 360) + 40; // 40-400 oralig'ida

  // Standart rasm
  const photo = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=75";
  const owner = "Aziz Karimov";
  const status = "active"; // Foydalanuvchi darhol natijani ko'rishi uchun active qilamiz
  const top = false;

  try {
    await pool.query(
      `INSERT INTO listings (price, price_num, type, cat, addr, rooms, baths, area, floor, top, photo, owner, views, saves, status, pin_x, pin_y)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [priceFormatted, priceNum, title, cat, addr, rooms, baths, area, floor, top, photo, owner, 0, 0, status, pinX, pinY]
    );

    // Keshni tozalab, foydalanuvchini yo'naltiramiz
    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/profile");
  } catch (error) {
    console.error("createListingAction error:", error);
    return { error: "Ma'lumotlar bazasiga yozishda xatolik yuz berdi" };
  }

  redirect("/profile");
}
