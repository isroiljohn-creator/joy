import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";
import { getCurrentUser } from "@/app/actions";
import { adminGetStats, adminGetListings, adminGetUsers, adminGetMessages } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // 1. Ruxsatni tekshirish (faqat admin kiritiladi)
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/profile");
  }

  // 2. Admin ma'lumotlarini yuklash
  const stats = await adminGetStats();
  const listings = await adminGetListings();
  const users = await adminGetUsers();
  const messages = await adminGetMessages();

  return (
    <AdminClient 
      user={user}
      stats={stats}
      listings={listings}
      users={users}
      messages={messages}
    />
  );
}
