import pool from "./db";

export async function getListings({ cat, q } = {}) {
  let query = "SELECT * FROM listings WHERE status = 'active'";
  const params = [];

  if (cat) {
    // Toifa nomidagi nomuvofiqlikni bartaraf etamiz
    let categoryParam = cat;
    if (cat === "Yangi uy") categoryParam = "Yangi uylar";
    
    query += " AND cat = $" + (params.length + 1);
    params.push(categoryParam);
  }

  if (q) {
    query += " AND (type ILIKE $" + (params.length + 1) + " OR addr ILIKE $" + (params.length + 2) + ")";
    params.push(`%${q}%`, `%${q}%`);
  }

  query += " ORDER BY top DESC, id DESC";

  try {
    const { rows } = await pool.query(query, params);
    return rows.map(mapListingFromDb);
  } catch (error) {
    console.error("getListings error:", error);
    return [];
  }
}

export async function getListingById(id) {
  try {
    const { rows } = await pool.query("SELECT * FROM listings WHERE id = $1", [id]);
    if (rows.length === 0) return null;
    return mapListingFromDb(rows[0]);
  } catch (error) {
    console.error("getListingById error:", error);
    return null;
  }
}

export async function getProfileListings(ownerName = "Aziz Karimov") {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM listings WHERE owner = $1 ORDER BY id DESC",
      [ownerName]
    );
    return rows.map(mapListingFromDb);
  } catch (error) {
    console.error("getProfileListings error:", error);
    return [];
  }
}

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
    owner: row.owner,
    views: row.views || 0,
    saves: row.saves || 0,
    status: row.status,
    pinX: row.pin_x,
    pinY: row.pin_y,
    createdAt: row.created_at
  };
}

export const categories = [
  { key: "Yangi uylar", icon: "ti-building-skyscraper", sub: "Novostroyka, JK", bg: "var(--orange-tint)", fg: "var(--orange-dark)" },
  { key: "Ikkilamchi", icon: "ti-home", sub: "Tayyor kvartiralar", bg: "var(--blue-tint)", fg: "var(--blue)" },
  { key: "Ijara", icon: "ti-key", sub: "Kunlik va oylik", bg: "var(--amber-tint)", fg: "var(--amber)" },
  { key: "Ofis", icon: "ti-briefcase", sub: "Biznes uchun", bg: "var(--purple-tint)", fg: "var(--purple)" },
];
