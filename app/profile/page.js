import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { getCurrentUser } from "@/app/actions";
import { getProfileListings, attachPriceAnalysis } from "@/lib/data";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

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
    createdAt: row.created_at,
    hasMortgage: row.has_mortgage ?? false
  };
}

export default async function ProfilePage({ searchParams }) {
  // 1. Tizimga kirgan foydalanuvchini tekshiramiz
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const tabParam = searchParams?.tab;
  const initialTab = tabParam === "saved" ? "Saqlangan" : tabParam === "messages" ? "Xabarlar" : "Mening e'lonlarim";

  // 2. Foydalanuvchining o'z e'lonlarini yuklaymiz (ID bo'yicha)
  const myListings = await getProfileListings(user.id);

  // 3. Foydalanuvchining saqlagan (favorites) e'lonlarini yuklaymiz
  let savedListings = [];
  try {
    const { rows } = await pool.query(
      `SELECT l.*, u.name as owner_name FROM listings l 
       LEFT JOIN users u ON l.owner_id = u.id
       JOIN favorites f ON l.id = f.listing_id 
       WHERE f.user_id = $1 AND l.deleted_at IS NULL
       ORDER BY l.id DESC`,
      [user.id]
    );
    savedListings = await attachPriceAnalysis(rows.map(mapListingFromDb));
  } catch (error) {
    console.error("Error fetching saved listings:", error);
  }

  // 4. Kelgan xabarlar sonini hisoblaymiz (profile stats uchun)
  let messagesCount = 0;
  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*) FROM messages WHERE receiver_id = $1",
      [user.id]
    );
    messagesCount = parseInt(rows[0].count, 10) || 0;
  } catch (error) {
    console.error("Error counting messages:", error);
  }

  return (
    <ProfileClient 
      user={user} 
      myListings={myListings} 
      savedListings={savedListings} 
      messagesCount={messagesCount} 
      initialTab={initialTab}
    />
  );
}
