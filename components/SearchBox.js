"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const categories = ["Yangi uylar", "Ikkilamchi", "Ijara", "Ofis"];

export default function SearchBox() {
  const [selectedCat, setSelectedCat] = useState("Yangi uylar");
  const [query, setQuery] = useState("");
  const [shaking, setShaking] = useState(false);
  const router = useRouter();
  const inputRef = useRef(null);

  const handleSearch = () => {
    if (!query.trim()) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      inputRef.current?.focus();
      return;
    }
    const params = new URLSearchParams();
    if (selectedCat) params.set("cat", selectedCat);
    if (query) params.set("q", query);
    router.push(`/listings?${params.toString()}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearQuery = () => {
    setQuery("");
    inputRef.current?.focus();
  };

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
      `}</style>
      <div className="searchbox">
        <div className="seg">
          {categories.map((cat) => (
            <button
              key={cat}
              className={selectedCat === cat ? "on" : ""}
              onClick={() => setSelectedCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div
          className="searchrow"
          style={shaking ? { animation: "shake 0.4s ease" } : undefined}
        >
          <i className="ti ti-search"></i>
          <input
            ref={inputRef}
            placeholder="Hudud, tuman yoki manzil..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              aria-label="Tozalash"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted)",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 4,
                borderRadius: "50%",
                transition: "color 0.2s",
              }}
            >
              <i className="ti ti-x"></i>
            </button>
          )}
          <button className="go" onClick={handleSearch} aria-label="Qidirish">
            <i className="ti ti-arrow-right"></i>
          </button>
        </div>
      </div>
    </>
  );
}
