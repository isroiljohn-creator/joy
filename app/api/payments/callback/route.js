import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req) {
  try {
    const secretToken = req.headers.get("x-webhook-secret") || new URL(req.url).searchParams.get("secret");
    const expectedSecret = process.env.PAYMENT_WEBHOOK_SECRET || "default_webhook_secret_key_9988";
    
    if (!secretToken || secretToken !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized webhook caller" }, { status: 401 });
    }

    const { tx_id, status, amount } = await req.json();

    if (!tx_id || status !== "success") {
      return NextResponse.json({ error: "Invalid payment callback" }, { status: 400 });
    }

    // 1. Tranzaksiyani tekshiramiz
    const { rows: txRows } = await pool.query("SELECT * FROM transactions WHERE id = $1 AND status = 'pending'", [tx_id]);
    if (txRows.length === 0) {
      return NextResponse.json({ error: "Transaction not found or already processed" }, { status: 404 });
    }

    const tx = txRows[0];

    // Verify amount matches expected value
    if (amount === undefined || amount === null || parseInt(amount) !== tx.amount) {
      return NextResponse.json({ error: "Transaction amount mismatch" }, { status: 400 });
    }

    // Tranzaksiyani boshlash
    await pool.query("BEGIN");

    // 2. Tranzaksiyani 'completed' qilib belgilash
    await pool.query("UPDATE transactions SET status = 'completed' WHERE id = $1", [tx_id]);

    // 3. Biznes mantiqni ishga tushirish (Obuna yoki Pin)
    if (tx.payment_type === "subscription") {
      // 1 oylik Premium obuna
      await pool.query(
        "UPDATE users SET is_verified = TRUE, subscription_plan = 'premium', subscription_expires_at = NOW() + INTERVAL '30 days' WHERE id = $1",
        [tx.user_id]
      );
    } else if (tx.payment_type === "pin_listing" && tx.reference_id) {
      // E'lonni 7 kunga Top qilish
      await pool.query(
        "UPDATE listings SET top = TRUE, top_expires_at = NOW() + INTERVAL '7 days' WHERE id = $1",
        [tx.reference_id]
      );
    }

    await pool.query("COMMIT");

    // Keshlarni yangilash
    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath("/listings");

    return NextResponse.json({ success: true });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Payment callback error:", error);
    return NextResponse.json({ error: "Ichki xatolik yuz berdi" }, { status: 500 });
  }
}
