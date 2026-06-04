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

  // URL-dagi toifa o'zgarsa, tabni ham o'zgartiramiz
  useEffect(() => {
    if (urlCat) {
      setActive(urlCat);
    }
  }, [urlCat]);

  // Toifa bo'yicha filtrlaymiz
  const filtered = initialListings.filter((l) => l.cat === active);
  const searchQuery = searchParams.get("q");

  // Agar qidiruv so'rovi bo'lsa va toifa filtri bo'lsa
  const shown = filtered;

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
              // URL-ni ham yangilaymiz query params saqlab qolgan holda
              const params = new URLSearchParams(searchParams.toString());
              params.set("cat", t.key);
              router.push(`/listings?${params.toString()}`);
            }}
          >
            <i className={`ti ${t.icon}`}></i> {t.key}
          </div>
        ))}
        <div className="filters-btn">
          <i className="ti ti-adjustments-horizontal"></i> Filtrlar
        </div>
      </div>

      <div className="split">
        <div className="split-list">
          <div className="split-meta">
            <h1 className="display">
              Toshkent · <span className="count">{shown.length} ta e'lon</span>
            </h1>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>
              {searchQuery && (
                <span style={{ marginRight: 12 }}>
                  Qidiruv: <strong>"{searchQuery}"</strong>
                </span>
              )}
              Saralash: Tavsiya etilgan
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
                Ushbu toifada hozircha faol e'lonlar mavjud emas. Boshqa toifalarni ko'rib chiqing.
              </p>
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
    </>
  );
}
