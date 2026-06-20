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
import NearbyInfrastructure from "@/components/NearbyInfrastructure";
import PrintBtn from "@/components/PrintBtn";
import PropertyFavoriteBtn from "@/components/PropertyFavoriteBtn";



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


  // Narxlar dinamikasi (tuman bo'yicha) SVG grafigi ma'lumotlari
  const pricePerM2 = l.priceNum && l.area ? Math.round(l.priceNum / l.area) : 900;
  const monthsList = ["Dek", "Yan", "Feb", "Mar", "Apr", "May"];
  const trendPercentages = [0.93, 0.95, 0.94, 0.97, 0.98, 1.0];
  const trendValues = trendPercentages.map(pct => Math.round(pricePerM2 * pct));
  const minVal = Math.min(...trendValues) * 0.98;
  const maxVal = Math.max(...trendValues) * 1.02;

  const points = trendValues.map((v, i) => {
    const x = 50 + i * 80;
    const y = 150 - ((v - minVal) / (maxVal - minVal)) * 100;
    return { x, y, val: v, month: monthsList[i] };
  });

  const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(" L ")}`;
  const fillD = `${pathD} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z`;

  return (
    <>
      {/* Desktop view */}
      <div className="desktop-only">
        <Nav />
        <div className="wrap">
          <div className="crumb no-print">
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
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <h1 className="display" style={{ margin: 0 }}>{l.type}</h1>
                    {l.hasCadastreVerified && (
                      <span className="cadastre-badge">
                        <i className="ti ti-shield-check"></i> Hujjatlari tekshirilgan
                      </span>
                    )}
                  </div>
                  <div className="addr" style={{ fontSize: 15, marginTop: 8 }}>
                    <i className="ti ti-map-pin"></i> {l.addr}, Toshkent
                  </div>
                </div>
                <div className="iconbtns" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <PropertyFavoriteBtn listingId={l.id} initialFavorite={isFavorite} />
                  <ShareBtn />
                  <PrintBtn />
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

              {/* Narxlar dinamikasi SVG Trend Grafigi */}
              <div className="block">
                <h2 className="display" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="ti ti-trending-up" style={{ color: "var(--orange)" }}></i> Narxlar dinamikasi (tuman bo&apos;yicha)
                </h2>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: "-8px 0 16px" }}>
                  Oxirgi 6 oy davomida tumandagi o&apos;rtacha 1 m² narxi ($/m²)
                </p>
                <div style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--sand)",
                  borderRadius: 16,
                  padding: "20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}>
                  <div style={{ position: "relative", width: "100%", height: 200 }}>
                    <svg viewBox="0 0 500 200" width="100%" height="100%" style={{ overflow: "visible" }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--orange)" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="var(--orange)" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4].map((i) => {
                        const y = 50 + i * 25;
                        return (
                          <line
                            key={i}
                            x1="40"
                            y1={y}
                            x2="460"
                            y2={y}
                            stroke="var(--sand)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                        );
                      })}

                      {/* Area fill */}
                      <path d={fillD} fill="url(#chartGrad)" />

                      {/* Line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="var(--orange)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Glow effect on points */}
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="8"
                            fill="var(--orange)"
                            opacity="0.15"
                          />
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="4"
                            fill="var(--orange)"
                            stroke="var(--card-bg)"
                            strokeWidth="1.5"
                          />
                          <text
                            x={p.x}
                            y={p.y - 10}
                            textAnchor="middle"
                            fill="var(--ink)"
                            fontSize="10"
                            fontWeight="700"
                          >
                            ${p.val}
                          </text>
                          <text
                            x={p.x}
                            y="185"
                            textAnchor="middle"
                            fill="var(--muted)"
                            fontSize="11"
                            fontWeight="600"
                          >
                            {p.month}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </div>

              <NearbyInfrastructure address={l.addr} />

              {/* Sharhlar */}
              <div className="reviews-container no-print">
                <ReviewsSection
                  reviews={reviews}
                  avgRating={avgRating}
                  listingId={l.id}
                  ownerId={l.ownerId}
                  ownerName={l.owner}
                  currentUserId={user?.id || null}
                />
              </div>

              {/* O'xshash e'lonlar */}
              {similarListings.length > 0 && (
                <div className="block no-print" style={{ marginTop: 32 }}>
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
              <PropertyFavoriteBtn listingId={l.id} initialFavorite={isFavorite} btnClass="mdbtn" />
              <ShareBtn btnClass="mdbtn" />
              <PrintBtn btnClass="mdbtn" />
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
            {l.hasCadastreVerified && (
              <div style={{ marginTop: 8, marginBottom: 4 }}>
                <span className="cadastre-badge" style={{ fontSize: 11, padding: "3px 8px" }}>
                  <i className="ti ti-shield-check"></i> Hujjatlari tekshirilgan
                </span>
              </div>
            )}
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

          {/* Narxlar dinamikasi SVG Trend Grafigi (Mobile) */}
          <div className="mdblock mdcard">
            <h3>
              <i className="ti ti-trending-up"></i>
              Narxlar dinamikasi
            </h3>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "-4px 0 16px" }}>
              Oxirgi 6 oy davomida tumandagi o&apos;rtacha 1 m² narxi ($/m²)
            </p>
            <div style={{ position: "relative", width: "100%", height: 180 }}>
              <svg viewBox="0 0 500 200" width="100%" height="100%" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="chartGradMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--orange)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--orange)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => {
                  const y = 50 + i * 25;
                  return (
                    <line
                      key={i}
                      x1="40"
                      y1={y}
                      x2="460"
                      y2={y}
                      stroke="var(--sand)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Area fill */}
                <path d={fillD} fill="url(#chartGradMobile)" />

                {/* Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="var(--orange)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Glow effect on points */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="8"
                      fill="var(--orange)"
                      opacity="0.15"
                    />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="var(--orange)"
                      stroke="var(--card-bg)"
                      strokeWidth="1.5"
                    />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      fill="var(--ink)"
                      fontSize="10"
                      fontWeight="700"
                    >
                      ${p.val}
                    </text>
                    <text
                      x={p.x}
                      y="185"
                      textAnchor="middle"
                      fill="var(--muted)"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {p.month}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <NearbyInfrastructure address={l.addr} />

          {/* Ipoteka kartasi */}
          <div className="mdblock mdcard">
            <h3>
              <i className="ti ti-calculator"></i>
              Ipoteka
            </h3>
            <PropertyExtras priceNum={l.priceNum} listingId={l.id} listing={l} hasMortgage={l.hasMortgage} />
          </div>
        </div>

        {/* Sticky Mobile Actions Bar */}
        <MobileActions listingId={l.id} receiverOwner={l.owner} receiverId={l.ownerId} ownerPhone={ownerPhone} />
      </div>
    </>
  );
}
