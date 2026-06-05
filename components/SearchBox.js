"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

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
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .filter-overlay {
          position: fixed; inset: 0; background: rgba(26,19,14,0.4);
          z-index: 100; display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(6px); padding: 20px;
        }
        .filter-panel {
          background: #fff; border-radius: 24px; width: 100%; max-width: 520px;
          max-height: 85vh; overflow-y: auto; padding: 28px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          animation: slideUp 0.25s ease;
        }
        .filter-panel h3 {
          font-family: 'Bricolage Grotesque', sans-serif; font-size: 22px;
          font-weight: 700; margin-bottom: 24px; display: flex;
          align-items: center; justify-content: space-between;
        }
        .fp-label {
          font-size: 13px; font-weight: 600; color: var(--text2);
          margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em;
        }
        .fp-section { margin-bottom: 20px; }
        .fp-chips {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .fp-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 12px; font-size: 14px;
          font-weight: 500; border: 1.5px solid var(--sand); background: #fff;
          cursor: pointer; transition: all 0.15s ease; color: var(--text2);
        }
        .fp-chip:hover { border-color: var(--orange); color: var(--orange-dark); }
        .fp-chip.on {
          background: var(--orange-tint); border-color: var(--orange);
          color: var(--orange-dark); font-weight: 600;
        }
        .fp-chip i { font-size: 16px; }
        .fp-price-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        .fp-input {
          width: 100%; padding: 10px 14px; border: 1.5px solid var(--sand);
          border-radius: 12px; font-size: 14px; font-family: inherit;
          outline: none; transition: border-color 0.15s; background: var(--bg);
        }
        .fp-input:focus { border-color: var(--orange); }
        .fp-input::placeholder { color: var(--muted); }
        .fp-select {
          width: 100%; padding: 10px 14px; border: 1.5px solid var(--sand);
          border-radius: 12px; font-size: 14px; font-family: inherit;
          outline: none; background: var(--bg); cursor: pointer;
          appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239B9286' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
          padding-right: 36px;
        }
        .fp-select:focus { border-color: var(--orange); }
        .fp-actions {
          display: flex; gap: 12px; margin-top: 24px; padding-top: 20px;
          border-top: 1px solid var(--sand);
        }
        .fp-clear {
          flex: 1; padding: 12px; border-radius: 14px; font-size: 14px;
          font-weight: 600; border: 1.5px solid var(--sand); background: #fff;
          cursor: pointer; transition: 0.15s; color: var(--text2);
        }
        .fp-clear:hover { border-color: var(--orange); color: var(--orange-dark); }
        .fp-apply {
          flex: 2; padding: 12px; border-radius: 14px; font-size: 14px;
          font-weight: 600; border: none; background: var(--orange);
          color: #fff; cursor: pointer; transition: 0.15s;
        }
        .fp-apply:hover { background: var(--orange-dark); }
        .fp-close {
          width: 32px; height: 32px; border-radius: 10px; border: none;
          background: var(--sand); cursor: pointer; display: flex;
          align-items: center; justify-content: center; font-size: 16px;
          color: var(--text2); transition: 0.15s;
        }
        .fp-close:hover { background: var(--orange-tint); color: var(--orange-dark); }
      `}</style>

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
              <select
                className="fp-select"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                <option value="">Barcha tumanlar</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
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
