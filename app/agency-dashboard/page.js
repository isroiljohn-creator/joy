import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/app/actions";
import AgencyDashboardClient from "./AgencyDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agentlik Dashboard — maskon.uz",
  description: "Agentlik boshqaruv paneli",
};

export default async function AgencyDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let myAgency = null;
  let members = [];
  let leads = [];
  let agencyListings = [];

  try {
    // Foydalanuvchi o'z agentligiga ega ekanligini tekshiramiz
    const { rows: agencyRows } = await pool.query(
      "SELECT * FROM agencies WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 1",
      [user.id]
    );

    if (agencyRows.length > 0) {
      myAgency = agencyRows[0];

      // Xodimlar
      const { rows: memberRows } = await pool.query(`
        SELECT u.id, u.name, u.phone, am.role, am.joined_at, am.id as member_id
        FROM agency_members am
        JOIN users u ON am.user_id = u.id
        WHERE am.agency_id = $1
        ORDER BY am.role DESC, am.joined_at ASC
      `, [myAgency.id]);
      members = memberRows;

      // Agentlik e'lonlari
      const { rows: listingRows } = await pool.query(`
        SELECT l.id, l.type, l.price, l.addr, l.status, l.views, l.saves, l.created_at
        FROM listings l
        WHERE l.agency_id = $1 AND l.deleted_at IS NULL
        ORDER BY l.id DESC
        LIMIT 50
      `, [myAgency.id]);
      agencyListings = listingRows;

      // Lidlar (kelgan xabarlar)
      const { rows: leadRows } = await pool.query(`
        SELECT m.*, l.type as listing_type, l.addr as listing_addr,
               u.name as assigned_to_name
         FROM messages m
         LEFT JOIN listings l ON m.listing_id = l.id AND l.deleted_at IS NULL
         LEFT JOIN users u ON m.assigned_to = u.id
        WHERE m.agency_id = $1
        ORDER BY m.created_at DESC
        LIMIT 50
      `, [myAgency.id]);
      leads = leadRows.map(r => ({
        ...r,
        createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString()
      }));
    }
  } catch (err) {
    console.error("AgencyDashboardPage error:", err);
  }

  return (
    <AgencyDashboardClient
      user={user}
      myAgency={myAgency}
      members={members}
      leads={leads}
      agencyListings={agencyListings}
    />
  );
}
