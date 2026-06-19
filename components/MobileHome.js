"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  saveSearch,
  removeSearch,
  clearAllSearches,
  getRecentSearches,
  scoreListings,
  trackCategory,
} from "@/lib/userPrefs";

const CATS = [
  { k: "Yangi uylar", i: "ti-building-skyscraper", bg: "var(--orange-tint)", fg: "var(--orange)" },
  { k: "Ikkilamchi",  i: "ti-home",                bg: "var(--orange-tint)", fg: "var(--orange)" },
  { k: "Ijara",       i: "ti-key",                 bg: "var(--orange-tint)", fg: "var(--orange)" },
  { k: "Ofis",        i: "ti-briefcase",            bg: "var(--orange-tint)", fg: "var(--orange)" },
];

/* Kichik compact karta */
function MiniCard({ l, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--card-bg)",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        gap: 12,
        padding: 12,
        cursor: "pointer",
        border: "1px solid var(--sand)",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: 12,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#C9BDA8",
          flexShrink: 0,
          backgroundImage: `url('${l.photo}')`,
          position: "relative",
        }}
      >
        {l.top && (
          <span style={{ position:"absolute", top:5, left:5, background:"var(--orange)", color:"#fff", fontSize:8, fontWeight:700, padding:"2px 6px", borderRadius:6 }}>
            TOP
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.type}</div>
        <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:800, fontSize:16, color:"var(--orange)" }}>{l.price}</div>
        <div style={{ fontSize:11, color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:3 }}>
          <i className="ti ti-map-pin" style={{ fontSize:11, flexShrink:0 }}></i>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>{l.addr}</span>
        </div>
        <div style={{ display:"flex", gap:8, fontSize:11, color:"var(--text2)" }}>
          <span><i className="ti ti-bed" style={{ color:"var(--orange)", opacity:0.7 }}></i> {l.rooms}</span>
          <span><i className="ti ti-ruler-2" style={{ color:"var(--orange)", opacity:0.7 }}></i> {l.area}m²</span>
          <span><i className="ti ti-stairs" style={{ color:"var(--orange)", opacity:0.7 }}></i> {l.floor}</span>
        </div>
      </div>
    </div>
  );
}

export default function MobileHome({ listings = [], count = 0 }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  /* Qidiruv holatlari */
  const [query, setQuery]       = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef(null);
  const overlayInputRef = useRef(null);

  /* Region holatlari */
  const [selectedRegion, setSelectedRegion] = useState("Toshkent");
  const [regionOpen, setRegionOpen] = useState(false);

  /* Preferences holatlari */
  const [recentSearches, setRecentSearches] = useState([]);
  const [recommended, setRecommended]       = useState([]);

  // Filtrlab olingan e'lonlar
  const regionListings = useMemo(() => {
    return listings.filter((l) => {
      if (selectedRegion === "Toshkent") return true;
      return l.addr?.toLowerCase().includes(selectedRegion.toLowerCase());
    });
  }, [listings, selectedRegion]);

  /* Preference'larni yuklash */
  const loadPrefs = useCallback(() => {
    setRecentSearches(getRecentSearches());
    if (regionListings.length > 0) {
      setRecommended(scoreListings(regionListings).slice(0, 8));
    } else {
      setRecommended([]);
    }
  }, [regionListings]);

  useEffect(() => {
    const saved = localStorage.getItem("joy-region");
    if (saved) {
      setSelectedRegion(saved);
    }
  }, []);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const handleSelectRegion = (r) => {
    setSelectedRegion(r);
    localStorage.setItem("joy-region", r);
    setRegionOpen(false);
  };

  /* Qidiruvni topish (overlay qidiruv qismi uchun) */
  const filtered = query.trim()
    ? regionListings.filter((l) => {
        const q = query.toLowerCase();
        return (
          l.type?.toLowerCase().includes(q) ||
          l.addr?.toLowerCase().includes(q) ||
          l.cat?.toLowerCase().includes(q) ||
          l.price?.toLowerCase().includes(q)
        );
      })
    : [];

  /* Bosh sahifadagi qidiruv natijalarini filtrlaymiz */
  const searchResults = urlQuery.trim()
    ? regionListings.filter((l) => {
        const q = urlQuery.toLowerCase();
        return (
          l.type?.toLowerCase().includes(q) ||
          l.addr?.toLowerCase().includes(q) ||
          l.cat?.toLowerCase().includes(q) ||
          l.price?.toLowerCase().includes(q)
        );
      })
    : [];

  /* Qidiruvni yuborish */
  const handleSearch = (q) => {
    const term = (q || query).trim();
    if (term) {
      saveSearch(term);
      loadPrefs();
      router.push(`/?q=${encodeURIComponent(term)}`);
    }
    setSearchOpen(false);
    setQuery("");
  };

  /* Overlay ochish */
  const openSearch = () => {
    loadPrefs();
    setSearchOpen(true);
    setTimeout(() => overlayInputRef.current?.focus(), 80);
  };

  /* Overlay yopish */
  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const featured = regionListings[0];
  const rest = regionListings.slice(1, 4);

  /* Rekommendatsiya bo'limi bor-yo'qligini aniqlash */
  const hasRecs = recommended.length > 0;

  return (
    <div className="mobile-only" style={{ background: "var(--cream, #FBF7F3)", minHeight: "100vh", paddingBottom: 90 }}>

      {/* ====== TOP BAR ====== */}
      <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          onClick={() => setRegionOpen(true)}
          style={{ textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Sizning hududingiz</div>
          <div style={{ fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {selectedRegion}, UZ
            <i className="ti ti-chevron-down" style={{ fontSize: 14, position: "absolute", right: -18, top: "50%", transform: "translateY(-50%)" }}></i>
          </div>
        </div>
      </div>

      {/* ====== SEARCH BAR (dekorativ — overlay ochadi) ====== */}
      <div
        onClick={openSearch}
        style={{
          margin: "10px 16px 8px",
          background: "var(--card-bg, #fff)",
          border: ".5px solid var(--sand)",
          borderRadius: 16,
          padding: "13px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "text",
        }}
      >
        <i className="ti ti-search" style={{ fontSize: 18, color: urlQuery ? "var(--orange)" : "var(--muted)", flexShrink: 0 }}></i>
        <span style={{ flex: 1, fontSize: 14, color: urlQuery ? "var(--ink)" : "var(--muted)", fontWeight: urlQuery ? 500 : 400 }}>
          {urlQuery || "Hudud, tur yoki manzil..."}
        </span>
        {urlQuery && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/");
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 16 }}></i>
          </button>
        )}
        {recentSearches.length > 0 && !urlQuery && (
          <span style={{ fontSize: 10, color: "var(--orange)", fontWeight: 600, background: "var(--orange-tint)", padding: "2px 8px", borderRadius: 10 }}>
            {recentSearches.length} ta
          </span>
        )}
        <i className="ti ti-adjustments-horizontal" style={{ fontSize: 18, paddingLeft: 8, borderLeft: "1px solid var(--sand)", color: "var(--muted)" }}></i>
      </div>

      {urlQuery ? (
        /* QIDIRUV NATIJALARI VIEW */
        <div style={{ padding: "8px 16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>Qidiruv natijalari</h2>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                &quot;{urlQuery}&quot; bo&apos;yicha {searchResults.length} ta e&apos;lon topildi
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              style={{ background: "none", border: "none", color: "var(--orange-dark)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Tozalash
            </button>
          </div>

          {/* Xaritada ko'rish tugmasi (listings/map sahifasiga o'tkazadi) */}
          {searchResults.length > 0 && (
            <button
              onClick={() => router.push(`/listings?q=${encodeURIComponent(urlQuery)}&view=map`)}
              style={{
                width: "100%",
                background: "var(--orange-tint)",
                border: "1.5px solid var(--orange)",
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: "var(--orange-dark)",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 16,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(242, 89, 31, 0.08)",
              }}
            >
              <i className="ti ti-map-2" style={{ fontSize: 16 }}></i>
              Ushbu natijalarni xaritada ko&apos;rish
            </button>
          )}

          {searchResults.length > 0 ? (
            searchResults.map((l) => (
              <MiniCard
                key={l.id}
                l={l}
                onClick={() => router.push(`/property/${l.id}`)}
              />
            ))
          ) : (
            <div style={{ padding: "48px 16px", background: "var(--card-bg)", borderRadius: 24, textAlign: "center", border: ".5px solid var(--sand)", marginTop: 10 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--orange-tint)", color: "var(--orange)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <i className="ti ti-search-off" style={{ fontSize: 28 }}></i>
              </div>
              <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "var(--ink)" }}>Hech narsa topilmadi</h3>
              <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 16px" }}>
                Boshqa kalit so&apos;zlar bilan qidirib ko&apos;ring yoki filtrlang.
              </p>
              <button
                onClick={() => router.push("/")}
                style={{ background: "var(--orange)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Bosh sahifaga qaytish
              </button>
            </div>
          )}
        </div>
      ) : (
        /* NORMAL HOME CONTENT */
        <>
          {/* ====== KATEGORIYALAR ====== */}
          <div style={{ display: "flex", justifyContent: "space-around", padding: "12px 12px 16px" }}>
            {CATS.map((c) => (
              <Link
                key={c.k}
                href={`/listings?cat=${encodeURIComponent(c.k)}`}
                onClick={() => trackCategory(c.k)}
                style={{ textAlign: "center", width: 74, textDecoration: "none", color: "inherit" }}
              >
                <div style={{ width: 58, height: 58, margin: "0 auto 6px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: c.bg, color: c.fg }}>
                  <i className={`ti ${c.i}`} style={{ fontSize: 25 }}></i>
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.2, fontWeight: 500 }}>{c.k}</div>
              </Link>
            ))}
          </div>

          {/* ====== ASOSIY KONTENT ====== */}
          {!featured && rest.length === 0 ? (
            <div style={{ margin: "24px 16px", padding: "32px 16px", background: "var(--card-bg)", borderRadius: 24, textAlign: "center", border: ".5px solid var(--sand)" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--orange-tint)", color: "var(--orange)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <i className="ti ti-search-off" style={{ fontSize: 28 }}></i>
              </div>
              <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "var(--ink)" }}>
                {selectedRegion !== "Toshkent" ? "E'lonlar mavjud emas" : "E'lonlar topilmadi"}
              </h3>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 20px" }}>
                {selectedRegion !== "Toshkent"
                  ? `Hozircha ${selectedRegion} hududida e'lonlar kiritilmagan.`
                  : "Hozircha e'lonlar mavjud emas. Sahifani qayta yuklang."}
              </p>
              {selectedRegion !== "Toshkent" ? (
                <button
                  onClick={() => handleSelectRegion("Toshkent")}
                  style={{ background: "var(--orange)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  Toshkentga qaytish
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  style={{ background: "var(--orange)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  <i className="ti ti-refresh" style={{ fontSize: 15 }}></i> Qayta yuklash
                </button>
              )}
            </div>
          ) : (
            <>
              {/* SIZ UCHUN TAVSIYALAR (agar preferences bo'lsa) */}
              {hasRecs && (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px 10px" }}>
                    <div>
                      <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>Siz uchun</h2>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Qiziqishlaringiz asosida</div>
                    </div>
                    <Link href="/listings" style={{ fontSize: 12, color: "var(--orange-dark)", border: ".5px solid #F0997B", borderRadius: 20, padding: "5px 12px", fontWeight: 500, textDecoration: "none" }}>
                      Hammasi
                    </Link>
                  </div>
                  <div style={{ padding: "0 16px" }}>
                    {recommended.slice(0, 3).map((l) => (
                      <MiniCard
                        key={l.id}
                        l={l}
                        onClick={() => router.push(`/property/${l.id}`)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* SOTUVGA TAVSIYALAR — Featured */}
              {featured && (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px 12px" }}>
                    <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>
                      {hasRecs ? "Ko'p ko'rilgan" : "Sotuvga tavsiyalar"}
                    </h2>
                    <Link href="/listings" style={{ fontSize: 12, color: "var(--orange-dark)", border: ".5px solid #F0997B", borderRadius: 20, padding: "5px 12px", fontWeight: 500, textDecoration: "none" }}>
                      Hammasi
                    </Link>
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
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{featured.addr}</div>
                        </div>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--orange-tint)", color: "var(--orange)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                          <i className="ti ti-arrow-up-right"></i>
                        </div>
                      </div>
                      <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 22, fontWeight: 700, color: "var(--orange)", margin: "12px 0 8px" }}>{featured.price}</div>
                      {featured.priceStatus === "cheap" && (
                        <span style={{ background:"rgba(34,197,94,0.1)", color:"#16a34a", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:10, display:"inline-flex", alignItems:"center", gap:3 }}>
                          <i className="ti ti-trending-down"></i> {Math.abs(featured.priceDiffPercent)}% arzonroq
                        </span>
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        {[
                          { icon:"ti-bed", val:`${featured.rooms} xona` },
                          { icon:"ti-bath", val:`${featured.baths} hammom` },
                          { icon:"ti-stairs", val:featured.floor },
                        ].map((s, i) => (
                          <div key={i} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, border:".5px solid var(--sand)", borderRadius:20, padding:"7px 0", fontSize:11, color:"var(--text2)" }}>
                            <i className={`ti ${s.icon}`} style={{ fontSize:14 }}></i>{s.val}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* YANGI E'LONLAR */}
              {rest.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px 12px" }}>
                    <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>Yangi e&apos;lonlar</h2>
                    <Link href="/listings" style={{ fontSize:12, color:"var(--orange-dark)", border:".5px solid #F0997B", borderRadius:20, padding:"5px 12px", fontWeight:500, textDecoration: "none" }}>
                      Hammasi
                    </Link>
                  </div>
                  <div style={{ padding: "0 16px" }}>
                    {rest.map((l) => (
                      <MiniCard
                        key={l.id}
                        l={l}
                        onClick={() => router.push(`/property/${l.id}`)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ====== SEARCH OVERLAY ====== */}
      {searchOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "var(--cream, #FBF7F3)",
            display: "flex",
            flexDirection: "column",
            animation: "pageIn 0.18s ease both",
          }}
        >
          {/* Overlay tepasi — input */}
          <div style={{ padding: "12px 16px", background: "var(--card-bg)", borderBottom: "1px solid var(--sand)", display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={closeSearch}
              style={{ background: "none", border: "none", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink)", flexShrink: 0 }}
            >
              <i className="ti ti-arrow-left" style={{ fontSize: 20 }}></i>
            </button>
            <div style={{ flex:1, background:"var(--cream)", border:"1.5px solid var(--orange)", borderRadius:14, padding:"0 14px", display:"flex", alignItems:"center", gap:8, boxShadow:"0 0 0 3px var(--orange-tint)" }}>
              <i className="ti ti-search" style={{ fontSize:17, color:"var(--orange)", flexShrink:0 }}></i>
              <input
                ref={overlayInputRef}
                type="text"
                placeholder="Hudud, tur yoki manzil..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                  if (e.key === "Escape") closeSearch();
                }}
                style={{ flex:1, border:"none", outline:"none", fontSize:14, background:"none", color:"var(--ink)", padding:"12px 0", fontFamily:"inherit" }}
              />
              {query && (
                <button onClick={() => setQuery("")} style={{ background:"none", border:"none", padding:4, cursor:"pointer", color:"var(--muted)", display:"flex" }}>
                  <i className="ti ti-x" style={{ fontSize:16 }}></i>
                </button>
              )}
            </div>
            {query && (
              <button
                onClick={() => handleSearch()}
                style={{ background:"var(--orange)", border:"none", borderRadius:12, padding:"10px 16px", cursor:"pointer", color:"#fff", fontSize:13, fontWeight:600, flexShrink:0 }}
              >
                Qidirish
              </button>
            )}
          </div>

          {/* Overlay body */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 100px" }}>

            {/* Qidiruv natijalari */}
            {query.trim() ? (
              <>
                <div style={{ fontSize:13, color:"var(--muted)", marginBottom:12 }}>
                  {filtered.length > 0
                    ? `${filtered.length} ta natija topildi`
                    : "Hech narsa topilmadi"}
                </div>
                {filtered.map((l) => (
                  <MiniCard
                    key={l.id}
                    l={l}
                    onClick={() => { handleSearch(query); router.push(`/property/${l.id}`); }}
                  />
                ))}
                {filtered.length === 0 && (
                  <div style={{ textAlign:"center", padding:"32px 0", color:"var(--muted)" }}>
                    <i className="ti ti-search-off" style={{ fontSize:48, display:"block", marginBottom:12, opacity:0.4 }}></i>
                    <div style={{ fontSize:14 }}>
                      &quot;{query}&quot; bo&apos;yicha natija yo&apos;q
                    </div>
                    <div style={{ fontSize:12, marginTop:6 }}>Boshqa so&apos;z bilan urinib ko&apos;ring</div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Oxirgi qidiruvlar */}
                {recentSearches.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>Oxirgi qidiruvlar</span>
                      <button
                        onClick={() => { clearAllSearches(); setRecentSearches([]); }}
                        style={{ background:"none", border:"none", fontSize:12, color:"var(--muted)", cursor:"pointer" }}
                      >
                        Tozalash
                      </button>
                    </div>
                    {recentSearches.map((s) => (
                      <div
                        key={s.q}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid var(--sand)" }}
                      >
                        <i className="ti ti-history" style={{ fontSize:16, color:"var(--muted)", flexShrink:0 }}></i>
                        <span
                          onClick={() => setQuery(s.q)}
                          style={{ flex:1, fontSize:14, color:"var(--ink)", cursor:"pointer" }}
                        >{s.q}</span>
                        <button
                          onClick={() => { removeSearch(s.q); setRecentSearches(getRecentSearches()); }}
                          style={{ background:"none", border:"none", padding:4, cursor:"pointer", color:"var(--muted)" }}
                        >
                          <i className="ti ti-x" style={{ fontSize:14 }}></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tavsiya etilgan qidiruvlar */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:10 }}>Tezkor qidiruvlar</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {["Kvartira", "Yangi bino", "Ijara", "Chilonzor", "2 xonali", "Mirzo Ulug'bek"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setQuery(tag)}
                        style={{ background:"var(--card-bg)", border:"1px solid var(--sand)", borderRadius:20, padding:"7px 14px", fontSize:13, cursor:"pointer", color:"var(--ink)", fontFamily:"inherit" }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Siz uchun tavsiyalar */}
                {hasRecs && (
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:10 }}>
                      Siz uchun tavsiyalar
                      <span style={{ fontSize:11, color:"var(--muted)", fontWeight:400, marginLeft:6 }}>qiziqishlaringiz asosida</span>
                    </div>
                    {recommended.slice(0, 5).map((l) => (
                      <MiniCard
                        key={l.id}
                        l={l}
                        onClick={() => { setSearchOpen(false); router.push(`/property/${l.id}`); }}
                      />
                    ))}
                  </div>
                )}

                {/* Yangi e'lonlar (agar tavsiya yo'q bo'lsa) */}
                {!hasRecs && regionListings.length > 0 && (
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:10 }}>So'nggi e&apos;lonlar</div>
                    {regionListings.slice(0, 5).map((l) => (
                      <MiniCard
                        key={l.id}
                        l={l}
                        onClick={() => { setSearchOpen(false); router.push(`/property/${l.id}`); }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ====== REGION SELECTOR MODAL ====== */}
      {regionOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 350,
            background: "rgba(26,19,14,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => setRegionOpen(false)}
        >
          <div
            style={{
              width: "100%",
              background: "var(--cream, #FBF7F3)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: "24px 20px 40px",
              boxShadow: "0 -10px 30px rgba(0,0,0,0.15)",
              animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>
                Hududni tanlang
              </h3>
              <button
                onClick={() => setRegionOpen(false)}
                style={{ background: "none", border: "none", padding: 6, cursor: "pointer", color: "var(--muted)" }}
              >
                <i className="ti ti-x" style={{ fontSize: 20 }}></i>
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Toshkent",
                "Samarqand",
                "Buxoro",
                "Andijon",
                "Farg'ona",
                "Namangan",
                "Navoiy",
                "Qashqadaryo",
                "Surxondaryo",
                "Jizzax",
                "Sirdaryo",
                "Xorazm",
                "Qoraqalpog'iston"
              ].map((r) => {
                const active = r === selectedRegion;
                return (
                  <button
                    key={r}
                    onClick={() => handleSelectRegion(r)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: active ? "1.5px solid var(--orange)" : "1px solid var(--sand)",
                      background: active ? "var(--orange-tint)" : "var(--card-bg)",
                      color: active ? "var(--orange-dark)" : "var(--ink)",
                      fontSize: 14,
                      fontWeight: active ? 600 : 500,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{r}</span>
                    {active ? (
                      <i className="ti ti-check" style={{ fontSize: 16 }}></i>
                    ) : (
                      <i className="ti ti-chevron-right" style={{ fontSize: 14, color: "var(--muted)" }}></i>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
