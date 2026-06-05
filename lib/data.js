import pool from "./db";

// Barcha e'lonlarni olish (filtrlash va sahifalash bilan)
export async function getListings({ cat, q, page = 1, limit = 20 } = {}) {
  let query = `
    SELECT l.*, u.name as owner_name FROM listings l
    LEFT JOIN users u ON l.owner_id = u.id
    WHERE l.status = 'active'
  `;
  const params = [];

  if (cat) {
    // Toifa nomidagi nomuvofiqlikni bartaraf etamiz
    let categoryParam = cat;
    if (cat === "Yangi uy") categoryParam = "Yangi uylar";
    
    query += " AND l.cat = $" + (params.length + 1);
    params.push(categoryParam);
  }

  if (q) {
    query += " AND (l.type ILIKE $" + (params.length + 1) + " OR l.addr ILIKE $" + (params.length + 2) + ")";
    params.push(`%${q}%`, `%${q}%`);
  }

  query += " ORDER BY l.top DESC, l.id DESC";

  try {
    const { rows } = await pool.query(query, params);
    return rows.map(mapListingFromDb);
  } catch (error) {
    console.error("getListings error:", error);
    return [];
  }
}

// Bitta e'lonni ID bo'yicha olish
export async function getListingById(id) {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, u.name as owner_name FROM listings l
       LEFT JOIN users u ON l.owner_id = u.id
       WHERE l.id = $1`,
      [id]
    );
    if (rows.length === 0) return null;
    return mapListingFromDb(rows[0]);
  } catch (error) {
    console.error("getListingById error:", error);
    return null;
  }
}

// Profildagi e'lonlarni olish
export async function getProfileListings(ownerId) {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, u.name as owner_name FROM listings l
       LEFT JOIN users u ON l.owner_id = u.id
       WHERE l.owner_id = $1 ORDER BY l.id DESC`,
      [ownerId]
    );
    return rows.map(mapListingFromDb);
  } catch (error) {
    console.error("getProfileListings error:", error);
    return [];
  }
}

// Faol e'lonlar sonini olish
export async function getListingCount() {
  try {
    const { rows } = await pool.query("SELECT COUNT(*) FROM listings WHERE status = 'active'");
    return parseInt(rows[0].count, 10);
  } catch (error) {
    console.error("getListingCount error:", error);
    return 0;
  }
}

// O'xshash e'lonlarni olish (bir xil toifadagi boshqa e'lonlar)
export async function getSimilarListings(listingId, cat, limit = 3) {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, u.name as owner_name FROM listings l
       LEFT JOIN users u ON l.owner_id = u.id
       WHERE l.cat = $1 AND l.id != $2 AND l.status = 'active' 
       ORDER BY l.top DESC, l.views DESC 
       LIMIT $3`,
      [cat, listingId, limit]
    );
    return rows.map(mapListingFromDb);
  } catch (error) {
    console.error("getSimilarListings error:", error);
    return [];
  }
}

// Egasining e'lonlar sonini olish
export async function getOwnerListingCount(ownerId) {
  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*) FROM listings WHERE owner_id = $1",
      [ownerId]
    );
    return parseInt(rows[0].count, 10);
  } catch (error) {
    console.error("getOwnerListingCount error:", error);
    return 0;
  }
}

// Egasining telefon raqamini olish
export async function getOwnerPhone(ownerId) {
  try {
    const { rows } = await pool.query(
      "SELECT phone FROM users WHERE id = $1",
      [ownerId]
    );
    if (rows.length === 0) return null;
    return rows[0].phone;
  } catch (error) {
    console.error("getOwnerPhone error:", error);
    return null;
  }
}

// Ma'lumotlar bazasidagi qatorni frontend formatiga o'tkazish
function mapListingFromDb(row) {
  return {
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
    top: row.top,
    photo: row.photo,
    owner: row.owner_name || "",
    ownerId: row.owner_id,
    views: row.views || 0,
    saves: row.saves || 0,
    status: row.status,
    pinX: row.pin_x,
    pinY: row.pin_y,
    description: row.description || "",
    phone: row.phone || "",
    createdAt: row.created_at
  };
}

// Toifalar ro'yxati
export const categories = [
  { key: "Yangi uylar", icon: "ti-building-skyscraper", sub: "Novostroyka, JK", bg: "var(--orange-tint)", fg: "var(--orange-dark)" },
  { key: "Ikkilamchi", icon: "ti-home", sub: "Tayyor kvartiralar", bg: "var(--blue-tint)", fg: "var(--blue)" },
  { key: "Ijara", icon: "ti-key", sub: "Kunlik va oylik", bg: "var(--amber-tint)", fg: "var(--amber)" },
  { key: "Ofis", icon: "ti-briefcase", sub: "Biznes uchun", bg: "var(--purple-tint)", fg: "var(--purple)" },
];
