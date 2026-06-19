"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

const CATS = [
  { k: "Yangi uylar", i: "ti-building-skyscraper", bg: "var(--orange-tint)", fg: "var(--orange)", sub: "Novostroyka, JK" },
  { k: "Ikkilamchi", i: "ti-home", bg: "var(--orange-tint)", fg: "var(--orange)", sub: "Tayyor kvartiralar" },
  { k: "Ijara", i: "ti-key", bg: "var(--orange-tint)", fg: "var(--orange)", sub: "Kunlik va oylik" },
  { k: "Ofis", i: "ti-briefcase", bg: "var(--orange-tint)", fg: "var(--orange)", sub: "Biznes uchun" },
];

export default function MobileHome({ listings = [], count = 0 }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const featured = listings[0];
  const rest = listings.slice(1, 4);

  const handleSearch = () => {
    const q = query.trim();
    if (q) {
      router.push(`/listings?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/listings");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") {
      setQuery("");
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="mobile-only" style={{ background: "var(--cream, #FBF7F3)", minHeight: "100vh", paddingBottom: 90 }}>
      {/* Top Bar */}
      <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Sizning hududingiz</div>
          <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 3, justifyContent: "center" }}>
            Toshkent, UZ <i className="ti ti-chevron-down" style={{ fontSize: 14 }}></i>
          </div>
        </div>
      </div>


      {/* Search */}
      <div
        style={{
          margin: "10px 16px 8px",
          background: "var(--card-bg, #fff)",
          border: focused ? "1.5px solid var(--orange)" : ".5px solid var(--sand)",
          boxShadow: focused ? "0 0 0 3px var(--orange-tint)" : "none",
          borderRadius: 16,
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        <i className="ti ti-search" style={{ fontSize: 18, color: focused ? "var(--orange)" : "var(--muted)", flexShrink: 0, transition: "color 0.2s" }}></i>
        <input
          ref={inputRef}
          type="text"
          placeholder="Hudud, tur yoki manzil..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 14,
            background: "none",
            color: "var(--ink)",
            padding: "13px 0",
            fontFamily: "inherit",
          }}
        />
        {query ? (
          <button
            onClick={() => setQuery("")}
            style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center" }}
          >
            <i className="ti ti-x" style={{ fontSize: 16 }}></i>
          </button>
        ) : (
          <button
            onClick={() => router.push("/listings")}
            style={{ background: "none", border: "none", padding: "4px 0 4px 8px", borderLeft: "1px solid var(--sand)", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center" }}
          >
            <i className="ti ti-adjustments-horizontal" style={{ fontSize: 18 }}></i>
          </button>
        )}
        {query && (
          <button
            onClick={handleSearch}
            style={{
              background: "var(--orange)",
              border: "none",
              borderRadius: 10,
              padding: "7px 14px",
              cursor: "pointer",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
              flexShrink: 0,
            }}
          >
            <i className="ti ti-arrow-right" style={{ fontSize: 14 }}></i>
          </button>
        )}
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
        <div style={{ margin: "24px 16px", padding: "32px 16px", background: "var(--card-bg)", borderRadius: 24, textAlign: "center", border: ".5px solid var(--sand)" }}>
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
                <div style={{ background: "var(--card-bg)", borderRadius: 20, padding: 14, marginTop: -28, position: "relative", zIndex: 2 }}>
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
                  
                  {featured.priceStatus && (
                    <div style={{ marginBottom: 10, display: "flex", alignItems: "center" }}>
                      {featured.priceStatus === "cheap" && (
                        <span style={{
                          background: "rgba(34, 197, 94, 0.1)",
                          color: "#16a34a",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 10,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3
                        }}>
                          <i className="ti ti-trending-down"></i> {Math.abs(featured.priceDiffPercent)}% arzonroq
                        </span>
                      )}
                      {featured.priceStatus === "expensive" && (
                        <span style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "#dc2626",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 10,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3
                        }}>
                          <i className="ti ti-trending-up"></i> {featured.priceDiffPercent}% qimmatroq
                        </span>
                      )}
                      {featured.priceStatus === "average" && (
                        <span style={{
                          background: "rgba(107, 114, 128, 0.1)",
                          color: "var(--muted)",
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: 10,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3
                        }}>
                          <i className="ti ti-minus"></i> Bozor narxida
                        </span>
                      )}
                    </div>
                  )}

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
                  style={{ background: "var(--card-bg)", borderRadius: 18, overflow: "hidden", margin: "0 16px 12px", display: "flex", gap: 12, padding: 10, cursor: "pointer" }}
                >
                  <div style={{ width: 96, height: 96, borderRadius: 14, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#C9BDA8", flexShrink: 0, position: "relative", backgroundImage: `url('${l.photo}')` }}>
                    {l.top && <span style={{ position: "absolute", top: 6, left: 6, background: "var(--orange)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 8 }}>TOP</span>}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
                    <div>
                      <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--orange)" }}>{l.price}</div>
                      
                      {l.priceStatus && (
                        <div style={{ marginTop: 2, display: "flex", alignItems: "center" }}>
                          {l.priceStatus === "cheap" && (
                            <span style={{
                              background: "rgba(34, 197, 94, 0.1)",
                              color: "#16a34a",
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "1px 6px",
                              borderRadius: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2
                            }}>
                              <i className="ti ti-trending-down"></i> {Math.abs(l.priceDiffPercent)}% arzonroq
                            </span>
                          )}
                          {l.priceStatus === "expensive" && (
                            <span style={{
                              background: "rgba(239, 68, 68, 0.1)",
                              color: "#dc2626",
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "1px 6px",
                              borderRadius: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2
                            }}>
                              <i className="ti ti-trending-up"></i> {l.priceDiffPercent}% qimmatroq
                            </span>
                          )}
                          {l.priceStatus === "average" && (
                            <span style={{
                              background: "rgba(107, 114, 128, 0.1)",
                              color: "var(--muted)",
                              fontSize: 10,
                              fontWeight: 500,
                              padding: "1px 6px",
                              borderRadius: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2
                            }}>
                              <i className="ti ti-minus"></i> Bozor narxida
                            </span>
                          )}
                        </div>
                      )}

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
