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

    const initMap = (L) => {
      if (!mapRef.current || mapInstance.current) return;

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

      // Konteyner o'lchami o'zgarganda xaritani yangilaymiz
      const ro = new ResizeObserver(() => {
        map.invalidateSize();
      });
      ro.observe(mapRef.current);
    };

    if (window.L) {
      initMap(window.L);
    } else {
      // Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Leaflet JS
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        initMap(window.L);
      };
      document.head.appendChild(script);
    }

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
    // Global CSS for pins (bir marta)
    if (!document.getElementById("map-pin-style")) {
      const style = document.createElement("style");
      style.id = "map-pin-style";
      style.textContent = `
        .custom-pin { background: none !important; border: none !important; width: auto !important; height: auto !important; }
        .joy-pin {
          display: inline-block;
          background: #fff;
          color: #1A130E;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700;
          font-size: 13px;
          padding: 5px 12px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          white-space: nowrap;
          cursor: pointer;
          position: relative;
          transition: all 0.15s ease;
          border: 1.5px solid #e8e2da;
          transform: translateX(-50%);
        }
        .joy-pin::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0; height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid #fff;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
        }
        .joy-pin:hover, .joy-pin.active {
          background: #F2591F;
          color: #fff;
          border-color: #F2591F;
          transform: scale(1.08);
          box-shadow: 0 4px 14px rgba(242,89,31,0.35);
        }
        .joy-pin:hover::after, .joy-pin.active::after {
          border-top-color: #F2591F;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 6px 20px rgba(0,0,0,0.12) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 12px 14px !important; }
        .leaflet-popup-tip { box-shadow: none !important; }
      `;
      document.head.appendChild(style);
    }

    items.forEach((l, i) => {
      const coords = getCoords(l.addr);
      const priceLabel = l.priceNum != null
        ? l.priceNum >= 1000
          ? `$${Math.round(l.priceNum / 1000)}k`
          : `$${l.priceNum.toLocaleString()}`
        : l.price || "$0";

      const icon = L.divIcon({
        className: "custom-pin",
        html: `<div class="joy-pin">${priceLabel}</div>`,
        iconSize: null,
        iconAnchor: [0, 0],
        popupAnchor: [0, -5],
      });

      const marker = L.marker(coords, { icon }).addTo(map);
      marker.bindPopup(`
        <div style="min-width:140px">
          <div style="font-weight:700;font-size:14px;margin-bottom:3px;color:#1A130E">${l.type}</div>
          <div style="color:#9B9286;font-size:12px;margin-bottom:6px;display:flex;align-items:center;gap:3px">
            <i class="ti ti-map-pin" style="font-size:13px"></i> ${l.addr}
          </div>
          <div style="color:#F2591F;font-weight:700;font-size:16px;font-family:'Bricolage Grotesque',sans-serif">${l.price}</div>
        </div>
      `, { closeButton: false, offset: [0, -10] });
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
