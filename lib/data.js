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
    const mapped = rows.map(mapListingFromDb);
    return await attachPriceAnalysis(mapped);
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
    const mapped = mapListingFromDb(rows[0]);
    const analyzed = await attachPriceAnalysis([mapped]);
    return analyzed[0];
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
    const mapped = rows.map(mapListingFromDb);
    return await attachPriceAnalysis(mapped);
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
    const mapped = rows.map(mapListingFromDb);
    return await attachPriceAnalysis(mapped);
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
    createdAt: row.created_at,
    hasMortgage: row.has_mortgage ?? false
  };
}

// Bozordagi o'rtacha narxga nisbatan qimmat/arzonligini tahlil qilish
export async function attachPriceAnalysis(listings) {
  if (!listings || listings.length === 0) return listings;
  
  try {
    const { rows: avgRows } = await pool.query(`
      SELECT cat, AVG(price_num::float / NULLIF(area, 0)::float) as avg_m2
      FROM listings
      WHERE status = 'active' AND area > 0 AND price_num > 0
      GROUP BY cat
    `);
    
    const avgMap = {};
    avgRows.forEach(row => {
      avgMap[row.cat] = parseFloat(row.avg_m2) || 0;
    });

    return listings.map(l => {
      const m2Price = l.area > 0 ? (l.priceNum / l.area) : 0;
      const catAvg = avgMap[l.cat] || 0;
      
      let priceStatus = "average";
      let priceDiffPercent = 0;
      
      if (catAvg > 0 && m2Price > 0) {
        priceDiffPercent = Math.round(((m2Price - catAvg) / catAvg) * 100);
        if (priceDiffPercent < -5) {
          priceStatus = "cheap";
        } else if (priceDiffPercent > 5) {
          priceStatus = "expensive";
        }
      }
      
      return {
        ...l,
        priceStatus,
        priceDiffPercent,
        catAvgM2: Math.round(catAvg)
      };
    });
  } catch (error) {
    console.error("attachPriceAnalysis error:", error);
    return listings.map(l => ({ ...l, priceStatus: "average", priceDiffPercent: 0 }));
  }
}

// Toifalar ro'yxati
export const categories = [
  { key: "Yangi uylar", icon: "ti-building-skyscraper", sub: "Novostroyka, JK", bg: "var(--cream)", fg: "var(--orange)" },
  { key: "Ikkilamchi", icon: "ti-home", sub: "Tayyor kvartiralar", bg: "var(--cream)", fg: "var(--orange)" },
  { key: "Ijara", icon: "ti-key", sub: "Kunlik va oylik", bg: "var(--cream)", fg: "var(--orange)" },
  { key: "Ofis", icon: "ti-briefcase", sub: "Biznes uchun", bg: "var(--cream)", fg: "var(--orange)" },
];

// Admin panel statistikasini olish
export async function adminGetStats() {
  try {
    const totalListings = await pool.query("SELECT COUNT(*) FROM listings");
    const activeListings = await pool.query("SELECT COUNT(*) FROM listings WHERE status = 'active'");
    const pendingListings = await pool.query("SELECT COUNT(*) FROM listings WHERE status = 'pending'");
    const totalUsers = await pool.query("SELECT COUNT(*) FROM users");
    const totalViews = await pool.query("SELECT SUM(views) FROM listings");
    const totalMessages = await pool.query("SELECT COUNT(*) FROM messages");

    return {
      listingsCount: parseInt(totalListings.rows[0]?.count || 0, 10),
      activeListingsCount: parseInt(activeListings.rows[0]?.count || 0, 10),
      pendingListingsCount: parseInt(pendingListings.rows[0]?.count || 0, 10),
      usersCount: parseInt(totalUsers.rows[0]?.count || 0, 10),
      viewsCount: parseInt(totalViews.rows[0]?.sum || 0, 10),
      messagesCount: parseInt(totalMessages.rows[0]?.count || 0, 10)
    };
  } catch (error) {
    console.error("adminGetStats error:", error);
    return {
      listingsCount: 0,
      activeListingsCount: 0,
      pendingListingsCount: 0,
      usersCount: 0,
      viewsCount: 0,
      messagesCount: 0
    };
  }
}

// Barcha e'lonlarni yuklash (kutilayotgan va faol)
export async function adminGetListings() {
  try {
    const { rows } = await pool.query(`
      SELECT l.*, u.name as owner_name FROM listings l
      LEFT JOIN users u ON l.owner_id = u.id
      ORDER BY l.id DESC
    `);
    const mapped = rows.map(mapListingFromDb);
    return await attachPriceAnalysis(mapped);
  } catch (error) {
    console.error("adminGetListings error:", error);
    return [];
  }
}

// Barcha foydalanuvchilar ro'yxati
export async function adminGetUsers() {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, phone, role, created_at FROM users
      ORDER BY id ASC
    `);
    return rows;
  } catch (error) {
    console.error("adminGetUsers error:", error);
    return [];
  }
}

// Tizimdagi barcha xabarlar ro'yxati
export async function adminGetMessages() {
  try {
    const { rows } = await pool.query(`
      SELECT m.*, 
             u_sender.name as sender_user_name,
             u_receiver.name as receiver_user_name,
             l.type as listing_title
      FROM messages m
      LEFT JOIN users u_sender ON m.sender_id = u_sender.id
      LEFT JOIN users u_receiver ON m.receiver_id = u_receiver.id
      LEFT JOIN listings l ON m.listing_id = l.id
      ORDER BY m.id DESC
    `);
    return rows;
  } catch (error) {
    console.error("adminGetMessages error:", error);
    return [];
  }
}
