import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import {
  erpGetOverviewStats,
  erpGetProjects,
  erpGetLeads,
  erpGetMeetings,
  erpGetSales,
  erpGetSellers,
  erpGetAllStaff
} from "@/app/erp-actions";
import ErpClient from "./ErpClient";
import ErpOnboarding from "./ErpOnboarding";

export const dynamic = "force-dynamic";

export default async function ErpPage() {
  // 1. Tizimga kirganligini tekshirish
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // 2. Agar ERP roli bo'lmasa — onboarding sahifasini ko'rsat
  const allowedRoles = ["owner", "rop", "seller"];
  if (!allowedRoles.includes(user.role)) {
    return <ErpOnboarding user={user} />;
  }

  // 3. ERP ma'lumotlarini parallel ravishda yuklash
  const statsResponse = await erpGetOverviewStats();
  if (statsResponse.error) {
    console.error("ERP stats error:", statsResponse.error);
  }

  const stats = statsResponse.stats || {};
  const sellersPerformance = statsResponse.sellersPerformance || [];
  
  const projects = await erpGetProjects();
  const leads = await erpGetLeads();
  const meetings = await erpGetMeetings();
  const sales = await erpGetSales();
  const sellers = await erpGetSellers();
  
  let allStaff = [];
  if (user.role === "owner") {
    allStaff = await erpGetAllStaff();
  }

  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>Yuklanmoqda...</div>}>
      <ErpClient
        user={user}
        stats={stats}
        sellersPerformance={sellersPerformance}
        initialProjects={projects}
        initialLeads={leads}
        initialMeetings={meetings}
        initialSales={sales}
        sellers={sellers}
        allStaff={allStaff}
      />
    </Suspense>
  );
}
