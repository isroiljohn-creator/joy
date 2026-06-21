"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Nav, ListingCard } from "@/components/ui";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div style={{
      position: "absolute",
      inset: 0,
      background: "#FFF7F2",
      color: "#E06334",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      fontWeight: "bold",
      fontFamily: "sans-serif",
      fontSize: "14px",
      border: "2px dashed var(--orange)"
    }}>
      <i className="ti ti-loader animate-spin" style={{ marginRight: 6 }}></i>
      Loading map module...
    </div>
  )
});

const tabs = [
  { key: "Yangi uylar", icon: "ti-building-skyscraper" },
  { key: "Ikkilamchi", icon: "ti-home" },
  { key: "Ijara", icon: "ti-key" },
  { key: "Ofis", icon: "ti-briefcase" },
];

const SORT_OPTIONS = [
  { key: "recommended", label: "Tavsiya etilgan" },
  { key: "price-asc", label: "Arzonroq birinchi" },
  { key: "price-desc", label: "Qimmatroq birinchi" },
  { key: "area-desc", label: "Kattaroq maydon" },
];

const DISTRICT_COORDS = {
  "Chilonzor": [41.2858, 69.2052],
  "Yunusobod": [41.3436, 69.2878],
  "Mirzo Ulug'bek": [41.3106, 69.3388],
  "Yakkasaroy": [41.2915, 69.2763],
  "Shayxontohur": [41.3232, 69.2398],
  "Sergeli": [41.2275, 69.2873],
  "Uchtepa": [41.3048, 69.1978],
  "Bektemir": [41.2206, 69.3291],
  "Mirabad": [41.3028, 69.2715],
  "Olmazor": [41.3388, 69.2105],
  "Yashnobod": [41.3220, 69.3108]
};

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function getListingCoords(addr) {
  let address = "";
  if (addr != null) {
    address = String(addr).toLowerCase();
  }
  for (const [district, coords] of Object.entries(DISTRICT_COORDS)) {
    if (address.includes(district.toLowerCase())) {
      const hash = hashCode(address);
      const offsetX = ((Math.abs(hash % 100) / 100) - 0.5) * 0.012;
      const offsetY = ((Math.abs((hash >> 2) % 100) / 100) - 0.5) * 0.015;
      return [coords[0] + offsetX, coords[1] + offsetY];
    }
  }
  const hash = hashCode(address || "Toshkent");
  const offsetX = ((Math.abs(hash % 100) / 100) - 0.5) * 0.06;
  const offsetY = ((Math.abs((hash >> 2) % 100) / 100) - 0.5) * 0.08;
  return [41.2995 + offsetX, 69.2401 + offsetY];
}

function isPointInPolygon(point, polygon) {
  const x = point.lat;
  const y = point.lng;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi + 0.00000001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function ListingsClient({ initialListings, favoriteIds = [] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL-dagi toifani dastlabki holat qilib olamiz
  const urlCat = searchParams.get("cat");
  const viewParam = searchParams.get("view");
  const [active, setActive] = useState(urlCat || "Yangi uylar");
  const [activePin, setActivePin] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);

  // Client hydration check and mobile view check
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1080);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Saralash holatlari
  const [sortBy, setSortBy] = useState("recommended");
  const [sortOpen, setSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState(viewParam === "map" ? "map" : "list"); // list or map
  const sortRef = useRef(null);

  // Filtr holatlari
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [roomsFilter, setRoomsFilter] = useState("all");

  // Qo'llanilgan filtrlar (state)
  const [appliedMinPrice, setAppliedMinPrice] = useState("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");
  const [appliedRoomsFilter, setAppliedRoomsFilter] = useState("all");

  // Xaritada chizilgan polygon filtri
  const [polygonFilter, setPolygonFilter] = useState(null);

  // URL-dagi toifa o'zgarsa, tabni ham o'zgartiramiz
  useEffect(() => {
    if (urlCat) {
      setActive(urlCat);
    }
  }, [urlCat]);

  // URL-dagi viewParam o'zgarsa, xarita yoki ro'yxat rejimiga o'tamiz
  useEffect(() => {
    if (viewParam === "map") {
      setViewMode("map");
    } else {
      setViewMode("list");
    }
  }, [viewParam]);

  // Sort dropdown tashqarisiga bosilganda yopish
  useEffect(() => {
    function handleClickOutside(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    }
    if (sortOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [sortOpen]);

  // Filtr qo'llash funksiyasi
  const handleApplyFilters = () => {
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setAppliedRoomsFilter(roomsFilter);
    setFilterOpen(false);
  };

  // Filtrlarni tozalash
  const handleClearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setRoomsFilter("all");
    setAppliedMinPrice("");
    setAppliedMaxPrice("");
    setAppliedRoomsFilter("all");
    setPolygonFilter(null);
    setFilterOpen(false);
  };

  // 1. Toifa va filtr bo'yicha e'lonlarni saralaymiz
  const filtered = initialListings.filter((l) => {
    if (l.cat !== active) return false;
    if (appliedMinPrice && l.priceNum < parseInt(appliedMinPrice)) return false;
    if (appliedMaxPrice && l.priceNum > parseInt(appliedMaxPrice)) return false;
    if (appliedRoomsFilter !== "all") {
      const r = parseInt(appliedRoomsFilter);
      if (r === 4) {
        if (l.rooms < 4) return false;
      } else {
        if (l.rooms !== r) return false;
      }
    }
    // Xaritada chizilgan polygon bo'yicha filtrlash
    if (polygonFilter && polygonFilter.length > 2) {
      const coords = getListingCoords(l.addr);
      const inside = isPointInPolygon({ lat: coords[0], lng: coords[1] }, polygonFilter);
      if (!inside) return false;
    }
    return true;
  });

  // 2. Saralash bo'yicha tartiblaymiz
  const shown = [...filtered].sort((a, b) => {
    if (sortBy === "price-asc") return a.priceNum - b.priceNum;
    if (sortBy === "price-desc") return b.priceNum - a.priceNum;
    if (sortBy === "area-desc") return b.area - a.area;
    return 0;
  });

  const searchQuery = searchParams.get("q");

  const getSortLabel = () => {
    const opt = SORT_OPTIONS.find((o) => o.key === sortBy);
    return opt ? opt.label : "Tavsiya etilgan";
  };

  const hasActiveFilters = appliedMinPrice || appliedMaxPrice || appliedRoomsFilter !== "all";

  return (
    <>
      <Nav />

      {/* Desktop tabs row — mobilda yashirilgan */}
      <div className="tabs-row">
        {tabs.map((t) => (
          <div
            key={t.key}
            className={"ftab" + (active === t.key ? " on" : "")}
            onClick={() => {
              setActive(t.key);
              const params = new URLSearchParams(searchParams.toString());
              params.set("cat", t.key);
              router.push(`/listings?${params.toString()}`);
            }}
          >
            <i className={`ti ${t.icon}`}></i> {t.key}
          </div>
        ))}
        <div className="filters-btn" onClick={() => setFilterOpen(true)}>
          <i className="ti ti-adjustments-horizontal"></i> Filtrlar
          {hasActiveFilters && (
            <span style={{
              background: "var(--orange)",
              color: "#fff",
              width: 18,
              height: 18,
              borderRadius: "50%",
              fontSize: 10,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 6,
              fontWeight: 700
            }}>!</span>
          )}
        </div>
      </div>

      <div className={`split ${viewMode === "map" ? "show-map" : "show-list"}`}>
        <div className="split-list">
          {/* Mobile Map Preview — tepada kichik haqiqiy xarita ko'rinishi */}
          <div
            className="mobile-only mobile-map-container"
            onClick={() => setViewMode("map")}
            style={{ position: "relative", cursor: "pointer", overflow: "hidden" }}
          >
            {/* Haqiqiy mini xarita */}
            {mounted && (
              <Map
                listings={shown}
                activePin={null}
                onPinClick={null}
                mini={true}
                polygonPoints={polygonFilter}
              />
            )}
            
            {/* Klik to'suvchi mutlaq shaffof qatlam */}
            <div style={{
              position: "absolute",
              inset: 0,
              zIndex: 1000,
              cursor: "pointer",
              background: "rgba(0,0,0,0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {/* Xaritada ko'rish tugmasi */}
              <div style={{
                background: "var(--ink)",
                color: "var(--cream)",
                padding: "9px 18px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                pointerEvents: "none",
                border: "1.5px solid rgba(255,255,255,0.15)"
              }}>
                <i className="ti ti-map-2" style={{ fontSize: 15, color: "var(--orange)" }}></i>
                Xaritada ko&apos;rish · {shown.length} ta
              </div>
            </div>
          </div>

          {polygonFilter && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--orange-tint)",
              color: "var(--orange-dark)",
              padding: "10px 16px",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
              border: "1px solid var(--orange)"
            }}>
              <i className="ti ti-brush" style={{ fontSize: 16 }}></i>
              <span>Xaritada chizilgan hudud bo&apos;yicha filtrlandi</span>
              <button
                type="button"
                onClick={() => setPolygonFilter(null)}
                style={{
                  background: "var(--orange)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginLeft: "auto"
                }}
              >
                Filtrni tozalash
              </button>
            </div>
          )}

          {/* Listings header: Toshkent • X ta e'lon / Saralash */}
          <div className="split-meta" style={{ position: "relative" }}>
            <div>
              <h1 className="display">
                Toshkent <span style={{ color: "var(--muted)", fontWeight: 400 }}>•</span>{" "}
                <span className="count">{shown.length} ta e&apos;lon</span>
              </h1>
              {searchQuery && (
                <div style={{ fontSize: 14, color: "var(--orange-dark)", marginTop: 4, fontWeight: 500 }}>
                  <i className="ti ti-search" style={{ fontSize: 14 }}></i> Qidiruv: &apos;{searchQuery}&apos;
                </div>
              )}
            </div>

            {/* Saralash tugmasi — mobilda filterni, desktopda sortni ochadi */}
            <div style={{ position: "relative" }} ref={sortRef}>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text2)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 0",
                  userSelect: "none",
                }}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth <= 880) {
                    setFilterOpen(true);
                  } else {
                    setSortOpen(!sortOpen);
                  }
                }}
              >
                <span style={{ color: "var(--muted)" }}>Saralash:</span>{" "}
                <strong style={{ color: "var(--ink)" }}>{getSortLabel()}</strong>{" "}
                <i className="ti ti-chevron-down" style={{ fontSize: 12, color: "var(--muted)" }}></i>
              </div>
              {sortOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  background: "var(--card-bg)",
                  border: "1px solid var(--sand)",
                  borderRadius: 12,
                  boxShadow: "0 10px 25px rgba(26,19,14,0.1)",
                  padding: 6,
                  zIndex: 20,
                  width: 180,
                  marginTop: 6
                }}>
                  {SORT_OPTIONS.map(opt => (
                    <div
                      key={opt.key}
                      style={{
                        padding: "8px 12px",
                        fontSize: 13,
                        cursor: "pointer",
                        borderRadius: 8,
                        background: sortBy === opt.key ? "var(--orange-tint)" : "none",
                        color: sortBy === opt.key ? "var(--orange-dark)" : "inherit",
                        fontWeight: sortBy === opt.key ? 600 : 400
                      }}
                      onClick={() => {
                        setSortBy(opt.key);
                        setSortOpen(false);
                      }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="empty-state" style={{
              textAlign: 'center',
              padding: '64px 20px',
              background: "var(--card-bg)",
              borderRadius: 20,
              border: '1.5px dashed var(--sand)',
              marginTop: 20
            }}>
              <i className="ti ti-search-off" style={{ fontSize: 48, color: 'var(--muted)', display: 'block', marginBottom: 16 }}></i>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>E&apos;lonlar topilmadi</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, maxWidth: 300, margin: '0 auto' }}>
                Kiritilgan filtrlar bo&apos;yicha hozircha e&apos;lonlar mavjud emas. Filtrlarni o&apos;zgartirib ko&apos;ring.
              </p>
              <button
                onClick={handleClearFilters}
                className="btn-ghost"
                style={{ marginTop: 16, cursor: "pointer", padding: "10px 20px" }}
              >
                Filtrlarni tozalash
              </button>
            </div>
          ) : (
            <>
              <div className="split-grid desktop-only">
                {shown.map((l, idx) => (
                  <div
                    key={l.id}
                    onMouseEnter={() => {
                      setHoveredCardId(l.id);
                      setActivePin(idx);
                    }}
                    onMouseLeave={() => {
                      setHoveredCardId(null);
                      setActivePin(null);
                    }}
                    style={{
                      transform: hoveredCardId === l.id ? 'translateY(-4px)' : 'none',
                      transition: 'transform 0.2s ease',
                      borderRadius: 20
                    }}
                  >
                    <ListingCard l={l} isFavorite={favoriteIds.includes(l.id)} />
                  </div>
                ))}
              </div>

              {/* Mobile compact list */}
              <div className="mobile-only" style={{ paddingBottom: 110 }}>
                {shown.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => router.push(`/property/${l.id}`)}
                    style={{
                      background: "var(--card-bg)",
                      borderRadius: 18,
                      overflow: "hidden",
                      margin: "0 0 10px",
                      display: "flex",
                      gap: 12,
                      padding: 12,
                      cursor: "pointer",
                      border: "1px solid var(--sand)",
                    }}
                  >
                    {/* Rasm */}
                    <div style={{
                      width: 90,
                      height: 90,
                      borderRadius: 12,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundColor: "#C9BDA8",
                      flexShrink: 0,
                      position: "relative",
                      backgroundImage: `url('${l.photo}')`,
                    }}>
                      {l.top && (
                        <span style={{
                          position: "absolute",
                          top: 6,
                          left: 6,
                          background: "var(--orange)",
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 6,
                          letterSpacing: "0.03em",
                        }}>TOP</span>
                      )}
                    </div>

                    {/* Matn qismi */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>

                      {/* 1. Tur — birinchi o'qiladi */}
                      <div style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--ink)",
                        lineHeight: 1.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>{l.type}</div>

                      {/* 2. Narx + narx holati — bir qatorda */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                          fontFamily: "'Bricolage Grotesque',sans-serif",
                          fontWeight: 800,
                          fontSize: 17,
                          color: "var(--orange)",
                          lineHeight: 1,
                        }}>{l.price}</span>

                        {l.priceStatus === "cheap" && (
                          <span style={{
                            background: "rgba(34,197,94,0.12)",
                            color: "#15803d",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 20,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                          }}>
                            <i className="ti ti-trending-down" style={{ fontSize: 10 }}></i>
                            {Math.abs(l.priceDiffPercent)}% arzon
                          </span>
                        )}
                        {l.priceStatus === "expensive" && (
                          <span style={{
                            background: "rgba(239,68,68,0.1)",
                            color: "#dc2626",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 20,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                          }}>
                            <i className="ti ti-trending-up" style={{ fontSize: 10 }}></i>
                            {l.priceDiffPercent}% qimmat
                          </span>
                        )}
                      </div>

                      {/* 3. Manzil */}
                      <div style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        <i className="ti ti-map-pin" style={{ fontSize: 11, flexShrink: 0 }}></i>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{l.addr}</span>
                      </div>

                      {/* 4. Xususiyatlar — eng oxirida, ikkinchi darajali */}
                      <div style={{
                        display: "flex",
                        gap: 0,
                        fontSize: 11,
                        color: "var(--text2)",
                        marginTop: 2,
                      }}>
                        {[
                          { icon: "ti-bed", val: `${l.rooms} xona` },
                          { icon: "ti-ruler-2", val: `${l.area}m²` },
                          { icon: "ti-stairs", val: l.floor },
                        ].map((s, i) => (
                          <span key={i} style={{ display: "flex", alignItems: "center", gap: 2, marginRight: 10 }}>
                            <i className={`ti ${s.icon}`} style={{ fontSize: 12, color: "var(--orange)", opacity: 0.7 }}></i>
                            {s.val}
                          </span>
                        ))}
                      </div>

                    </div>
                  </div>
                ))}
              </div>

            </>
          )}
        </div>

        {/* Desktop/Mobile map */}
        <div className="mapwrap" style={{ position: "relative" }}>
          {mounted && (!isMobile || viewMode === "map") && (
            <Map
              listings={shown}
              activePin={activePin}
              onPinClick={(i) => {
                setActivePin(i);
                router.push(`/property/${shown[i]?.id}`);
              }}
              polygonPoints={polygonFilter}
              onPolygonComplete={setPolygonFilter}
            />
          )}
          {/* Mobile fullscreen map uchun orqaga tugmasi */}
          {viewMode === "map" && (
            <button
              className="mobile-only"
              onClick={() => setViewMode("list")}
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                zIndex: 1000,
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--card-bg)",
                border: "1px solid var(--sand)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 20,
                color: "var(--ink)",
              }}
              aria-label="Orqaga qaytish"
            >
              <i className="ti ti-arrow-left"></i>
            </button>
          )}
        </div>
      </div>

      {/* Filtr va Saralash Drawer Modal */}
      {filterOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(26,19,14,0.4)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setFilterOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 380,
              background: "var(--card-bg)",
              height: "100%",
              padding: 30,
              display: "flex",
              flexDirection: "column",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
              borderLeft: "1px solid var(--sand)",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 className="display" style={{ fontSize: 22 }}>Filtr va Saralash</h2>
              <button
                onClick={() => setFilterOpen(false)}
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--ink)" }}
              >
                <i className="ti ti-x"></i>
              </button>
            </div>

            {/* Saralash qismi */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Saralash tartibi
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSortBy(opt.key)}
                    style={{
                      padding: "11px 16px",
                      borderRadius: 12,
                      border: "1.5px solid",
                      borderColor: sortBy === opt.key ? "var(--orange)" : "var(--sand)",
                      background: sortBy === opt.key ? "var(--orange-tint)" : "var(--card-bg)",
                      color: sortBy === opt.key ? "var(--orange-dark)" : "var(--ink)",
                      fontWeight: sortBy === opt.key ? 700 : 500,
                      fontSize: 14,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {opt.label}
                    {sortBy === opt.key && (
                      <i className="ti ti-check" style={{ fontSize: 16, color: "var(--orange)" }}></i>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: "var(--sand)", marginBottom: 24 }}></div>

            {/* Narx oralig'i */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Narx oralig&apos;i (USD)
              </label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1.5px solid var(--sand)",
                    outline: "none",
                    fontSize: 14,
                    background: "var(--card-bg)",
                    color: "var(--ink)",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ color: "var(--muted)", flexShrink: 0 }}>—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1.5px solid var(--sand)",
                    outline: "none",
                    fontSize: 14,
                    background: "var(--card-bg)",
                    color: "var(--ink)",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Xonalar soni */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Xonalar soni
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                {["all", "1", "2", "3", "4"].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRoomsFilter(val)}
                    style={{
                      padding: "11px 0",
                      borderRadius: 10,
                      border: "1.5px solid",
                      borderColor: roomsFilter === val ? "var(--orange)" : "var(--sand)",
                      background: roomsFilter === val ? "var(--orange-tint)" : "var(--card-bg)",
                      color: roomsFilter === val ? "var(--orange-dark)" : "var(--ink)",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {val === "all" ? "Bari" : val === "4" ? "4+" : val}
                  </button>
                ))}
              </div>
            </div>

            {/* Pastki tugmalar */}
            <div style={{ marginTop: "auto", display: "flex", gap: 10, paddingTop: 20, borderTop: "1px solid var(--sand)" }}>
              <button
                onClick={handleClearFilters}
                className="cbtn gh"
                style={{ flex: 1, padding: 14 }}
              >
                Tozalash
              </button>
              <button
                onClick={handleApplyFilters}
                className="cbtn primary"
                style={{ flex: 1, padding: 14, margin: 0 }}
              >
                Qo&apos;llash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating View Toggle Button on Mobile */}
      <button
        onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
        className="view-toggle-btn"
      >
        {viewMode === "list" ? (
          <>
            <i className="ti ti-map"></i> Xarita
          </>
        ) : (
          <>
            <i className="ti ti-list"></i> Ro&apos;yxat
          </>
        )}
      </button>
    </>
  );
}
