"use client";
import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";

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

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function getCoords(addr) {
  let address = "";
  if (addr != null) {
    address = String(addr).toLowerCase();
  }
  for (const [district, coords] of Object.entries(DISTRICT_COORDS)) {
    if (address.includes(district.toLowerCase())) {
      const hash = hashCode(address);
      const offsetX = ((Math.abs(hash % 100) / 100) - 0.5) * 0.012;
      const offsetY = ((Math.abs((hash >> 2) % 100) / 100) - 0.5) * 0.015;
      return [coords[0] + offsetX, coords[1] + offsetY];
    }
  }
  const hash = hashCode(address || "Toshkent");
  const offsetX = ((Math.abs(hash % 100) / 100) - 0.5) * 0.06;
  const offsetY = ((Math.abs((hash >> 2) % 100) / 100) - 0.5) * 0.08;
  return [41.2995 + offsetX, 69.2401 + offsetY];
}

export default function Map({ listings, activePin, onPinClick, mini = false, polygonPoints = null, onPolygonComplete = null }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const polygonInstanceRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    let active = true;
    let resizeObserverInstance = null;

    const initMap = (retryCount = 0) => {
      if (!active || mapInstance.current || !mapRef.current) return;

      const h = mapRef.current.clientHeight;
      if (h === 0 && retryCount < 6) {
        setTimeout(() => initMap(retryCount + 1), 250);
        return;
      }

      try {
        if (!L) {
          throw new Error("Leaflet namespace L is not loaded");
        }

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
          zoom: mini ? 10 : 12,
          zoomControl: false,
          tap: false, // Disable double-tap zoom delay on iOS Safari
          dragging: !mini,
          touchZoom: !mini,
          doubleClickZoom: !mini,
          scrollWheelZoom: !mini,
          boxZoom: !mini,
          keyboard: !mini
        });

        if (!mini) {
          L.control.zoom({ position: "bottomright" }).addTo(map);
        }

        // CartoDB Voyager tiles (never blocked, extremely fast, modern look)
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
          maxZoom: 18,
        }).addTo(map);

        mapInstance.current = map;
        addMarkers(L, map, listings);

        // Invalidate map size on container resize
        if (typeof ResizeObserver !== "undefined") {
          const ro = new ResizeObserver(() => {
            map.invalidateSize();
          });
          ro.observe(mapRef.current);
          resizeObserverInstance = ro;
        } else {
          // Fallback to window resize event for older browsers (e.g. Safari on older iOS)
          const handleResize = () => {
            map.invalidateSize();
          };
          window.addEventListener("resize", handleResize);
          map._handleResizeFallback = handleResize;
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Map initialization failed:", err);
        setError(err.message + "\n" + err.stack);
        setLoading(false);
      }
    };

    // Wait 200ms once for layout rendering reflow to complete
    const timer = setTimeout(() => initMap(0), 200);

    return () => {
      active = false;
      clearTimeout(timer);
      if (resizeObserverInstance) {
        resizeObserverInstance.disconnect();
      }
      if (mapInstance.current) {
        const map = mapInstance.current;
        if (map._handleResizeFallback) {
          window.removeEventListener("resize", map._handleResizeFallback);
        }
        map.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    // Update markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    addMarkers(L, mapInstance.current, listings);
  }, [listings]);

  useEffect(() => {
    if (activePin != null && markersRef.current[activePin]) {
      const m = markersRef.current[activePin];
      mapInstance.current?.panTo(m.getLatLng(), { animate: true });
      m.openPopup();
    }
  }, [activePin]);

  // 1. Hududni chizish effekti (Leaflet event listenerlar orqali)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || mini) return;

    let activeDrawing = false;
    let points = [];
    let tempPoly = null;

    const onDrawStart = (e) => {
      activeDrawing = true;
      points = [e.latlng];
      if (tempPoly) tempPoly.remove();
      tempPoly = L.polygon(points, {
        color: '#E06334',
        weight: 3,
        fillColor: '#E06334',
        fillOpacity: 0.15
      }).addTo(map);
    };

    const onDrawMove = (e) => {
      if (!activeDrawing || !tempPoly) return;
      points.push(e.latlng);
      tempPoly.setLatLngs(points);
    };

    const onDrawEnd = () => {
      if (!activeDrawing) return;
      activeDrawing = false;
      if (onPolygonComplete && points.length > 2) {
        onPolygonComplete(points.map(p => ({ lat: p.lat, lng: p.lng })));
      }
      if (tempPoly) {
        tempPoly.remove();
        tempPoly = null;
      }
      setIsDrawingMode(false);
      
      // Map interactionlarni qayta yoqish
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
    };

    if (isDrawingMode) {
      // Map interactionlarni o'chirish (chizish jarayonida xarita siljib ketmasligi uchun)
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();

      map.on("mousedown touchstart", onDrawStart);
      map.on("mousemove touchmove", onDrawMove);
      map.on("mouseup touchend", onDrawEnd);
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
    }

    return () => {
      map.off("mousedown touchstart", onDrawStart);
      map.off("mousemove touchmove", onDrawMove);
      map.off("mouseup touchend", onDrawEnd);
      if (tempPoly) {
        tempPoly.remove();
      }
    };
  }, [isDrawingMode, onPolygonComplete, mini]);

  // 2. Chizilgan polygonni render qilish/tozalash effekti
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (polygonInstanceRef.current) {
      polygonInstanceRef.current.remove();
      polygonInstanceRef.current = null;
    }

    if (polygonPoints && polygonPoints.length > 0) {
      polygonInstanceRef.current = L.polygon(
        polygonPoints.map(p => [p.lat, p.lng]),
        {
          color: '#E06334',
          weight: 3,
          fillColor: '#E06334',
          fillOpacity: 0.15
        }
      ).addTo(map);
      
      try {
        map.fitBounds(polygonInstanceRef.current.getBounds(), { padding: [20, 20] });
      } catch (err) {
        console.error("Error fitting polygon bounds:", err);
      }
    }
  }, [polygonPoints]);

  function addMarkers(LInstance, map, items) {
    if (!document.getElementById("map-pin-style")) {
      const style = document.createElement("style");
      style.id = "map-pin-style";
      style.textContent = `
        .custom-pin { background: none !important; border: none !important; width: auto !important; height: auto !important; }
        .maskon-pin {
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
        .maskon-pin::after {
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
        .maskon-pin:hover, .maskon-pin.active {
          background: #E06334;
          color: #fff;
          border-color: #E06334;
          transform: scale(1.08);
          box-shadow: 0 4px 14px rgba(224,99,52,0.35);
        }
        .maskon-pin:hover::after, .maskon-pin.active::after {
          border-top-color: #E06334;
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
          html: `<div class="maskon-pin">${priceLabel}</div>`,
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
            <div style="color:#E06334;font-weight:700;font-size:16px;font-family:'Bricolage Grotesque',sans-serif">${l.price || ""}</div>
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
        position: "absolute",
        inset: 16,
        padding: 24,
        color: "#dc2626",
        background: "#fee2e2",
        fontFamily: "monospace",
        fontSize: 12,
        whiteSpace: "pre-wrap",
        overflowY: "auto",
        borderRadius: 16,
        border: "2px solid #ef4444",
        zIndex: 9999
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
    <div style={{
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: "100%",
      height: "100%"
    }}>


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

        </div>
      )}
      {!mini && (
        <div style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8
        }}>
          <button
            type="button"
            onClick={() => setIsDrawingMode(prev => !prev)}
            style={{
              background: isDrawingMode ? "var(--ink)" : "var(--orange)",
              color: isDrawingMode ? "var(--card-bg)" : "#fff",
              border: isDrawingMode ? "1.5px solid var(--sand)" : "none",
              borderRadius: 12,
              padding: "10px 16px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(242, 89, 31, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s ease"
            }}
          >
            <i className={isDrawingMode ? "ti ti-x" : "ti ti-brush"}></i>
            <span>{isDrawingMode ? "Bekor qilish" : "Hududni chizish"}</span>
          </button>

          {isDrawingMode && (
            <div style={{
              background: "rgba(26, 19, 14, 0.95)",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 500,
              maxWidth: 220,
              textAlign: "center",
              lineHeight: 1.4,
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
            }}>
              Xarita ustida sichqoncha tugmasini bosib turing va hududni belgilash uchun harakatlantiring
            </div>
          )}
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          height: "100%"
        }}
      />
    </div>
  );
}
