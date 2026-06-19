import PremiumClient from "./PremiumClient";
import { getCurrentUser } from "@/app/actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PremiumPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <PremiumClient user={user} />;
}
