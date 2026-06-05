"use client";
import { useEffect, useRef } from "react";

// Toshkent tumanlari koordinatalari
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
  "Yashnobod": [41.3220, 69.3108],
};

function getCoords(addr) {
  if (!addr) return [41.2995 + Math.random() * 0.06 - 0.03, 69.2401 + Math.random() * 0.08 - 0.04];
  for (const [district, coords] of Object.entries(DISTRICT_COORDS)) {
    if (addr.toLowerCase().includes(district.toLowerCase())) {
      return [coords[0] + (Math.random() - 0.5) * 0.012, coords[1] + (Math.random() - 0.5) * 0.015];
    }
  }
  return [41.2995 + Math.random() * 0.06 - 0.03, 69.2401 + Math.random() * 0.08 - 0.04];
}

export default function Map({ listings, activePin, onPinClick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (mapInstance.current) return;

    // Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (!mapRef.current || mapInstance.current) return;

      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [41.3111, 69.2797],
        zoom: 12,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>',
        maxZoom: 18,
      }).addTo(map);

      mapInstance.current = map;
      addMarkers(L, map, listings);
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    // Markerlarni yangilash
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    addMarkers(window.L, mapInstance.current, listings);
  }, [listings]);

  useEffect(() => {
    if (activePin != null && markersRef.current[activePin]) {
      const m = markersRef.current[activePin];
      mapInstance.current?.panTo(m.getLatLng(), { animate: true });
      m.openPopup();
    }
  }, [activePin]);

  function addMarkers(L, map, items) {
    items.forEach((l, i) => {
      const coords = getCoords(l.addr);
      const priceLabel = `$${Math.round(l.priceNum / 1000)}k`;

      const icon = L.divIcon({
        className: "custom-pin",
        html: `<div style="
          background: var(--orange, #F2591F); color: #fff;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700; font-size: 12px;
          padding: 4px 10px; border-radius: 16px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.2);
          white-space: nowrap; cursor: pointer;
          border: 2px solid #fff;
        ">${priceLabel}</div>`,
        iconSize: [0, 0],
        iconAnchor: [30, 15],
      });

      const marker = L.marker(coords, { icon }).addTo(map);
      marker.bindPopup(`
        <div style="min-width:160px">
          <b style="font-size:14px">${l.type}</b><br/>
          <span style="color:#666;font-size:12px">${l.addr}</span><br/>
          <b style="color:#F2591F;font-size:15px">${l.price}</b>
        </div>
      `);
      marker.on("click", () => {
        if (onPinClick) onPinClick(i);
      });
      markersRef.current.push(marker);
    });

    if (items.length > 0) {
      const bounds = L.latLngBounds(markersRef.current.map((m) => m.getLatLng()));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100%", minHeight: 400 }}
    />
  );
}
