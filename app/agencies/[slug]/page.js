import { notFound } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import { getCurrentUser } from "@/app/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = params;
  try {
    const { rows } = await pool.query("SELECT name, description FROM agencies WHERE slug = $1", [slug]);
    if (rows.length === 0) return { title: "Agentlik topilmadi" };
    return {
      title: `${rows[0].name} — maskon.uz`,
      description: rows[0].description || `${rows[0].name} agentligining e'lonlari maskon.uz platformasida.`,
    };
  } catch {
    return { title: "Agentlik" };
  }
}

export default async function AgencyProfilePage({ params }) {
  const { slug } = params;
  const user = await getCurrentUser();

  let agency = null;
  let listings = [];
  let members = [];
  let reviews = [];

  try {
    const { rows: agencyRows } = await pool.query(`
      SELECT a.*, u.name AS owner_name, u.phone AS owner_phone
      FROM agencies a
      LEFT JOIN users u ON a.owner_id = u.id
      WHERE a.slug = $1
    `, [slug]);

    if (agencyRows.length === 0) notFound();
    agency = agencyRows[0];

    // Agentlik e'lonlari
    const { rows: listingRows } = await pool.query(`
      SELECT l.*, u.name AS owner_name
      FROM listings l
      LEFT JOIN users u ON l.owner_id = u.id
      WHERE l.agency_id = $1 AND l.status = 'active' AND l.deleted_at IS NULL
      ORDER BY l.top DESC, l.id DESC
      LIMIT 20
    `, [agency.id]);
    listings = listingRows;

    // Xodimlar
    const { rows: memberRows } = await pool.query(`
      SELECT u.id, u.name, u.phone, am.role, am.joined_at
      FROM agency_members am
      JOIN users u ON am.user_id = u.id
      WHERE am.agency_id = $1
      ORDER BY am.role DESC, am.joined_at ASC
    `, [agency.id]);
    members = memberRows;

    // Sharhlar
    const { rows: reviewRows } = await pool.query(`
      SELECT r.*, u.name AS reviewer_name
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.reviewed_user_id = $1
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [agency.owner_id]);
    reviews = reviewRows;

  } catch (err) {
    console.error("AgencyProfilePage error:", err);
    notFound();
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const isOwner = user && user.id === agency.owner_id;

  return (
    <div>
      {/* Agency Header Banner */}
      <div className="agency-profile-banner">
        <div className="wrap">
          <div className="agency-profile-header">
            <div className="agency-profile-logo">
              {agency.logo ? (
                <img src={agency.logo} alt={agency.name} />
              ) : (
                <span>{agency.name[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="agency-profile-info">
              <div className="agency-profile-title-row">
                <h1>{agency.name}</h1>
                {agency.is_verified && (
                  <span className="agency-verified-badge large">
                    <i className="ti ti-rosette-discount-check"></i> Tasdiqlangan
                  </span>
                )}
              </div>
              {agency.address && (
                <div className="agency-meta-item">
                  <i className="ti ti-map-pin"></i> {agency.address}
                </div>
              )}
              {agency.phone && (
                <a href={`tel:${agency.phone}`} className="agency-meta-item link">
                  <i className="ti ti-phone"></i> {agency.phone}
                </a>
              )}
              {agency.website && (
                <a href={agency.website} target="_blank" rel="noopener noreferrer" className="agency-meta-item link">
                  <i className="ti ti-world"></i> {agency.website}
                </a>
              )}
              {avgRating && (
                <div className="agency-meta-item">
                  <i className="ti ti-star-filled" style={{ color: "#f59e0b" }}></i>
                  <strong>{avgRating}</strong>
                  <span style={{ opacity: 0.6 }}>({reviews.length} sharh)</span>
                </div>
              )}
            </div>
            {isOwner && (
              <Link href="/agency-dashboard" className="btn btn-primary">
                <i className="ti ti-settings"></i> Boshqarish
              </Link>
            )}
          </div>

          {agency.description && (
            <p className="agency-profile-desc">{agency.description}</p>
          )}

          <div className="agency-profile-stats">
            <div className="agency-profile-stat">
              <span className="stat-num">{listings.length}</span>
              <span className="stat-label">E'lonlar</span>
            </div>
            <div className="agency-profile-stat">
              <span className="stat-num">{members.length}</span>
              <span className="stat-label">Maklerlar</span>
            </div>
            {avgRating && (
              <div className="agency-profile-stat">
                <span className="stat-num">{avgRating}⭐</span>
                <span className="stat-label">Reyting</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="agency-profile-layout">
          {/* Left: Listings */}
          <div className="agency-profile-main">
            <h2 className="section-title">
              <i className="ti ti-home"></i> E'lonlar ({listings.length})
            </h2>
            {listings.length === 0 ? (
              <div className="empty-state-small">
                <i className="ti ti-home-off"></i>
                <p>Hozircha e'lonlar yo'q</p>
              </div>
            ) : (
              <div className="agency-listings-grid">
                {listings.map((l) => (
                  <Link key={l.id} href={`/property/${l.id}`} className="agency-listing-card">
                    <div className="agency-listing-img">
                      <img src={l.photo} alt={l.type} loading="lazy" />
                      {l.top && <span className="top-badge">TOP</span>}
                    </div>
                    <div className="agency-listing-info">
                      <div className="agency-listing-price">{l.price}</div>
                      <div className="agency-listing-type">{l.type}</div>
                      <div className="agency-listing-addr">
                        <i className="ti ti-map-pin"></i> {l.addr}
                      </div>
                      <div className="agency-listing-meta">
                        <span><i className="ti ti-door"></i> {l.rooms} xona</span>
                        <span><i className="ti ti-ruler"></i> {l.area} m²</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <>
                <h2 className="section-title" style={{ marginTop: 40 }}>
                  <i className="ti ti-star"></i> Sharhlar ({reviews.length})
                </h2>
                <div className="reviews-list">
                  {reviews.map((r) => (
                    <div key={r.id} className="review-card">
                      <div className="review-header">
                        <div className="review-avatar">{r.reviewer_name?.[0]?.toUpperCase()}</div>
                        <div>
                          <div className="review-name">{r.reviewer_name}</div>
                          <div className="review-stars">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <i
                                key={i}
                                className={`ti ${i < r.rating ? "ti-star-filled" : "ti-star"}`}
                                style={{ color: i < r.rating ? "#f59e0b" : "#ddd" }}
                              ></i>
                            ))}
                          </div>
                        </div>
                        <div className="review-date">
                          {new Date(r.created_at).toLocaleDateString("uz-UZ")}
                        </div>
                      </div>
                      {r.comment && <p className="review-comment">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Team sidebar */}
          <div className="agency-profile-sidebar">
            <div className="agency-sidebar-card">
              <h3><i className="ti ti-users"></i> Jamoamiz</h3>
              {members.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>Hali xodimlar yo'q</p>
              ) : (
                <div className="agency-members-list">
                  {members.map((m) => (
                    <div key={m.id} className="agency-member-item">
                      <div className="agency-member-avatar">{m.name?.[0]?.toUpperCase()}</div>
                      <div className="agency-member-info">
                        <div className="agency-member-name">{m.name}</div>
                        <div className="agency-member-role">
                          {m.role === "owner" ? "Rahbar" : "Makler"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {agency.phone && (
              <div className="agency-sidebar-card" style={{ textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                  Biz bilan bog'laning
                </p>
                <a href={`tel:${agency.phone}`} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  <i className="ti ti-phone"></i> Qo'ng'iroq
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
