"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Nav, ListingCard } from "@/components/ui";

const tabs = [
  { key: "Yangi uylar", icon: "ti-building-skyscraper" },
  { key: "Ikkilamchi", icon: "ti-home" },
  { key: "Ijara", icon: "ti-key" },
  { key: "Ofis", icon: "ti-briefcase" },
];

export default function ListingsClient({ initialListings, favoriteIds = [] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URL-dagi toifani dastlabki holat qilib olamiz
  const urlCat = searchParams.get("cat");
  const [active, setActive] = useState(urlCat || "Yangi uylar");
  const [activePin, setActivePin] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);

  // Saralash holatlari
  const [sortBy, setSortBy] = useState("recommended"); // recommended, price-asc, price-desc, area-desc
  const [sortOpen, setSortOpen] = useState(false);

  // Filtr holatlari
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [roomsFilter, setRoomsFilter] = useState("all"); // all, 1, 2, 3, 4 (4+ uchun)

  // Qo'llanilgan filtrlar (state)
  const [appliedMinPrice, setAppliedMinPrice] = useState("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");
  const [appliedRoomsFilter, setAppliedRoomsFilter] = useState("all");

  // URL-dagi toifa o'zgarsa, tabni ham o'zgartiramiz
  useEffect(() => {
    if (urlCat) {
      setActive(urlCat);
    }
  }, [urlCat]);

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
    setFilterOpen(false);
  };

  // 1. Toifa va filtr bo'yicha e'lonlarni saralaymiz
  const filtered = initialListings.filter((l) => {
    // A. Toifa filtri
    if (l.cat !== active) return false;

    // B. Min narx filtri
    if (appliedMinPrice && l.priceNum < parseInt(appliedMinPrice)) return false;

    // C. Max narx filtri
    if (appliedMaxPrice && l.priceNum > parseInt(appliedMaxPrice)) return false;

    // D. Xona filtri
    if (appliedRoomsFilter !== "all") {
      const r = parseInt(appliedRoomsFilter);
      if (r === 4) {
        if (l.rooms < 4) return false;
      } else {
        if (l.rooms !== r) return false;
      }
    }

    return true;
  });

  // 2. Saralash bo'yicha tartiblaymiz
  const shown = [...filtered].sort((a, b) => {
    if (sortBy === "price-asc") return a.priceNum - b.priceNum;
    if (sortBy === "price-desc") return b.priceNum - a.priceNum;
    if (sortBy === "area-desc") return b.area - a.area;
    return 0; // default / recommended
  });

  const searchQuery = searchParams.get("q");

  const getSortLabel = () => {
    if (sortBy === "price-asc") return "Arzonroq birinchi";
    if (sortBy === "price-desc") return "Qimmatroq birinchi";
    if (sortBy === "area-desc") return "Kattaroq maydon";
    return "Tavsiya etilgan";
  };

  return (
    <>
      <Nav />
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
          {(appliedMinPrice || appliedMaxPrice || appliedRoomsFilter !== "all") && (
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

      <div className="split">
        <div className="split-list">
          <div className="split-meta" style={{ position: "relative" }}>
            <h1 className="display">
              Toshkent · <span className="count">{shown.length} ta e'lon</span>
            </h1>
            
            {/* Saralash Dropdown */}
            <div style={{ position: "relative" }}>
              <div 
                style={{ fontSize: 13, color: "var(--text2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                onClick={() => setSortOpen(!sortOpen)}
              >
                Saralash: <strong>{getSortLabel()}</strong> <i className="ti ti-chevron-down" style={{ fontSize: 12 }}></i>
              </div>
              {sortOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  background: "#fff",
                  border: "1px solid var(--sand)",
                  borderRadius: 12,
                  boxShadow: "0 10px 25px rgba(26,19,14,0.1)",
                  padding: 6,
                  zIndex: 20,
                  width: 170,
                  marginTop: 6
                }}>
                  {[
                    { key: "recommended", label: "Tavsiya etilgan" },
                    { key: "price-asc", label: "Arzonroq birinchi" },
                    { key: "price-desc", label: "Qimmatroq birinchi" },
                    { key: "area-desc", label: "Kattaroq maydon" }
                  ].map(opt => (
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
              background: '#fff',
              borderRadius: 20,
              border: '1.5px dashed var(--sand)',
              marginTop: 20
            }}>
              <i className="ti ti-search-off" style={{ fontSize: 48, color: 'var(--muted)', display: 'block', marginBottom: 16 }}></i>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>E'lonlar topilmadi</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, maxWidth: 300, margin: '0 auto' }}>
                Kiritilgan filtrlar bo'yicha hozircha e'lonlar mavjud emas. Filtrlarni o'zgartirib ko'ring.
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
            <div className="split-grid">
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
          )}
        </div>

        <div className="mapwrap">
          <div className="map-roads"></div>
          {shown.map((l, i) => (
            <div
              key={l.id}
              className={"pin" + (activePin === i ? " active" : "")}
              style={{
                left: l.pinX ?? 100,
                top: l.pinY ?? 100,
                transform: activePin === i ? "scale(1.15)" : "scale(1)",
                transition: "transform 0.2s ease, background 0.2s ease"
              }}
              onClick={() => setActivePin(i)}
            >
              ${Math.round(l.priceNum / 1000)}k
            </div>
          ))}
        </div>
      </div>

      {/* 3. Filtr Slayd-Paneli (Drawer Modal) */}
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
              background: "#fff",
              height: "100%",
              padding: 30,
              display: "flex",
              flexDirection: "column",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
              borderLeft: "1px solid var(--sand)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
              <h2 className="display" style={{ fontSize: 22 }}>Filtrlar</h2>
              <button 
                onClick={() => setFilterOpen(false)}
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer" }}
              >
                <i className="ti ti-x"></i>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {/* Narx oralig'i */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 8 }}>Narx oralig'i (USD)</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid var(--sand)", outline: "none", fontSize: 14 }}
                  />
                  <span style={{ color: "var(--muted)" }}>-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid var(--sand)", outline: "none", fontSize: 14 }}
                  />
                </div>
              </div>

              {/* Xonalar soni */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 8 }}>Xonalar soni</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {["all", "1", "2", "3", "4"].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRoomsFilter(val)}
                      style={{
                        padding: "10px 0",
                        borderRadius: 10,
                        border: "1px solid",
                        borderColor: roomsFilter === val ? "var(--orange)" : "var(--sand)",
                        background: roomsFilter === val ? "var(--orange-tint)" : "#fff",
                        color: roomsFilter === val ? "var(--orange-dark)" : "inherit",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {val === "all" ? "Barchasi" : val === "4" ? "4+" : val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pastki tugmalar */}
            <div style={{ display: "flex", gap: 10, borderTop: "1px solid var(--sand)", paddingTop: 20 }}>
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
                Qo'llash
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
