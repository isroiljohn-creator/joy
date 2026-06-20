import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

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
  try {
    // Foydalanuvchini tekshiramiz
    const cookieStore = cookies();
    const userId = cookieStore.get("user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Tizimga kiring" }, { status: 401 });
    }

    const body = await request.json();
    const { agency_id, listings: feedListings } = body;

    if (!agency_id || !Array.isArray(feedListings)) {
      return NextResponse.json({ error: "agency_id va listings[] talab qilinadi" }, { status: 400 });
    }

    // Agentlik egasini tekshiramiz
    const { rows: agencyRows } = await pool.query(
      "SELECT * FROM agencies WHERE id = $1 AND owner_id = $2",
      [agency_id, parseInt(userId)]
    );

    if (agencyRows.length === 0) {
      return NextResponse.json({ error: "Siz bu agentlik egasi emassiz" }, { status: 403 });
    }

    const agency = agencyRows[0];

    // Kvotani tekshiramiz
    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*) FROM listings WHERE agency_id = $1",
      [agency_id]
    );
    const currentCount = parseInt(countRows[0].count, 10);

    if (currentCount + feedListings.length > agency.listing_quota) {
      return NextResponse.json({
        error: `Kvota yetarli emas. Sizda ${agency.listing_quota - currentCount} ta e'lon joyi qolgan.`
      }, { status: 400 });
    }

    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (const item of feedListings) {
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
            priceFormatted,
            priceNum,
            item.title || "E'lon",
            item.cat || "Yangi uylar",
            item.address || district,
            parseInt(item.rooms) || 1,
            parseInt(item.baths) || 1,
            parseInt(item.area) || 50,
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
        console.error("Feed import item error:", err);
        errors++;
      }
    }

    return NextResponse.json({ success: true, imported, updated, errors });
  } catch (error) {
    console.error("Feed import API error:", error);
    return NextResponse.json({ error: "Import paytida xatolik yuz berdi" }, { status: 500 });
  }
}
