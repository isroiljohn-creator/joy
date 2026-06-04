"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const categories = ["Yangi uylar", "Ikkilamchi", "Ijara", "Ofis"];

export default function SearchBox() {
  const [selectedCat, setSelectedCat] = useState("Yangi uylar");
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = () => {
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

  return (
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
      <div className="searchrow">
        <i className="ti ti-search"></i>
        <input
          placeholder="Hudud, tuman yoki manzil..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="go" onClick={handleSearch} aria-label="Qidirish">
          <i className="ti ti-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
