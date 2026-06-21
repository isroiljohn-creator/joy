import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { verifySignedValue } from "@/lib/hash";

export const dynamic = "force-dynamic";

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

export async function POST(request) {
  // CSRF himoyasi uchun headerlarni tekshiramiz
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    return NextResponse.json({ error: "Xavfsizlik tekshiruvi: CSRF bloklandi" }, { status: 403 });
  }

  const client = await pool.connect();
  try {
    // Foydalanuvchini tekshiramiz
    const cookieStore = cookies();
    const signedId = cookieStore.get("user_id")?.value;
    const userId = signedId ? verifySignedValue(signedId) : null;
    if (!userId) {
      return NextResponse.json({ error: "Tizimga kiring" }, { status: 401 });
    }

    const body = await request.json();
    const { agency_id, listings: feedListings } = body;

    if (!agency_id || !Array.isArray(feedListings)) {
      return NextResponse.json({ error: "agency_id va listings[] talab qilinadi" }, { status: 400 });
    }

    await client.query("BEGIN");

    // Agentlik egasini tekshiramiz va quota qatorini poyga holatining oldini olish uchun FOR UPDATE bilan qulflaymiz
    const { rows: agencyRows } = await client.query(
      "SELECT * FROM agencies WHERE id = $1 AND owner_id = $2 FOR UPDATE",
      [agency_id, parseInt(userId)]
    );

    if (agencyRows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Siz bu agentlik egasi emassiz" }, { status: 403 });
    }

    const agency = agencyRows[0];

    // Kvotani tekshiramiz
    const { rows: countRows } = await client.query(
      "SELECT COUNT(*) FROM listings WHERE agency_id = $1 AND deleted_at IS NULL",
      [agency_id]
    );
    const currentCount = parseInt(countRows[0].count, 10);

    if (currentCount + feedListings.length > agency.listing_quota) {
      await client.query("ROLLBACK");
      return NextResponse.json({
        error: `Kvota yetarli emas. Sizda ${agency.listing_quota - currentCount} ta e'lon joyi qolgan.`
      }, { status: 400 });
    }

    let imported = 0;
    let errors = 0;
    const VALID_CATEGORIES = ["Yangi uylar", "Ikkilamchi", "Ijara", "Ofis"];

    for (const item of feedListings) {
      try {
        const priceNum = parseInt(item.price) || 0;
        const rooms = parseInt(item.rooms) || 1;
        const baths = parseInt(item.baths) || 1;
        const area = parseInt(item.area) || 50;

        // Kiritilayotgan ma'lumotlarni tekshirish (manfiy/nol qiymatlarni bloklash)
        if (priceNum <= 0 || rooms <= 0 || baths <= 0 || area <= 0) {
          throw new Error("Narx, maydon va xona o'lchamlari noldan katta bo'lishi shart!");
        }

        let category = item.cat || "Yangi uylar";
        if (category === "Yangi uy") category = "Yangi uylar";
        if (!VALID_CATEGORIES.includes(category)) {
          throw new Error("Noto'g'ri toifa!");
        }

        const priceFormatted = category === "Ijara"
          ? `$${priceNum.toLocaleString().replace(/,/g, " ")}/oy`
          : `$${priceNum.toLocaleString().replace(/,/g, " ")}`;
        const district = item.district || "Chilonzor";
        const coords = DISTRICT_PINS[district] || { x: 150, y: 150 };

        await client.query(
          `INSERT INTO listings 
            (price, price_num, type, cat, addr, rooms, baths, area, floor, top, photo, owner_id, agency_id, views, saves, status, pin_x, pin_y, description, phone, has_mortgage)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
          [
            priceFormatted,
            priceNum,
            item.title || "E'lon",
            category,
            item.address || district,
            rooms,
            baths,
            area,
            item.floor || "1/5",
            false,
            item.photo || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=75",
            parseInt(userId),
            agency_id,
            0,
            0,
            "active",
            coords.x,
            coords.y,
            item.description || "",
            item.phone || agency.phone || "",
            false
          ]
        );
        imported++;
      } catch (err) {
        console.error("Feed import item error:", err.message);
        errors++;
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true, imported, updated: 0, errors });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Feed import API error:", error);
    return NextResponse.json({ error: "Import paytida xatolik yuz berdi" }, { status: 500 });
  } finally {
    client.release();
  }
}
