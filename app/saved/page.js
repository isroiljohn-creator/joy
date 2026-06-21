import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav, ListingCard } from "@/components/ui";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";
import { getCurrentUser } from "@/app/actions";
import { attachPriceAnalysis } from "@/lib/data";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

function mapListingFromDb(row) {
  return {
    id: row.id,
    price: row.price,
    priceNum: row.price_num,
    type: row.type,
    cat: row.cat,
    addr: row.addr,
    rooms: row.rooms,
    baths: row.baths,
    area: row.area,
    floor: row.floor,
    top: row.top,
    photo: row.photo,
    owner: row.owner_name || "",
    ownerId: row.owner_id,
    views: row.views || 0,
    saves: row.saves || 0,
    status: row.status,
    pinX: row.pin_x,
    pinY: row.pin_y,
    createdAt: row.created_at,
    hasMortgage: row.has_mortgage ?? false
  };
}

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let savedListings = [];
  let recommendations = [];
  try {
    const { rows } = await pool.query(
      `SELECT l.*, u.name as owner_name FROM listings l 
       LEFT JOIN users u ON l.owner_id = u.id
       JOIN favorites f ON l.id = f.listing_id 
       WHERE f.user_id = $1 AND l.deleted_at IS NULL
       ORDER BY l.id DESC`,
      [user.id]
    );
    savedListings = await attachPriceAnalysis(rows.map(mapListingFromDb));

    if (savedListings.length === 0) {
      const { rows: recRows } = await pool.query(
        `SELECT l.*, u.name as owner_name FROM listings l
         LEFT JOIN users u ON l.owner_id = u.id
         WHERE l.status = 'active' AND l.deleted_at IS NULL
         ORDER BY l.top DESC, l.id DESC
         LIMIT 6`
      );
      recommendations = await attachPriceAnalysis(recRows.map(mapListingFromDb));
    }
  } catch (error) {
    console.error("Error fetching saved listings:", error);
  }

  return (
    <>
      {/* Desktop view */}
      <div className="desktop-only">
        <Nav />
        <div className="wrap" style={{ paddingTop: 40, paddingBottom: 64, minHeight: "70vh" }}>
          <h1 className="display" style={{ marginBottom: 24 }}>Saqlangan e&apos;lonlar</h1>
          
          {savedListings.length === 0 ? (
            <div>
              <div style={{ textAlign: "center", padding: "80px 24px", background: "var(--card-bg)", borderRadius: 24, border: ".5px solid var(--sand)" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--orange-tint)", color: "var(--orange)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <i className="ti ti-heart-broken" style={{ fontSize: 28 }}></i>
                </div>
                <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Saqlanganlar bo&apos;sh</h3>
                <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 20px" }}>Siz hali birorta ham e&apos;lonni saqlamadingiz.</p>
                <Link href="/listings" className="btn-add" style={{ display: "inline-flex", width: "auto", textDecoration: "none" }}>
                  E&apos;lonlarni ko&apos;rish
                </Link>
              </div>

              {recommendations.length > 0 && (
                <div style={{ marginTop: 48 }}>
                  <h2 className="display" style={{ fontSize: 22, marginBottom: 20 }}>Tavsiya etilgan uylar</h2>
                  <div className="grid">
                    {recommendations.map((l) => (
                      <ListingCard l={l} key={l.id} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid">
              {savedListings.map((l) => (
                <ListingCard l={l} key={l.id} isFavorite={true} />
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>

      {/* Mobile view */}
      <div className="mobile-only" style={{ background: "var(--cream, #FBF7F3)", minHeight: "100vh", paddingBottom: 120 }}>
        <div style={{ padding: "20px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 22, fontWeight: 700, margin: 0 }}>Saqlanganlar</h1>
        </div>

        {savedListings.length === 0 ? (
          <div>
            <div style={{ margin: "24px 16px", padding: "48px 16px", background: "var(--card-bg)", borderRadius: 24, textAlign: "center", border: ".5px solid var(--sand)" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--orange-tint)", color: "var(--orange)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <i className="ti ti-heart-broken" style={{ fontSize: 24 }}></i>
              </div>
              <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>Saqlanganlar bo&apos;sh</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 20px" }}>Siz saqlagan e&apos;lonlar hozircha yo&apos;q.</p>
              <Link href="/listings" style={{ background: "var(--orange)", color: "#fff", border: "none", borderRadius: 14, padding: "10px 20px", fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
                Izlash
              </Link>
            </div>

            {recommendations.length > 0 && (
              <div style={{ padding: "0 16px", marginTop: 24 }}>
                <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Tavsiya etilgan uylar</h2>
                <div className="grid">
                  {recommendations.map((l) => (
                    <ListingCard l={l} key={l.id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: "0 16px" }}>
            <div className="grid">
              {savedListings.map((l) => (
                <ListingCard l={l} key={l.id} isFavorite={true} />
              ))}
            </div>
          </div>
        )}
        <MobileNav />
      </div>
    </>
  );
}
