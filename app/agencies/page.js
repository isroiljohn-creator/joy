import { redirect } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import { getCurrentUser } from "@/app/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agentliklar — Joy.uz",
  description: "O'zbekistonning yetakchi rieltorlik agentliklari Joy.uz platformasida. Tasdiqlangan maklerlar va kompaniyalar.",
};

export default async function AgenciesPage() {
  const user = await getCurrentUser();

  let agencies = [];
  try {
    const { rows } = await pool.query(`
      SELECT 
        a.*,
        u.name AS owner_name,
        u.phone AS owner_phone,
        COUNT(DISTINCT l.id) AS listings_count,
        COUNT(DISTINCT am.id) AS members_count
      FROM agencies a
      LEFT JOIN users u ON a.owner_id = u.id
      LEFT JOIN listings l ON l.agency_id = a.id AND l.status = 'active'
      LEFT JOIN agency_members am ON am.agency_id = a.id
      GROUP BY a.id, u.name, u.phone
      ORDER BY a.is_verified DESC, listings_count DESC, a.created_at DESC
    `);
    agencies = rows;
  } catch (err) {
    console.error("AgenciesPage error:", err);
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="agencies-hero">
        <div className="wrap">
          <h1>Ishonchli Agentliklar</h1>
          <p>Joy.uz platformasidagi tasdiqlangan rieltorlik kompaniyalari va maklerlar</p>
          {user && (
            <Link href="/agency-dashboard" className="btn btn-white">
              <i className="ti ti-building-store"></i>
              Agentligimni boshqarish
            </Link>
          )}
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* Stats bar */}
        <div className="agencies-stats-bar">
          <div className="agencies-stat-item">
            <span className="stat-num">{agencies.length}</span>
            <span className="stat-label">Agentlik</span>
          </div>
          <div className="agencies-stat-item">
            <span className="stat-num">{agencies.filter(a => a.is_verified).length}</span>
            <span className="stat-label">Tasdiqlangan</span>
          </div>
          <div className="agencies-stat-item">
            <span className="stat-num">{agencies.reduce((s, a) => s + parseInt(a.listings_count || 0), 0)}</span>
            <span className="stat-label">Faol e'lonlar</span>
          </div>
        </div>

        {agencies.length === 0 ? (
          <div className="agencies-empty">
            <i className="ti ti-building-store"></i>
            <h2>Hali agentliklar yo'q</h2>
            <p>Birinchi agentlik bo'ling!</p>
            {user ? (
              <Link href="/agency-dashboard" className="btn btn-primary">
                Agentlik yaratish
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary">
                Kirish
              </Link>
            )}
          </div>
        ) : (
          <div className="agencies-grid">
            {agencies.map((agency) => (
              <Link
                key={agency.id}
                href={`/agencies/${agency.slug}`}
                className="agency-card"
              >
                <div className="agency-card-header">
                  <div className="agency-logo">
                    {agency.logo ? (
                      <img src={agency.logo} alt={agency.name} />
                    ) : (
                      <span>{agency.name[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  {agency.is_verified && (
                    <div className="agency-verified-badge">
                      <i className="ti ti-rosette-discount-check"></i>
                      Tasdiqlangan
                    </div>
                  )}
                </div>
                <div className="agency-card-body">
                  <h2 className="agency-name">{agency.name}</h2>
                  {agency.address && (
                    <div className="agency-address">
                      <i className="ti ti-map-pin"></i>
                      {agency.address}
                    </div>
                  )}
                  {agency.description && (
                    <p className="agency-desc">{agency.description.slice(0, 100)}{agency.description.length > 100 ? "..." : ""}</p>
                  )}
                  <div className="agency-card-stats">
                    <div className="agency-card-stat">
                      <i className="ti ti-home"></i>
                      <span>{agency.listings_count} e'lon</span>
                    </div>
                    <div className="agency-card-stat">
                      <i className="ti ti-users"></i>
                      <span>{agency.members_count} makler</span>
                    </div>
                    {agency.phone && (
                      <div className="agency-card-stat">
                        <i className="ti ti-phone"></i>
                        <span>{agency.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="agency-card-footer">
                  Ko'rish <i className="ti ti-arrow-right"></i>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA: Create agency */}
        {user && (
          <div className="agencies-cta">
            <div className="agencies-cta-content">
              <i className="ti ti-building-plus"></i>
              <div>
                <h3>O'z agentligingizni oching</h3>
                <p>Rieltorlik kompaniyangiz uchun alohida profil, dashboard va xodimlar boshqaruvi</p>
              </div>
            </div>
            <Link href="/agency-dashboard" className="btn btn-primary">
              Boshlash
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
