import { redirect } from "next/navigation";
import ChatClient from "./ChatClient";
import { getCurrentUser } from "@/app/actions";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let messages = [];
  try {
    const { rows } = await pool.query(
      `SELECT m.*, l.type as listing_type, 
              r.name AS receiver_name, r.phone AS receiver_phone
       FROM messages m
       LEFT JOIN listings l ON m.listing_id = l.id
       LEFT JOIN users r ON m.receiver_id = r.id
       WHERE m.receiver_id = $1 OR m.sender_id = $1
       ORDER BY m.id ASC`,
      [user.id]
    );
    messages = rows.map(r => ({
      id: r.id,
      senderId: r.sender_id,
      senderName: r.sender_name,
      senderPhone: r.sender_phone,
      receiverId: r.receiver_id,
      receiverName: r.receiver_name,
      receiverPhone: r.receiver_phone,
      content: r.content,
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
      listingId: r.listing_id,
      listingType: r.listing_type || "O'chirilgan e'lon",
      isRead: r.is_read || false
    }));
  } catch (error) {
    console.error("Error fetching chat messages:", error);
  }

  return (
    <ChatClient user={user} initialMessages={messages} />
  );
}
