import { Suspense } from "react";
import ListingsClient from "./ListingsClient";
import { getListings } from "@/lib/data";
import { getCurrentUser } from "@/app/actions";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ListingsPage({ searchParams }) {
  // 1. Bazadan active e'lonlarni filtrlar bo'yicha yuklaymiz
  const listings = await getListings({
    cat: searchParams?.cat,
    q: searchParams?.q,
  });

  // 2. Foydalanuvchi tizimga kirgan bo'lsa, uning saqlagan e'lonlari ID'larini olamiz
  const user = await getCurrentUser();
  let favoriteIds = [];

  if (user) {
    try {
      const { rows } = await pool.query(
        "SELECT listing_id FROM favorites WHERE user_id = $1",
        [user.id]
      );
      favoriteIds = rows.map((r) => r.listing_id);
    } catch (error) {
      console.error("Error fetching favorites in listings page:", error);
    }
  }

  return (
    <Suspense fallback={<div>Yuklanmoqda...</div>}>
      <ListingsClient initialListings={listings} favoriteIds={favoriteIds} />
    </Suspense>
  );
}

