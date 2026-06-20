import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("user_id")?.value;
    if (!userId) {
      return NextResponse.json({ messages: [] }, { status: 401 });
    }

    const { rows } = await pool.query(
      `SELECT m.*, l.type as listing_type, 
              r.name AS receiver_name, r.phone AS receiver_phone
       FROM messages m
       LEFT JOIN listings l ON m.listing_id = l.id
       LEFT JOIN users r ON m.receiver_id = r.id
       WHERE m.receiver_id = $1 OR m.sender_id = $1
       ORDER BY m.id ASC`,
      [parseInt(userId)]
    );

    const messages = rows.map(r => ({
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

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json({ messages: [] }, { status: 500 });
  }
}
