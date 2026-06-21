"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Nav } from "@/components/ui";
import { getListingsByIdsAction } from "@/app/actions";

export default function ComparePage() {
  const [ids, setIds] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // localStorage dan ID larni o'qish
  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("maskon_compare") || localStorage.getItem("joy_compare") || "[]");
    setIds(list);
  }, []);

  // ID lar bo'yicha ma'lumotlarni yuklash
  useEffect(() => {
    async function loadListings() {
      if (ids.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getListingsByIdsAction(ids);
        setListings(data);
      } catch (err) {
        console.error("Compare page loading error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, [ids]);

  const handleRemove = (id) => {
    const updated = ids.filter(item => item !== id);
    setIds(updated);
    localStorage.setItem("maskon_compare", JSON.stringify(updated));
    window.dispatchEvent(new Event("compare_updated"));
  };

  return (
    <>
      <Nav />
      <div className="wrap" style={{ paddingBottom: 80 }}>
        <div style={{ margin: "24px 0" }}>
          <h1 className="page-title display" style={{ fontSize: 28, margin: "0 0 8px" }}>
            📊 E&apos;lonlarni Solishtirish
          </h1>
          <p className="page-sub" style={{ margin: 0 }}>
            Tanlangan e&apos;lonlarning asosiy parametrlarini yonma-yon solishtiring (Maksimal 3 ta)
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
            <div style={{
              width: 36,
              height: 36,
              border: "3px solid var(--sand)",
              borderTopColor: "var(--orange)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }} />
          </div>
        ) : listings.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "var(--card-bg)",
            border: "1.5px dashed var(--sand)",
            borderRadius: 20,
            marginTop: 20
          }}>
            <i className="ti ti-git-compare" style={{ fontSize: 54, color: "var(--muted)", display: "block", marginBottom: 20 }}></i>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Solishtirish uchun e&apos;lonlar yo&apos;q</h3>
            <p style={{ color: "var(--text2)", fontSize: 14, maxWidth: 360, margin: "0 auto 24px" }}>
              Bosh sahifa yoki e&apos;lonlar ro&apos;yxatidagi e&apos;lon kartalarida taroz belgisini bosib solishtirishga qo&apos;shing.
            </p>
            <Link href="/listings" className="btn-add" style={{ padding: "12px 28px", textDecoration: "none", display: "inline-block" }}>
              E&apos;lonlarni ko&apos;rish
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto", background: "var(--card-bg)", borderRadius: 20, border: "1px solid var(--sand)", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600, textAlign: "left" }}>
              <thead>
                <tr>
                  <th style={{ padding: "20px 24px", width: "200px", borderBottom: "2px solid var(--sand)", color: "var(--muted)", fontSize: 13, fontWeight: 700, textTransform: "uppercase" }}>Xususiyatlar</th>
                  {listings.map((l) => (
                    <th key={l.id} style={{ padding: "20px 24px", borderBottom: "2px solid var(--sand)", position: "relative" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Rasm */}
                        <div style={{
                          width: "100%",
                          height: 120,
                          borderRadius: 12,
                          backgroundImage: `url('${l.photo}')`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundColor: "#C9BDA8",
                          position: "relative"
                        }}>
                          <button
                            onClick={() => handleRemove(l.id)}
                            style={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              background: "rgba(239, 68, 68, 0.9)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "50%",
                              width: 28,
                              height: 28,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                              transition: "transform 0.15s ease"
                            }}
                            title="O'chirish"
                          >
                            <i className="ti ti-trash"></i>
                          </button>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", lineHeight: 1.3 }}>
                          {l.type}
                        </div>
                      </div>
                    </th>
                  ))}
                  {/* Fill missing columns if less than 3 */}
                  {Array.from({ length: 3 - listings.length }).map((_, i) => (
                    <th key={`empty-${i}`} style={{ padding: "20px 24px", borderBottom: "2px solid var(--sand)", opacity: 0.3 }}>
                      <div style={{
                        height: 120,
                        border: "2.5px dashed var(--sand)",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 8,
                        color: "var(--muted)"
                      }}>
                        <i className="ti ti-plus" style={{ fontSize: 20 }}></i>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Joy bo&apos;sh</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Narxi */}
                <tr style={{ borderBottom: "1px solid var(--sand)" }}>
                  <td style={{ padding: "16px 24px", fontWeight: 700, color: "var(--muted)", fontSize: 13 }}>Narx (USD)</td>
                  {listings.map(l => (
                    <td key={l.id} style={{ padding: "16px 24px", fontWeight: 800, color: "var(--orange)", fontSize: 18, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {l.price}
                    </td>
                  ))}
                  {Array.from({ length: 3 - listings.length }).map((_, i) => <td key={i} />)}
                </tr>

                {/* Toifa */}
                <tr style={{ borderBottom: "1px solid var(--sand)" }}>
                  <td style={{ padding: "16px 24px", fontWeight: 700, color: "var(--muted)", fontSize: 13 }}>Toifa</td>
                  {listings.map(l => (
                    <td key={l.id} style={{ padding: "16px 24px", fontWeight: 600, color: "var(--ink)", fontSize: 14 }}>
                      <span style={{
                        background: "var(--orange-tint)",
                        color: "var(--orange-dark)",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 20,
                        textTransform: "uppercase"
                      }}>{l.cat}</span>
                    </td>
                  ))}
                  {Array.from({ length: 3 - listings.length }).map((_, i) => <td key={i} />)}
                </tr>

                {/* Joylashuv */}
                <tr style={{ borderBottom: "1px solid var(--sand)" }}>
                  <td style={{ padding: "16px 24px", fontWeight: 700, color: "var(--muted)", fontSize: 13 }}>Tuman / Manzil</td>
                  {listings.map(l => (
                    <td key={l.id} style={{ padding: "16px 24px", color: "var(--text2)", fontSize: 14 }}>
                      <i className="ti ti-map-pin" style={{ color: "var(--orange)", marginRight: 4 }}></i>
                      {l.addr}
                    </td>
                  ))}
                  {Array.from({ length: 3 - listings.length }).map((_, i) => <td key={i} />)}
                </tr>

                {/* Maydon */}
                <tr style={{ borderBottom: "1px solid var(--sand)" }}>
                  <td style={{ padding: "16px 24px", fontWeight: 700, color: "var(--muted)", fontSize: 13 }}>Maydon</td>
                  {listings.map(l => (
                    <td key={l.id} style={{ padding: "16px 24px", fontWeight: 700, color: "var(--ink)", fontSize: 15 }}>
                      {l.area} m²
                    </td>
                  ))}
                  {Array.from({ length: 3 - listings.length }).map((_, i) => <td key={i} />)}
                </tr>

                {/* Xonalar soni */}
                <tr style={{ borderBottom: "1px solid var(--sand)" }}>
                  <td style={{ padding: "16px 24px", fontWeight: 700, color: "var(--muted)", fontSize: 13 }}>Xonalar soni</td>
                  {listings.map(l => (
                    <td key={l.id} style={{ padding: "16px 24px", color: "var(--ink)", fontSize: 14, fontWeight: 600 }}>
                      {l.rooms} xona
                    </td>
                  ))}
                  {Array.from({ length: 3 - listings.length }).map((_, i) => <td key={i} />)}
                </tr>

                {/* Hammomlar */}
                <tr style={{ borderBottom: "1px solid var(--sand)" }}>
                  <td style={{ padding: "16px 24px", fontWeight: 700, color: "var(--muted)", fontSize: 13 }}>Hammomlar</td>
                  {listings.map(l => (
                    <td key={l.id} style={{ padding: "16px 24px", color: "var(--ink)", fontSize: 14 }}>
                      {l.baths} hammom
                    </td>
                  ))}
                  {Array.from({ length: 3 - listings.length }).map((_, i) => <td key={i} />)}
                </tr>

                {/* Qavat */}
                <tr style={{ borderBottom: "1px solid var(--sand)" }}>
                  <td style={{ padding: "16px 24px", fontWeight: 700, color: "var(--muted)", fontSize: 13 }}>Qavat</td>
                  {listings.map(l => (
                    <td key={l.id} style={{ padding: "16px 24px", color: "var(--ink)", fontSize: 14 }}>
                      {l.floor}
                    </td>
                  ))}
                  {Array.from({ length: 3 - listings.length }).map((_, i) => <td key={i} />)}
                </tr>

                {/* Kadastr tasdiqlanganligi */}
                <tr style={{ borderBottom: "1px solid var(--sand)" }}>
                  <td style={{ padding: "16px 24px", fontWeight: 700, color: "var(--muted)", fontSize: 13 }}>Hujjatlar</td>
                  {listings.map(l => (
                    <td key={l.id} style={{ padding: "16px 24px" }}>
                      {l.hasCadastreVerified ? (
                        <span className="cadastre-badge" style={{ fontSize: 11, padding: "4px 10px" }}>
                          <i className="ti ti-shield-check"></i> Tekshirilgan
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Tasdiqlanmagan</span>
                      )}
                    </td>
                  ))}
                  {Array.from({ length: 3 - listings.length }).map((_, i) => <td key={i} />)}
                </tr>

                {/* Batafsil ko'rish havolasi */}
                <tr>
                  <td style={{ padding: "20px 24px" }}></td>
                  {listings.map(l => (
                    <td key={l.id} style={{ padding: "20px 24px" }}>
                      <Link href={`/property/${l.id}`} className="btn-add" style={{ padding: "10px 20px", textDecoration: "none", display: "inline-block", fontSize: 13, fontWeight: 700, textAlign: "center" }}>
                        Batafsil ko&apos;rish
                      </Link>
                    </td>
                  ))}
                  {Array.from({ length: 3 - listings.length }).map((_, i) => <td key={i} />)}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

    </>
  );
}
