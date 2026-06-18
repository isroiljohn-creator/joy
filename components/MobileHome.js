"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATS = [
  { k: "Yangi uylar", i: "ti-building-skyscraper", bg: "var(--orange-tint)", fg: "var(--orange-dark)", sub: "Novostroyka, JK" },
  { k: "Ikkilamchi", i: "ti-home", bg: "#E6F1FB", fg: "#185FA5", sub: "Tayyor kvartiralar" },
  { k: "Ijara", i: "ti-key", bg: "#FAEEDA", fg: "#854F0B", sub: "Kunlik va oylik" },
  { k: "Ofis", i: "ti-briefcase", bg: "#EEEDFE", fg: "#534AB7", sub: "Biznes uchun" },
];

export default function MobileHome({ listings = [], count = 0 }) {
  const router = useRouter();
  const featured = listings[0];
  const rest = listings.slice(1, 4);

  return (
    <div className="mobile-only" style={{ background: "var(--cream, #FBF7F3)", minHeight: "100vh", paddingBottom: 90 }}>
      {/* Top Bar */}
      <div style={{ padding: "16px 16px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: ".5px solid var(--sand)" }}>
          <i className="ti ti-menu-2" style={{ fontSize: 19 }}></i>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Sizning hududingiz</div>
          <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 3, justifyContent: "center" }}>
            Toshkent, UZ <i className="ti ti-chevron-down" style={{ fontSize: 14 }}></i>
          </div>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: ".5px solid var(--sand)", position: "relative" }}>
          <i className="ti ti-bell" style={{ fontSize: 19 }}></i>
          <span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: "50%", background: "var(--orange)", border: "1.5px solid #fff" }}></span>
        </div>
      </div>

      {/* Search */}
      <div
        onClick={() => router.push("/listings")}
        style={{ margin: "14px 16px 8px", background: "#fff", border: ".5px solid var(--sand)", borderRadius: 16, padding: "13px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        <i className="ti ti-search" style={{ fontSize: 19, color: "var(--muted)" }}></i>
        <span style={{ flex: 1, fontSize: 14, color: "var(--muted)" }}>Qidirishni boshlang...</span>
        <i className="ti ti-adjustments-horizontal" style={{ fontSize: 19, paddingLeft: 8, borderLeft: "1px solid var(--sand)" }}></i>
      </div>

      {/* Categories — 4 ta dumaloq */}
      <div style={{ display: "flex", justifyContent: "space-around", padding: "12px 12px 16px" }}>
        {CATS.map((c) => (
          <Link
            key={c.k}
            href={`/listings?cat=${encodeURIComponent(c.k)}`}
            style={{ textAlign: "center", width: 74, textDecoration: "none", color: "inherit" }}
          >
            <div style={{ width: 58, height: 58, margin: "0 auto 6px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: c.bg, color: c.fg }}>
              <i className={`ti ${c.i}`} style={{ fontSize: 25 }}></i>
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.2, fontWeight: 500 }}>{c.k}</div>
          </Link>
        ))}
      </div>

      {/* Sotuvga tavsiyalar va Yangi e'lonlar */}
      {!featured && rest.length === 0 ? (
        <div style={{ margin: "24px 16px", padding: "32px 16px", background: "#fff", borderRadius: 24, textAlign: "center", border: ".5px solid var(--sand)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--orange-tint)", color: "var(--orange)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <i className="ti ti-search-off" style={{ fontSize: 28 }}></i>
          </div>
          <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "var(--ink)" }}>E&apos;lonlar topilmadi</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 20px", padding: "0 10px" }}>
            Hozircha hech qanday e&apos;lon mavjud emas yoki ulanishda xatolik yuz berdi. Iltimos, sahifani qayta yuklang.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ background: "var(--orange)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(242, 89, 31, 0.15)" }}
          >
            <i className="ti ti-refresh" style={{ fontSize: 15 }}></i> Qayta yuklash
          </button>
        </div>
      ) : (
        <>
          {/* Sotuvga tavsiyalar — Featured Card */}
          {featured && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px 12px" }}>
                <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 700 }}>Sotuvga tavsiyalar</h2>
                <Link href="/listings" style={{ fontSize: 12, color: "var(--orange-dark)", border: ".5px solid #F0997B", borderRadius: 20, padding: "5px 12px", fontWeight: 500 }}>Hammasi</Link>
              </div>
              <div
                onClick={() => router.push(`/property/${featured.id}`)}
                style={{ margin: "0 16px 14px", borderRadius: 20, overflow: "hidden", cursor: "pointer" }}
              >
                <div style={{ height: 180, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#C9BDA8", backgroundImage: `url('${featured.photo}')` }}></div>
                <div style={{ background: "#fff", borderRadius: 20, padding: 14, marginTop: -28, position: "relative", zIndex: 2 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--orange)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 19 }}>
                      <i className="ti ti-building-skyscraper"></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{featured.type}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{featured.addr}, Toshkent</div>
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--orange-tint)", color: "var(--orange)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      <i className="ti ti-arrow-up-right"></i>
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 22, fontWeight: 700, color: "var(--orange)", margin: "12px 0 10px" }}>{featured.price}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, border: ".5px solid var(--sand)", borderRadius: 20, padding: "7px 0", fontSize: 11, color: "var(--text2)" }}>
                      <i className="ti ti-bed" style={{ fontSize: 14 }}></i>{featured.rooms} xona
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, border: ".5px solid var(--sand)", borderRadius: 20, padding: "7px 0", fontSize: 11, color: "var(--text2)" }}>
                      <i className="ti ti-bath" style={{ fontSize: 14 }}></i>{featured.baths} hammom
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, border: ".5px solid var(--sand)", borderRadius: 20, padding: "7px 0", fontSize: 11, color: "var(--text2)" }}>
                      <i className="ti ti-stairs" style={{ fontSize: 14 }}></i>{featured.floor}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Yangi e'lonlar — Compact Cards */}
          {rest.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px 12px" }}>
                <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 700 }}>Yangi e&apos;lonlar</h2>
                <Link href="/listings" style={{ fontSize: 12, color: "var(--orange-dark)", border: ".5px solid #F0997B", borderRadius: 20, padding: "5px 12px", fontWeight: 500 }}>Hammasi</Link>
              </div>
              {rest.map((l) => (
                <div
                  key={l.id}
                  onClick={() => router.push(`/property/${l.id}`)}
                  style={{ background: "#fff", borderRadius: 18, overflow: "hidden", margin: "0 16px 12px", display: "flex", gap: 12, padding: 10, cursor: "pointer" }}
                >
                  <div style={{ width: 96, height: 96, borderRadius: 14, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#C9BDA8", flexShrink: 0, position: "relative", backgroundImage: `url('${l.photo}')` }}>
                    {l.top && <span style={{ position: "absolute", top: 6, left: 6, background: "var(--orange)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 8 }}>TOP</span>}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
                    <div>
                      <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--orange)" }}>{l.price}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{l.type}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
                        <i className="ti ti-map-pin" style={{ fontSize: 13 }}></i> {l.addr}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text2)", marginTop: 4 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><i className="ti ti-bed" style={{ fontSize: 13 }}></i>{l.rooms}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><i className="ti ti-bath" style={{ fontSize: 13 }}></i>{l.baths}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><i className="ti ti-ruler-2" style={{ fontSize: 13 }}></i>{l.area}m²</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><i className="ti ti-stairs" style={{ fontSize: 13 }}></i>{l.floor}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
