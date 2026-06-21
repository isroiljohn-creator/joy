import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { verifySignedValue } from "@/lib/hash";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const signedId = cookieStore.get("user_id")?.value;
    const userId = signedId ? verifySignedValue(signedId) : null;
    if (!userId) {
      return NextResponse.json({ messages: [] }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 100;
    const offset = (page - 1) * limit;

    let query = `
      SELECT m.*, l.type as listing_type, 
             r.name AS receiver_name, r.phone AS receiver_phone
      FROM messages m
      LEFT JOIN listings l ON m.listing_id = l.id
      LEFT JOIN users r ON m.receiver_id = r.id
      WHERE (m.receiver_id = $1 OR m.sender_id = $1)
    `;
    const params = [parseInt(userId)];

    if (since) {
      const parsedSince = new Date(since);
      if (!isNaN(parsedSince.getTime())) {
        query += " AND m.created_at > $" + (params.length + 1);
        params.push(parsedSince);
      }
    }

    query += ` ORDER BY m.id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

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
