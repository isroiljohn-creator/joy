import PaymentMockClient from "./PaymentMockClient";
import { getCurrentUser } from "@/app/actions";
import { redirect } from "next/navigation";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PaymentMockPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const txId = parseInt(searchParams?.tx_id);
  const amount = searchParams?.amount;
  const type = searchParams?.type; // 'subscription' or 'pin_listing'

  if (!txId || !amount || !type) {
    redirect("/profile");
  }

  // Tranzaksiya foydalanuvchiga tegishliligini tekshiramiz
  try {
    const { rows } = await pool.query(
      "SELECT id FROM transactions WHERE id = $1 AND user_id = $2 AND status = 'pending'",
      [txId, user.id]
    );
    if (rows.length === 0) {
      redirect("/profile?error=invalid_transaction");
    }
  } catch (e) {
    redirect("/profile?error=db_error");
  }

  return <PaymentMockClient user={user} txId={txId} amount={amount} type={type} />;
}
