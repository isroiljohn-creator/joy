import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("user_id")?.value;
    
    if (!userId) {
      return NextResponse.json({ count: 0 });
    }

    const { rows } = await pool.query(
      "SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = FALSE",
      [parseInt(userId)]
    );

    return NextResponse.json({ count: parseInt(rows[0].count, 10) });
  } catch (error) {
    console.error("unread-count API error:", error);
    return NextResponse.json({ count: 0 });
  }
}
