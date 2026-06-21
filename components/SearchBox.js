"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CustomSelect } from "@/components/ui";

const TYPES = [
  { key: "Yangi uylar", icon: "ti-building-skyscraper" },
  { key: "Ikkilamchi", icon: "ti-home" },
  { key: "Ijara", icon: "ti-key" },
  { key: "Ofis", icon: "ti-briefcase" },
];

const ROOMS = ["1", "2", "3", "4", "5+"];

const DISTRICTS = [
  "Chilonzor", "Yunusobod", "Mirzo Ulug'bek", "Yakkasaroy",
  "Shayxontohur", "Sergeli", "Uchtepa", "Bektemir",
  "Mirabad", "Olmazor", "Yashnobod",
];

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [shaking, setShaking] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [rooms, setRooms] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [district, setDistrict] = useState("");
  const router = useRouter();
  const inputRef = useRef(null);

  // ESC yopish
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setFilterOpen(false); };
    if (filterOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [filterOpen]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedType) params.set("cat", selectedType);
    if (query.trim()) params.set("q", query.trim());
    if (rooms) params.set("rooms", rooms);
    if (minPrice) params.set("min", minPrice);
    if (maxPrice) params.set("max", maxPrice);
    if (district) params.set("district", district);
    router.push(`/listings?${params.toString()}`);
    setFilterOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearAll = () => {
    setSelectedType("");
    setRooms("");
    setMinPrice("");
    setMaxPrice("");
    setDistrict("");
    setQuery("");
  };

  const activeFilters = [selectedType, rooms, minPrice, maxPrice, district].filter(Boolean).length;

  return (
    <>
      <div className="searchbox">
        <div className="searchrow" style={shaking ? { animation: "shake 0.4s ease" } : undefined}>
          <i className="ti ti-search"></i>
          <input
            ref={inputRef}
            placeholder="Hudud, tuman yoki manzil..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            style={{
              background: activeFilters > 0 ? "var(--orange-tint)" : "transparent",
              border: activeFilters > 0 ? "1.5px solid var(--orange)" : "1.5px solid var(--sand)",
              borderRadius: 12, padding: "6px 14px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              color: activeFilters > 0 ? "var(--orange-dark)" : "var(--text2)",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}
          >
            <i className="ti ti-adjustments-horizontal" style={{ fontSize: 16 }}></i>
            Filtr
            {activeFilters > 0 && (
              <span style={{
                background: "var(--orange)", color: "#fff", width: 18, height: 18,
                borderRadius: "50%", fontSize: 10, fontWeight: 700,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>{activeFilters}</span>
            )}
          </button>
          <button className="go" onClick={handleSearch} aria-label="Qidirish">
            <i className="ti ti-arrow-right"></i>
          </button>
        </div>
      </div>

      {/* Filtr Popup */}
      {filterOpen && (
        <div className="filter-overlay" onClick={() => setFilterOpen(false)}>
          <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
            <h3>
              <span><i className="ti ti-adjustments-horizontal" style={{ marginRight: 8 }}></i>Filtrlar</span>
              <button className="fp-close" onClick={() => setFilterOpen(false)}>
                <i className="ti ti-x"></i>
              </button>
            </h3>

            {/* Uy turi */}
            <div className="fp-section">
              <div className="fp-label">Uy turi</div>
              <div className="fp-chips">
                {TYPES.map((t) => (
                  <div
                    key={t.key}
                    className={"fp-chip" + (selectedType === t.key ? " on" : "")}
                    onClick={() => setSelectedType(selectedType === t.key ? "" : t.key)}
                  >
                    <i className={`ti ${t.icon}`}></i> {t.key}
                  </div>
                ))}
              </div>
            </div>

            {/* Xonalar soni */}
            <div className="fp-section">
              <div className="fp-label">Xonalar soni</div>
              <div className="fp-chips">
                {ROOMS.map((r) => (
                  <div
                    key={r}
                    className={"fp-chip" + (rooms === r ? " on" : "")}
                    onClick={() => setRooms(rooms === r ? "" : r)}
                  >
                    {r} xona
                  </div>
                ))}
              </div>
            </div>

            {/* Narx diapazoni */}
            <div className="fp-section">
              <div className="fp-label">Narx diapazoni ($)</div>
              <div className="fp-price-row">
                <input
                  className="fp-input"
                  type="number"
                  placeholder="Minimal narx"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input
                  className="fp-input"
                  type="number"
                  placeholder="Maksimal narx"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Tuman */}
            <div className="fp-section">
              <div className="fp-label">Tuman</div>
              <CustomSelect
                value={district}
                onChange={setDistrict}
                options={[
                  { value: "", label: "Barcha tumanlar" },
                  ...DISTRICTS.map(d => ({ value: d, label: d }))
                ]}
                placeholder="Barcha tumanlar"
              />
            </div>

            {/* Amallar */}
            <div className="fp-actions">
              <button className="fp-clear" onClick={clearAll}>
                <i className="ti ti-trash" style={{ marginRight: 4 }}></i> Tozalash
              </button>
              <button className="fp-apply" onClick={handleSearch}>
                <i className="ti ti-search" style={{ marginRight: 4 }}></i> Qidirish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
