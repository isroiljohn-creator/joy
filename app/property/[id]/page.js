import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/ui";
import Gallery from "@/components/Gallery";
import MessageModal from "@/components/MessageModal";
import { getListingById, getListings } from "@/lib/data";
import { getCurrentUser, toggleFavoriteAction } from "@/app/actions";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const listings = await getListings();
  return listings.map((l) => ({ id: String(l.id) }));
}

export default async function Property({ params }) {
  const l = await getListingById(params.id);
  
  if (!l) {
    notFound();
  }

  // 1. Foydalanuvchi va favorit holatini tekshirish
  const user = await getCurrentUser();
  let isFavorite = false;

  if (user) {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM favorites WHERE user_id = $1 AND listing_id = $2",
        [user.id, l.id]
      );
      isFavorite = rows.length > 0;
    } catch (err) {
      console.error(err);
    }
  }

  const initials = l.owner
    ? l.owner.split(" ").map((w) => w[0]).join("").slice(0, 2)
    : "AK";
    
  const monthly = Math.round((l.priceNum * 0.8 * 0.01) + (l.priceNum * 0.8 / 300));

  const handleToggleFavorite = async () => {
    "use server";
    const user = await getCurrentUser();
    if (!user) {
      redirect("/login");
    }
    await toggleFavoriteAction(l.id);
  };

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="crumb">
          <Link href="/">Bosh sahifa</Link>
          <i className="ti ti-chevron-right" style={{ fontSize: 14 }}></i>
          <Link href="/listings">{l.cat}</Link>
          <i className="ti ti-chevron-right" style={{ fontSize: 14 }}></i>
          <span>{l.addr.split(" ")[0]}</span>
        </div>

        <Gallery mainPhoto={l.photo} top={l.top} />

        <div className="dbody">
          <div>
            <div className="title-row">
              <div>
                <h1 className="display">{l.type}</h1>
                <div className="addr" style={{ fontSize: 15, marginTop: 8 }}>
                  <i className="ti ti-map-pin"></i> {l.addr}, Toshkent
                </div>
              </div>
              <div className="iconbtns">
                <form action={handleToggleFavorite}>
                  <button 
                    type="submit" 
                    className="ibtn" 
                    style={{ cursor: "pointer", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <i 
                      className="ti ti-heart" 
                      style={{ 
                        color: isFavorite ? "var(--orange)" : "inherit",
                        fontWeight: isFavorite ? "bold" : "normal"
                      }}
                    ></i>
                  </button>
                </form>
                <div className="ibtn">
                  <i className="ti ti-share"></i>
                </div>
              </div>
            </div>

            <div className="keyspecs">
              <div className="ks">
                <i className="ti ti-bed"></i>
                <div className="v">{l.rooms}</div>
                <div className="l">Xona</div>
              </div>
              <div className="ks">
                <i className="ti ti-bath"></i>
                <div className="v">{l.baths}</div>
                <div className="l">Hammom</div>
              </div>
              <div className="ks">
                <i className="ti ti-ruler-2"></i>
                <div className="v">{l.area} m²</div>
                <div className="l">Maydon</div>
              </div>
              <div className="ks">
                <i className="ti ti-stairs"></i>
                <div className="v">{l.floor}</div>
                <div className="l">Qavat</div>
              </div>
            </div>

            <div className="block">
              <h2 className="display">Tavsif</h2>
              <p>
                {l.addr} hududida, metro va savdo markazlariga yaqin joylashgan yorug' va shinam {l.type.toLowerCase()}. To'liq ta'mirlangan, mebellangan. Tinch hudud, maktab va bog'cha yonida.
              </p>
            </div>

            <div className="block">
              <h2 className="display">Xususiyatlar</h2>
              <div className="dfeats">
                {[
                  "Yevro ta'mir",
                  "Mebel bilan",
                  "Konditsioner",
                  "Lift",
                  "Avtoturargoh",
                  "Internet / Wi-Fi",
                ].map((f) => (
                  <div className="ft" key={f}>
                    <i className="ti ti-check"></i> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="side">
            <div className="dprice">{l.price}</div>
            <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>
              ≈ {l.area} m² · ${Math.round(l.priceNum / l.area)} / m²
            </div>
            <div className="owner">
              <div className="oav">{initials}</div>
              <div style={{ flex: 1 }}>
                <div className="oname">
                  {l.owner} <i className="ti ti-rosette-discount-check"></i>
                </div>
                <div className="orole">Egasi · 14 ta e'lon</div>
              </div>
            </div>
            <button className="cbtn primary">
              <i className="ti ti-phone"></i> Qo'ng'iroq qilish
            </button>
            
            <MessageModal listingId={l.id} receiverOwner={l.owner} />
            
            <div className="mort">
              <div
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i className="ti ti-calculator" style={{ fontSize: 16 }}></i>{" "}
                Ipoteka hisobi
              </div>
              <div className="mv">
                ≈ ${monthly.toLocaleString()}{" "}
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    color: "var(--muted)",
                  }}
                >
                  /oy
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                20% boshlang'ich · 25 yil · 12%
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
