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

export const dynamic = "force-dynamic";

export default async function ErpPage() {
  // 1. Ruxsatni tekshirish
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const allowedRoles = ["owner", "rop", "seller"];
  if (!allowedRoles.includes(user.role)) {
    redirect("/profile");
  }

  // 2. Ma'lumotlarni parallel ravishda yuklash
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
  );
}
