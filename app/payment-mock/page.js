import PaymentMockClient from "./PaymentMockClient";
import { getCurrentUser } from "@/app/actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PaymentMockPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const txId = searchParams?.tx_id;
  const amount = searchParams?.amount;
  const type = searchParams?.type; // 'subscription' or 'pin_listing'

  if (!txId || !amount || !type) {
    redirect("/profile");
  }

  return <PaymentMockClient user={user} txId={txId} amount={amount} type={type} />;
}
