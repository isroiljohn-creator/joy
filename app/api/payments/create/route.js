import pool from "@/lib/db";
import { getCurrentUser } from "@/app/actions";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, amount, reference_id } = await req.json();

    if (!type || !amount) {
      return NextResponse.json({ error: "Missing type or amount" }, { status: 400 });
    }

    // Tranzaksiyani yaratamiz
    const { rows } = await pool.query(
      `INSERT INTO transactions (user_id, amount, status, payment_type, reference_id)
       VALUES ($1, $2, 'pending', $3, $4) RETURNING id`,
      [user.id, amount, type, reference_id || null]
    );

    const txId = rows[0].id;

    // To'lov sahifasiga yo'naltirish URLini qaytaramiz (Mock tizimi uchun o'zimizning /payment-mock sahifasiga yo'naltiramiz)
    const paymentUrl = `/payment-mock?tx_id=${txId}&amount=${amount}&type=${type}`;

    return NextResponse.json({ success: true, paymentUrl });
  } catch (error) {
    console.error("Payment create error:", error);
    return NextResponse.json({ error: "Ichki xatolik yuz berdi" }, { status: 500 });
  }
}
