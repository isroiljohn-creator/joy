import ListingsClient from "./ListingsClient";
import { getListings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ListingsPage({ searchParams }) {
  // Parametrlarga ko'ra bazadan faol e'lonlarni yuklaymiz
  const listings = await getListings({
    cat: searchParams?.cat,
    q: searchParams?.q,
  });

  return <ListingsClient initialListings={listings} />;
}
