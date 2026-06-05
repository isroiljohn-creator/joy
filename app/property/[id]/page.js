import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Nav, ListingCard } from "@/components/ui";
import Gallery from "@/components/Gallery";
import MessageModal from "@/components/MessageModal";
import ShareBtn from "@/components/ShareBtn";
import CallBtn from "@/components/CallBtn";
import { getListingById, getListings, getSimilarListings, getOwnerListingCount } from "@/lib/data";
import { getCurrentUser, toggleFavoriteAction } from "@/app/actions";
import pool from "@/lib/db";
import PropertyExtras from "./PropertyExtras";
import MobileActions from "@/components/MobileActions";

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

  // Dynamic owner listing count
  const ownerCount = await getOwnerListingCount(l.owner);

  // O'xshash e'lonlar
  const similarListings = await getSimilarListings(l.id, l.cat);

  // E'lon egasining telefon raqamini aniqlash (bazadagi phone yoki fallback)
  const ownerPhone = l.phone || "+998 90 123 45 67";

  // Tavsif (bazadagi yoki avtomatik)
  const description = l.description || `${l.addr} hududida, metro va savdo markazlariga yaqin joylashgan yorug' va shinam ${l.type.toLowerCase()}. To'liq ta'mirlangan, mebellangan. Tinch hudud, maktab va bog'cha yonida.`;

  // Dinamik xususiyatlar
  const features = [
    "Internet / Wi-Fi",
    "Lift",
  ];
  if (l.rooms >= 3) features.unshift("Keng xonalar");
  if (l.area >= 80) features.unshift("Katta maydon");
  features.push("Konditsioner");
  if (l.floor && parseInt(l.floor) <= 3) features.push("Past qavat");
  features.push("Avtoturargoh");
  features.push("Yevro ta'mir");

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
      {/* Desktop view */}
      <div className="desktop-only">
        <Nav />
        <div className="wrap">
          <div className="crumb">
            <Link href="/">Bosh sahifa</Link>
            <i className="ti ti-chevron-right" style={{ fontSize: 14 }}></i>
            <Link href={`/listings?cat=${encodeURIComponent(l.cat)}`}>{l.cat}</Link>
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
                <div className="iconbtns" style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
                  <ShareBtn />
                </div>
              </div>

              <div className="keyspecs">
                <div className="ks">
                  <div className="ks-icon"><i className="ti ti-bed"></i></div>
                  <div className="ks-text">
                    <div className="v">{l.rooms}</div>
                    <div className="l">Xona</div>
                  </div>
                </div>
                <div className="ks">
                  <div className="ks-icon"><i className="ti ti-bath"></i></div>
                  <div className="ks-text">
                    <div className="v">{l.baths}</div>
                    <div className="l">Hammom</div>
                  </div>
                </div>
                <div className="ks">
                  <div className="ks-icon"><i className="ti ti-ruler-2"></i></div>
                  <div className="ks-text">
                    <div className="v">{l.area} m²</div>
                    <div className="l">Maydon</div>
                  </div>
                </div>
                <div className="ks">
                  <div className="ks-icon"><i className="ti ti-stairs"></i></div>
                  <div className="ks-text">
                    <div className="v">{l.floor}</div>
                    <div className="l">Qavat</div>
                  </div>
                </div>
              </div>

              {/* Narx indikatori — bozor narxiga nisbatan */}
              {(() => {
                const pricePerM2 = l.area > 0 ? Math.round(l.priceNum / l.area) : 0;
                // Toshkent o'rtacha bozor narxlari (USD/m²)
                const avgMarket = { "Yangi uylar": 850, "Ikkilamchi": 720, "Ijara": 12, "Ofis": 650 };
                const avg = avgMarket[l.cat] || 750;
                const ratio = pricePerM2 / avg;
                let label, color, bg, icon;
                if (ratio < 0.85) {
                  label = "Bozordan arzon"; color = "#2d9d5c"; bg = "#e8f8ef"; icon = "ti-trending-down";
                } else if (ratio <= 1.15) {
                  label = "Bozor narxida"; color = "#b8860b"; bg = "#fef9ea"; icon = "ti-minus";
                } else {
                  label = "Bozordan qimmat"; color = "#c0392b"; bg = "#fdeaea"; icon = "ti-trending-up";
                }
                return (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: bg, border: `1px solid ${color}22`,
                    borderRadius: 14, padding: "14px 20px", marginBottom: 8,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${color}18`, display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0,
                    }}>
                      <i className={`ti ${icon}`} style={{ fontSize: 22, color }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color }}>{label}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                        ${pricePerM2.toLocaleString()}/m² · O&apos;rtacha: ${avg.toLocaleString()}/m²
                      </div>
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color,
                      background: `${color}14`, padding: "4px 10px", borderRadius: 8,
                    }}>
                      {ratio < 1 ? `${Math.round((1 - ratio) * 100)}% arzon` : ratio > 1 ? `${Math.round((ratio - 1) * 100)}% qimmat` : "="}
                    </div>
                  </div>
                );
              })()}

              <div className="block">
                <h2 className="display">Tavsif</h2>
                <p>{description}</p>
              </div>

              <div className="block">
                <h2 className="display">Xususiyatlar</h2>
                <div className="dfeats">
                  {features.map((f) => (
                    <div className="ft" key={f}>
                      <i className="ti ti-check"></i> {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* O'xshash e'lonlar */}
              {similarListings.length > 0 && (
                <div className="block" style={{ marginTop: 32 }}>
                  <h2 className="display">O&apos;xshash e&apos;lonlar</h2>
                  <div className="grid" style={{ marginTop: 16 }}>
                    {similarListings.map((sl) => (
                      <ListingCard l={sl} key={sl.id} />
                    ))}
                  </div>
                </div>
              )}
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
                  <div className="orole">Egasi · {ownerCount} ta e&apos;lon</div>
                </div>
              </div>
              
              <CallBtn phone={ownerPhone} />
              
              <MessageModal listingId={l.id} receiverOwner={l.owner} />
              
              <PropertyExtras priceNum={l.priceNum} listingId={l.id} />
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile view */}
      <div className="mobile-only" style={{ background: "var(--cream, #FBF7F3)", minHeight: "100vh", paddingBottom: 100 }}>
        <div className="mdphoto" style={{ backgroundImage: `url('${l.photo}')` }}>
          <div className="mdnav">
            <Link href="/listings" className="mdbtn" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-arrow-left"></i>
            </Link>
            <div style={{ display: "flex", gap: 8 }}>
              <form action={handleToggleFavorite}>
                <button 
                  type="submit" 
                  className="mdbtn" 
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
              <ShareBtn btnClass="mdbtn" />
            </div>
          </div>
          <div className="dots">
            <span className="d on"></span>
            <span className="d"></span>
            <span className="d"></span>
            <span className="d"></span>
          </div>
        </div>
        <div className="mdwrap">
          <div className="mdtype">{l.type}</div>
          <div className="mdaddr">
            <i className="ti ti-map-pin" style={{ fontSize: 14 }}></i> {l.addr}, Toshkent
          </div>
          <div className="mdprice">{l.price}</div>
          <div className="mdpriceArea">
            ≈ ${l.area > 0 ? Math.round(l.priceNum / l.area).toLocaleString() : 0} / m² · {l.area} m²
          </div>
          
          <div className="mdspecs">
            <div className="mdspec">
              <i className="ti ti-bed"></i>
              <div className="msv">{l.rooms}</div>
              <div className="msl">Xona</div>
            </div>
            <div className="mdspec">
              <i className="ti ti-bath"></i>
              <div className="msv">{l.baths}</div>
              <div className="msl">Hammom</div>
            </div>
            <div className="mdspec">
              <i className="ti ti-ruler-2"></i>
              <div className="msv">{l.area}m²</div>
              <div className="msl">Maydon</div>
            </div>
            <div className="mdspec">
              <i className="ti ti-stairs"></i>
              <div className="msv">{l.floor}</div>
              <div className="msl">Qavat</div>
            </div>
          </div>

          <div className="mdowner">
            <div className="mdoav">{initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 5 }}>
                {l.owner} <i className="ti ti-rosette-discount-check" style={{ color: "var(--orange)", fontSize: 14 }}></i>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Egasi · {ownerCount} ta e&apos;lon</div>
            </div>
            <a href={`tel:${ownerPhone.replace(/\s/g, "")}`} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--orange-tint)", color: "var(--orange)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-phone" style={{ fontSize: 17 }}></i>
            </a>
          </div>

          <div className="mdblock">
            <h3>Tavsif</h3>
            <p>{description}</p>
          </div>

          <div className="mdblock">
            <h3>Xususiyatlar</h3>
            <div className="mdfeats">
              {features.map((f) => (
                <div className="mdft" key={f}>
                  <i className="ti ti-check"></i> {f}
                </div>
              ))}
            </div>
          </div>

          {/* Mortgage Calculator / Ipoteka */}
          <div className="mdblock">
            <h3>Ipoteka</h3>
            <PropertyExtras priceNum={l.priceNum} listingId={l.id} />
          </div>
        </div>

        {/* Sticky Mobile Actions Bar */}
        <MobileActions listingId={l.id} receiverOwner={l.owner} ownerPhone={ownerPhone} />
      </div>
    </>
  );
}
