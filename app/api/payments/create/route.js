import pool from "@/lib/db";
import { getCurrentUser } from "@/app/actions";
import { NextResponse } from "next/server";

function getCorrectAmount(type) {
  if (type === "subscription") return 50000;
  if (type === "pin_listing") return 15000;
  return null;
}

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const reference_id = searchParams.get("listingId") || searchParams.get("reference_id");

    const correctAmount = getCorrectAmount(type);
    if (!correctAmount) {
      return NextResponse.json({ error: "Yaroqsiz to'lov turi" }, { status: 400 });
    }

    // Insert transaction
    const { rows } = await pool.query(
      `INSERT INTO transactions (user_id, amount, status, payment_type, reference_id)
       VALUES ($1, $2, 'pending', $3, $4) RETURNING id`,
      [user.id, correctAmount, type, reference_id ? parseInt(reference_id) : null]
    );

    const txId = rows[0].id;
    const paymentUrl = `/payment-mock?tx_id=${txId}&amount=${correctAmount}&type=${type}`;
    return NextResponse.redirect(new URL(paymentUrl, req.url));
  } catch (error) {
    console.error("Payment create GET error:", error);
    return NextResponse.json({ error: "Ichki xatolik yuz berdi" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, reference_id } = await req.json();

    const correctAmount = getCorrectAmount(type);
    if (!correctAmount) {
      return NextResponse.json({ error: "Yaroqsiz to'lov turi" }, { status: 400 });
    }

    // Insert transaction
    const { rows } = await pool.query(
      `INSERT INTO transactions (user_id, amount, status, payment_type, reference_id)
       VALUES ($1, $2, 'pending', $3, $4) RETURNING id`,
      [user.id, correctAmount, type, reference_id ? parseInt(reference_id) : null]
    );

    const txId = rows[0].id;
    const paymentUrl = `/payment-mock?tx_id=${txId}&amount=${correctAmount}&type=${type}`;

    return NextResponse.json({ success: true, paymentUrl });
  } catch (error) {
    console.error("Payment create POST error:", error);
    return NextResponse.json({ error: "Ichki xatolik yuz berdi" }, { status: 500 });
  }
}
