"use client";
import { useTranslation } from "@/lib/useTranslation";

// Toshkent tumanlari koordinatalari (Map.js bilan bir xil)
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
  "Yashnobod": [41.3220, 69.3108]
};

// Deterministik koordinata hisoblagich (har doim bir xil offset berishi uchun)
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function getDeterministicCoords(addr) {
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

// Haversine masofa hisoblagich
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const METROS = [
  { name: "Chilonzor", coords: [41.2727, 69.2045], icon: "ti-subway" },
  { name: "Yunusobod", coords: [41.3436, 69.2878], icon: "ti-subway" },
  { name: "Buyuk Ipak Yo'li", coords: [41.3262, 69.3273], icon: "ti-subway" },
  { name: "Novza", coords: [41.2858, 69.2272], icon: "ti-subway" },
  { name: "Kosmonavtlar", coords: [41.3056, 69.2711], icon: "ti-subway" },
  { name: "Oybek", coords: [41.2965, 69.2778], icon: "ti-subway" },
  { name: "Ming O'rik", coords: [41.3005, 69.2764], icon: "ti-subway" },
  { name: "Amir Temur", coords: [41.3117, 69.2797], icon: "ti-subway" },
  { name: "Toshkent", coords: [41.3014, 69.2905], icon: "ti-subway" },
  { name: "Do'stlik", coords: [41.2952, 69.3242], icon: "ti-subway" },
  { name: "Hamid Olimjon", coords: [41.3195, 69.2974], icon: "ti-subway" },
  { name: "Mustaqillik Maydoni", coords: [41.3142, 69.2687], icon: "ti-subway" },
  { name: "Beruniy", coords: [41.3444, 69.2064], icon: "ti-subway" },
  { name: "G'ofur G'ulom", coords: [41.3217, 69.2439], icon: "ti-subway" }
];

const SCHOOLS = [
  { name: "144-maktab", coords: [41.2800, 69.2000], icon: "ti-school" },
  { name: "50-maktab", coords: [41.3130, 69.2820], icon: "ti-school" },
  { name: "Westminster maktabi", coords: [41.3080, 69.2760], icon: "ti-school" },
  { name: "110-maktab", coords: [41.2990, 69.2750], icon: "ti-school" },
  { name: "17-maktab", coords: [41.3450, 69.2800], icon: "ti-school" },
  { name: "142-maktab", coords: [41.3120, 69.3400], icon: "ti-school" },
  { name: "Prezident Maktabi", coords: [41.3290, 69.3300], icon: "ti-school" }
];

const SUPERMARKETS = [
  { name: "Korzinka", coords: [41.2750, 69.2100], icon: "ti-shopping-cart" },
  { name: "Makro", coords: [41.3100, 69.2900], icon: "ti-shopping-cart" },
  { name: "Chilonzor buyum bozori", coords: [41.2560, 69.1850], icon: "ti-building-store" },
  { name: "Alay bozori", coords: [41.3200, 69.2820], icon: "ti-building-store" },
  { name: "Oloy bozori", coords: [41.3210, 69.2830], icon: "ti-building-store" },
  { name: "Eko Bozor", coords: [41.3480, 69.3390], icon: "ti-building-store" },
  { name: "Compass Mall", coords: [41.2400, 69.3450], icon: "ti-building-store" }
];

const PARKS = [
  { name: "G'afur G'ulom bog'i", coords: [41.2890, 69.2220], icon: "ti-trees" },
  { name: "Milliy bog'", coords: [41.2980, 69.2420], icon: "ti-trees" },
  { name: "Eko park", coords: [41.3130, 69.3000], icon: "ti-trees" },
  { name: "Central Park", coords: [41.3120, 69.2920], icon: "ti-trees" },
  { name: "Ashxobod bog'i", coords: [41.3240, 69.3170], icon: "ti-trees" }
];

export default function NearbyInfrastructure({ address }) {
  const { lang } = useTranslation();
  const listingCoords = getDeterministicCoords(address);

  // Har bir toifadan eng yaqin POIni topish
  const getClosest = (poiList) => {
    return poiList
      .map((poi) => {
        const dist = getDistance(listingCoords[0], listingCoords[1], poi.coords[0], poi.coords[1]);
        const time = Math.max(1, Math.round(dist * 12)); // 5km/h walking speed ≈ 12 min per km
        return { ...poi, distance: dist, time };
      })
      .sort((a, b) => a.distance - b.distance)[0];
  };

  const closestMetro = getClosest(METROS);
  const closestSchool = getClosest(SCHOOLS);
  const closestSuper = getClosest(SUPERMARKETS);
  const closestPark = getClosest(PARKS);

  const translateCategory = (key) => {
    const dict = {
      metro: { uz: "Metro", ru: "Метро", en: "Subway" },
      school: { uz: "Maktab", ru: "Школа", en: "School" },
      supermarket: { uz: "Do'konlar", ru: "Магазины", en: "Shopping" },
      park: { uz: "Yashil hudud", ru: "Парки", en: "Green Parks" }
    };
    return dict[key]?.[lang] || dict[key]?.uz;
  };

  const items = [
    { cat: "metro", name: `${closestMetro.name} ${lang === 'en' ? 'station' : ''}`, time: closestMetro.time, icon: closestMetro.icon },
    { cat: "school", name: closestSchool.name, time: closestSchool.time, icon: closestSchool.icon },
    { cat: "supermarket", name: closestSuper.name, time: closestSuper.time, icon: closestSuper.icon },
    { cat: "park", name: closestPark.name, time: closestPark.time, icon: closestPark.icon }
  ];

  return (
    <div className="mdcard" style={{ marginTop: 16 }}>
      <h3 style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: 18,
        fontWeight: 700,
        color: "var(--ink)",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 8
      }}>
        <i className="ti ti-map-2" style={{ color: "var(--orange)", fontSize: 20 }}></i>
        {lang === "uz" ? "Atrofdagi infratuzilma" : lang === "ru" ? "Инфраструктура рядом" : "Nearby Infrastructure"}
      </h3>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12
      }}>
        {items.map((it) => (
          <div 
            key={it.cat}
            style={{
              background: "var(--cream)",
              border: "1px solid var(--sand)",
              borderRadius: 14,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              transition: "transform 0.2s ease, border-color 0.2s ease",
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--orange-tint)",
              color: "var(--orange)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0
            }}>
              <i className={`ti ${it.icon}`}></i>
            </div>
            
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {translateCategory(it.cat)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: "2px 0" }} title={it.name}>
                {it.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", display: "flex", alignItems: "center", gap: 4 }}>
                <i className="ti ti-walk" style={{ fontSize: 13, color: "var(--orange)" }}></i>
                <span>{it.time} {lang === "uz" ? "daq" : lang === "ru" ? "мин" : "min"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
