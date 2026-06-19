"use client";
import { useEffect, useRef, useState } from "react";

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
  let address = "";
  if (addr != null) {
    address = String(addr).toLowerCase();
  }
  for (const [district, coords] of Object.entries(DISTRICT_COORDS)) {
    if (address.includes(district.toLowerCase())) {
      return [coords[0] + (Math.random() - 0.5) * 0.012, coords[1] + (Math.random() - 0.5) * 0.015];
    }
  }
  return [41.2995 + Math.random() * 0.06 - 0.03, 69.2401 + Math.random() * 0.08 - 0.04];
}

export default function Map({ listings, activePin, onPinClick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const resizeObserverRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    let active = true;

    // Delay 250ms to let the mobile browser reflow styles and apply position: fixed
    const timer = setTimeout(() => {
      if (!active || mapInstance.current || !mapRef.current) return;

      // Load leaflet dynamically inside the client-side useEffect
      import("leaflet")
        .then((L) => {
          if (!active || mapInstance.current || !mapRef.current) return;

          try {
            // Setup Leaflet icon defaults to bypass 404s
            if (L.Icon && L.Icon.Default) {
              delete L.Icon.Default.prototype._getIconUrl;
              L.Icon.Default.mergeOptions({
                iconRetinaUrl: null,
                iconUrl: null,
                shadowUrl: null,
              });
            }

            const map = L.map(mapRef.current, {
              center: [41.3111, 69.2797],
              zoom: 12,
              zoomControl: false,
            });

            L.control.zoom({ position: "bottomright" }).addTo(map);

            // CartoDB Voyager tiles (never blocked, extremely fast, modern look)
            L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
              attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
              maxZoom: 18,
            }).addTo(map);

            mapInstance.current = map;
            addMarkers(L, map, listings);

            // Invalidate map size on container resize
            const ro = new ResizeObserver(() => {
              map.invalidateSize();
            });
            ro.observe(mapRef.current);
            resizeObserverRef.current = ro;
            
            setLoading(false);
          } catch (err) {
            console.error("Map initialization failed:", err);
            setError(err.message + "\n" + err.stack);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Leaflet import failed:", err);
          setError("Leaflet import failed: " + err.message);
          setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    // Update markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    import("leaflet").then((L) => {
      if (mapInstance.current) {
        addMarkers(L, mapInstance.current, listings);
      }
    });
  }, [listings]);

  useEffect(() => {
    if (activePin != null && markersRef.current[activePin]) {
      const m = markersRef.current[activePin];
      mapInstance.current?.panTo(m.getLatLng(), { animate: true });
      m.openPopup();
    }
  }, [activePin]);

  function addMarkers(LInstance, map, items) {
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

    if (!Array.isArray(items)) return;

    items.forEach((l, i) => {
      try {
        const coords = getCoords(l.addr);
        const priceLabel = l.priceNum != null
          ? l.priceNum >= 1000
            ? `$${Math.round(l.priceNum / 1000)}k`
            : `$${l.priceNum.toLocaleString()}`
          : l.price || "$0";

        const icon = LInstance.divIcon({
          className: "custom-pin",
          html: `<div class="joy-pin">${priceLabel}</div>`,
          iconAnchor: [0, 0],
          popupAnchor: [0, -5],
        });

        const marker = LInstance.marker(coords, { icon }).addTo(map);
        marker.bindPopup(`
          <div style="min-width:140px">
            <div style="font-weight:700;font-size:14px;margin-bottom:3px;color:#1A130E">${l.type || "E'lon"}</div>
            <div style="color:#9B9286;font-size:12px;margin-bottom:6px;display:flex;align-items:center;gap:3px">
              <i class="ti ti-map-pin" style="font-size:13px"></i> ${l.addr || ""}
            </div>
            <div style="color:#F2591F;font-weight:700;font-size:16px;font-family:'Bricolage Grotesque',sans-serif">${l.price || ""}</div>
          </div>
        `, { closeButton: false, offset: [0, -10] });
        
        marker.on("click", () => {
          if (onPinClick) onPinClick(i);
        });
        markersRef.current.push(marker);
      } catch (err) {
        console.error("Error rendering marker for listing:", l, err);
      }
    });

    if (markersRef.current.length > 0) {
      try {
        const bounds = LInstance.latLngBounds(markersRef.current.map((m) => m.getLatLng()));
        map.fitBounds(bounds, { padding: [40, 40] });
      } catch (err) {
        console.error("Error setting map bounds:", err);
      }
    }
  }

  if (error) {
    return (
      <div style={{
        padding: 24,
        color: "#dc2626",
        background: "#fee2e2",
        fontFamily: "monospace",
        fontSize: 12,
        whiteSpace: "pre-wrap",
        overflowY: "auto",
        height: "100%",
        minHeight: 400,
        borderRadius: 16,
        border: "2px solid #ef4444",
        zIndex: 9999,
        position: "relative"
      }}>
        <h3 style={{ margin: "0 0 10px", color: "#991b1b" }}>Xaritada yuklanish xatosi:</h3>
        <p style={{ margin: "0 0 16px", lineHeight: 1.5 }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 16px",
            background: "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Sahifani yangilash
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 400, position: "relative" }}>
      {loading && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "var(--cream, #FBF7F3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          flexDirection: "column",
          gap: 12
        }}>
          <div style={{
            width: 32,
            height: 32,
            border: "3px solid var(--sand)",
            borderTopColor: "var(--orange)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite"
          }} />
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>Xarita yuklanmoqda...</div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin { to { transform: rotate(360deg); } }
          `}} />
        </div>
      )}
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100%", minHeight: 400 }}
      />
    </div>
  );
}
