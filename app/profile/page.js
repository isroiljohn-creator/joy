import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { getCurrentUser } from "@/app/actions";
import { getProfileListings } from "@/lib/data";
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
    owner: row.owner,
    views: row.views || 0,
    saves: row.saves || 0,
    status: row.status,
    pinX: row.pin_x,
    pinY: row.pin_y,
    createdAt: row.created_at
  };
}

export default async function ProfilePage() {
  // 1. Tizimga kirgan foydalanuvchini tekshiramiz
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Foydalanuvchining o'z e'lonlarini yuklaymiz
  const myListings = await getProfileListings(user.name);

  // 3. Foydalanuvchining saqlagan (favorites) e'lonlarini yuklaymiz
  let savedListings = [];
  try {
    const { rows } = await pool.query(
      `SELECT l.* FROM listings l 
       JOIN favorites f ON l.id = f.listing_id 
       WHERE f.user_id = $1 
       ORDER BY l.id DESC`,
      [user.id]
    );
    savedListings = rows.map(mapListingFromDb);
  } catch (error) {
    console.error("Error fetching saved listings:", error);
  }

  // 4. Foydalanuvchining e'lonlari bo'yicha kelgan xabarlarni yuklaymiz
  let messages = [];
  try {
    const { rows } = await pool.query(
      `SELECT m.*, l.type as listing_type FROM messages m
       LEFT JOIN listings l ON m.listing_id = l.id
       WHERE m.receiver_owner = $1
       ORDER BY m.id DESC`,
      [user.name]
    );
    messages = rows.map(r => ({
      id: r.id,
      senderName: r.sender_name,
      senderPhone: r.sender_phone,
      content: r.content,
      createdAt: r.created_at,
      listingType: r.listing_type || "O'chirilgan e'lon"
    }));
  } catch (error) {
    console.error("Error fetching messages:", error);
  }

  return (
    <ProfileClient 
      user={user} 
      myListings={myListings} 
      savedListings={savedListings} 
      messages={messages} 
    />
  );
}
