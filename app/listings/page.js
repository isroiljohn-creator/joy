"use client";
import { useState } from "react";
import { Nav, ListingCard } from "@/components/ui";
import { listings, pinPos } from "@/lib/data";

const tabs = [
  { key: "Yangi uylar", icon: "ti-building-skyscraper" },
  { key: "Ikkilamchi", icon: "ti-home" },
  { key: "Ijara", icon: "ti-key" },
  { key: "Ofis", icon: "ti-briefcase" },
];

export default function Listings() {
  const [active, setActive] = useState("Yangi uylar");
  const [activePin, setActivePin] = useState(0);
  const filtered = listings.filter((l) => l.cat === active);
  const shown = filtered.length ? filtered : listings;

  return (
    <>
      <Nav />
      <div className="tabs-row">
        {tabs.map((t) => (
          <div key={t.key} className={"ftab" + (active === t.key ? " on" : "")} onClick={() => setActive(t.key)}>
            <i className={`ti ${t.icon}`}></i> {t.key}
          </div>
        ))}
        <div className="filters-btn"><i className="ti ti-adjustments-horizontal"></i> Filtrlar</div>
      </div>

      <div className="split">
        <div className="split-list">
          <div className="split-meta">
            <h1 className="display">Toshkent · <span className="count">{shown.length} ta e'lon</span></h1>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>Saralash: Tavsiya etilgan</div>
          </div>
          <div className="split-grid">{shown.map((l) => <ListingCard l={l} key={l.id} />)}</div>
        </div>

        <div className="mapwrap">
          <div className="map-roads"></div>
          {listings.map((l, i) => (
            <div key={l.id} className={"pin" + (activePin === i ? " active" : "")}
              style={{ left: pinPos[i][0], top: pinPos[i][1] }}
              onClick={() => setActivePin(i)}>
              ${Math.round(l.priceNum / 1000)}k
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
