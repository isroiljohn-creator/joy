import ProfileClient from "./ProfileClient";
import { getProfileListings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  // Profil egasining barcha e'lonlarini bazadan dynamic o'qiymiz
  const listings = await getProfileListings("Aziz Karimov");

  return <ProfileClient initialListings={listings} />;
}
