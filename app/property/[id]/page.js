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
import ReviewsSection from "./ReviewsSection";
import BackButton from "@/components/BackButton";

function getPriceComparison(priceNum, area, cat) {
  const pricePerM2 = area > 0 ? Math.round(priceNum / area) : 0;
  // Toshkent o'rtacha bozor narxlari (USD/m²)
  const avgMarket = { "Yangi uylar": 850, "Ikkilamchi": 720, "Ijara": 12, "Ofis": 650 };
  const avg = avgMarket[cat] || 750;
  const ratio = pricePerM2 / avg;
  
  let label, type, icon, percentText;
  if (ratio < 0.85) {
    label = "Bozordan arzon";
    type = "cheap";
    icon = "ti-trending-down";
    percentText = `${Math.round((1 - ratio) * 100)}% arzon`;
  } else if (ratio <= 1.15) {
    label = "Bozor narxida";
    type = "average";
    icon = "ti-minus";
    percentText = "=";
  } else {
    label = "Bozordan qimmat";
    type = "expensive";
    icon = "ti-trending-up";
    percentText = `${Math.round((ratio - 1) * 100)}% qimmat`;
  }

  return {
    label,
    type,
    icon,
    percentText,
    pricePerM2,
    avg
  };
}

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
  const ownerCount = await getOwnerListingCount(l.ownerId);

  // O'xshash e'lonlar
  const similarListings = await getSimilarListings(l.id, l.cat);

  // E'lon egasining telefon raqamini aniqlash (bazadagi phone yoki fallback)
  const ownerPhone = l.phone || "+998 90 123 45 67";

  // Tavsif (bazadagi yoki avtomatik)
  const description = l.description || `${l.addr} hududida, metro va savdo markazlariga yaqin joylashgan yorug' va shinam ${l.type.toLowerCase()}. To'liq ta'mirlangan, mebellangan. Tinch hudud, maktab va bog'cha yonida.`;

  // Sharhlar va agentlik ma'lumotlari
  let reviews = [];
  let agency = null;
  try {
    const { rows: reviewRows } = await pool.query(
      `SELECT r.*, u.name AS reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewed_user_id = $1
       ORDER BY r.created_at DESC LIMIT 10`,
      [l.ownerId]
    );
    reviews = reviewRows.map(r => ({
      ...r,
      created_at: r.created_at ? r.created_at.toISOString() : new Date().toISOString()
    }));

    // Agentlik ma'lumotlarini olish
    let targetAgencyId = l.agencyId;
    if (!targetAgencyId) {
      const { rows: userRows } = await pool.query("SELECT agency_id FROM users WHERE id = $1", [l.ownerId]);
      if (userRows.length > 0) {
        targetAgencyId = userRows[0].agency_id;
      }
    }

    if (targetAgencyId) {
      const { rows: agencyRows } = await pool.query(
        `SELECT a.id, a.name, a.slug, a.is_verified, a.logo
         FROM agencies a
         WHERE a.id = $1 LIMIT 1`,
        [targetAgencyId]
      );
      if (agencyRows.length > 0) agency = agencyRows[0];
    }
  } catch (err) {
    console.error("Reviews/agency fetch error:", err);
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

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
                const comp = getPriceComparison(l.priceNum, l.area, l.cat);
                return (
                  <div className={`price-indicator ${comp.type}`} style={{ marginBottom: 8 }}>
                    <div className="pi-icon">
                      <i className={`ti ${comp.icon}`} style={{ fontSize: 22 }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{comp.label}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                        ${comp.pricePerM2.toLocaleString()}/m² · O&apos;rtacha: ${comp.avg.toLocaleString()}/m²
                      </div>
                    </div>
                    {comp.percentText !== "=" && (
                      <div className="pi-badge">
                        {comp.percentText}
                      </div>
                    )}
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

              {/* Sharhlar */}
              <ReviewsSection
                reviews={reviews}
                avgRating={avgRating}
                listingId={l.id}
                ownerId={l.ownerId}
                ownerName={l.owner}
                currentUserId={user?.id || null}
              />

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
                    {l.owner} {l.ownerVerified && <i className="ti ti-rosette-discount-check-filled" style={{ color: "var(--orange)" }} title="Tasdiqlangan foydalanuvchi"></i>}
                  </div>
                  <div className="orole">Egasi · {ownerCount} ta e&apos;lon</div>
                  {avgRating && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, marginTop: 2 }}>
                      <i className="ti ti-star-filled" style={{ color: "#f59e0b", fontSize: 12 }}></i>
                      <strong>{avgRating}</strong>
                      <span style={{ opacity: 0.6 }}>({reviews.length} sharh)</span>
                    </div>
                  )}
                  {agency && (
                    <Link href={`/agencies/${agency.slug}`} className="agency-owner-badge">
                      {agency.is_verified && <i className="ti ti-rosette-discount-check"></i>}
                      {agency.name}
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="side-actions">
                <CallBtn phone={ownerPhone} />
                <MessageModal listingId={l.id} receiverOwner={l.owner} receiverId={l.ownerId} />
              </div>
              
            <PropertyExtras priceNum={l.priceNum} listingId={l.id} listing={l} hasMortgage={l.hasMortgage} />
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile view */}
      <div className="mobile-only" style={{ background: "var(--cream, #FBF7F3)", minHeight: "100vh", paddingBottom: 120 }}>
        <div className="mdphoto" style={{ backgroundImage: `url('${l.photo}')` }}>
          <div className="mdnav">
            <BackButton fallback="/listings" className="mdbtn" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-arrow-left"></i>
            </BackButton>
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
          {/* Asosiy ma'lumotlar kartasi */}
          <div className="mdcard mdheader-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div className="mdtype">{l.type}</div>
              <span className="mdcat-badge">{l.cat}</span>
            </div>
            <div className="mdaddr">
              <i className="ti ti-map-pin" style={{ fontSize: 14 }}></i> {l.addr}, Toshkent
            </div>
            
            <div className="mdprice-row">
              <div className="mdprice">{l.price}</div>
              <div className="mdpriceArea">
                ≈ ${l.area > 0 ? Math.round(l.priceNum / l.area).toLocaleString() : 0} / m² · {l.area} m²
              </div>
            </div>
          </div>
          
          {/* Xususiyatlar ko'rsatkichlari (2x2 grid) */}
          <div className="mdspecs">
            <div className="mdspec">
              <div className="mdspec-icon">
                <i className="ti ti-bed"></i>
              </div>
              <div>
                <div className="msv">{l.rooms}</div>
                <div className="msl">Xona</div>
              </div>
            </div>
            <div className="mdspec">
              <div className="mdspec-icon">
                <i className="ti ti-bath"></i>
              </div>
              <div>
                <div className="msv">{l.baths}</div>
                <div className="msl">Hammom</div>
              </div>
            </div>
            <div className="mdspec">
              <div className="mdspec-icon">
                <i className="ti ti-ruler-2"></i>
              </div>
              <div>
                <div className="msv">{l.area}m²</div>
                <div className="msl">Maydon</div>
              </div>
            </div>
            <div className="mdspec">
              <div className="mdspec-icon">
                <i className="ti ti-stairs"></i>
              </div>
              <div>
                <div className="msv">{l.floor}</div>
                <div className="msl">Qavat</div>
              </div>
            </div>
          </div>

          {/* Narx indikatori — bozor narxiga nisbatan */}
          {(() => {
            const comp = getPriceComparison(l.priceNum, l.area, l.cat);
            return (
              <div className={`price-indicator ${comp.type}`} style={{ margin: "0 0 16px" }}>
                <div className="pi-icon">
                  <i className={`ti ${comp.icon}`} style={{ fontSize: 20 }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{comp.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    ${comp.pricePerM2.toLocaleString()}/m² · O&apos;rtacha: ${comp.avg.toLocaleString()}/m²
                  </div>
                </div>
                {comp.percentText !== "=" && (
                  <div className="pi-badge">
                    {comp.percentText}
                  </div>
                )}
              </div>
            );
          })()}

          {/* E'lon egasi haqida ma'lumot */}
          <div className="mdowner">
            <div className="mdoav">{initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 5 }}>
                {l.owner} {l.ownerVerified && <i className="ti ti-rosette-discount-check-filled" style={{ color: "var(--orange)", fontSize: 14 }} title="Tasdiqlangan foydalanuvchi"></i>}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Egasi · {ownerCount} ta e&apos;lon</div>
            </div>
            <a href={`tel:${ownerPhone.replace(/\s/g, "")}`} className="mdowner-phone">
              <i className="ti ti-phone"></i>
            </a>
          </div>

          {/* Tavsif kartasi */}
          <div className="mdblock mdcard">
            <h3>
              <i className="ti ti-align-left"></i>
              Tavsif
            </h3>
            <p>{description}</p>
          </div>

          {/* Qulayliklar kartasi */}
          <div className="mdblock mdcard">
            <h3>
              <i className="ti ti-list-check"></i>
              Xususiyatlar
            </h3>
            <div className="mdfeats">
              {features.map((f) => (
                <div className="mdft" key={f}>
                  <div className="mdft-bullet">
                    <i className="ti ti-check"></i>
                  </div>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ipoteka kartasi */}
          <div className="mdblock mdcard">
            <h3>
              <i className="ti ti-calculator"></i>
              Ipoteka
            </h3>
            <PropertyExtras priceNum={l.priceNum} listingId={l.id} hasMortgage={l.hasMortgage} />
          </div>
        </div>

        {/* Sticky Mobile Actions Bar */}
        <MobileActions listingId={l.id} receiverOwner={l.owner} receiverId={l.ownerId} ownerPhone={ownerPhone} />
      </div>
    </>
  );
}
