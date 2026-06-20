/**
 * maskon — Foydalanuvchi qiziqishlari va tavsiya algoritmi
 * localStorage orqali qidiruv tarixi, ko'rishlar va qiziqishlarni saqlaydi.
 */

const KEY = "maskon_prefs";
const MAX_SEARCHES = 10;
const MAX_VIEWS = 60;

function defaultPrefs() {
  return {
    searches: [],  // [{ q: string, t: timestamp }]
    views: [],     // [{ id, cat, priceNum, rooms, addr, t }]
    cats: {},      // { catName: count }
    rooms: {},     // { "2": count, "3": count, ... }
    prices: [],    // [priceNum, ...] last 20
  };
}

function getPrefs() {
  if (typeof window === "undefined") return defaultPrefs();
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      // Fallback and migrate old prefs
      raw = localStorage.getItem("joy_prefs");
      if (raw) {
        localStorage.setItem(KEY, raw);
      }
    }
    if (!raw) return defaultPrefs();
    return { ...defaultPrefs(), ...JSON.parse(raw) };
  } catch {
    return defaultPrefs();
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {}
}

/** Qidiruvni saqlash */
export function saveSearch(query) {
  if (!query?.trim()) return;
  const prefs = getPrefs();
  const q = query.trim().toLowerCase();
  prefs.searches = prefs.searches.filter((s) => s.q !== q);
  prefs.searches.unshift({ q, t: Date.now() });
  prefs.searches = prefs.searches.slice(0, MAX_SEARCHES);
  savePrefs(prefs);
}

/** Bitta qidiruvni o'chirish */
export function removeSearch(query) {
  const prefs = getPrefs();
  prefs.searches = prefs.searches.filter((s) => s.q !== query);
  savePrefs(prefs);
}

/** Barcha qidiruvlarni tozalash */
export function clearAllSearches() {
  const prefs = getPrefs();
  prefs.searches = [];
  savePrefs(prefs);
}

/** Oxirgi qidiruvlarni olish */
export function getRecentSearches() {
  return getPrefs().searches.slice(0, 6);
}

/** E'lon ko'rishni saqlash */
export function trackView(listing) {
  if (!listing?.id) return;
  const prefs = getPrefs();

  // Avvalgisini olib tashlaymiz (dublikat bo'lmasin)
  prefs.views = prefs.views.filter((v) => v.id !== listing.id);
  prefs.views.unshift({
    id: listing.id,
    cat: listing.cat,
    priceNum: listing.priceNum,
    rooms: listing.rooms,
    addr: listing.addr || "",
    t: Date.now(),
  });
  prefs.views = prefs.views.slice(0, MAX_VIEWS);

  // Kategoriya qiziqishi
  if (listing.cat) {
    prefs.cats[listing.cat] = (prefs.cats[listing.cat] || 0) + 2;
  }

  // Xona qiziqishi
  if (listing.rooms) {
    const r = String(listing.rooms);
    prefs.rooms[r] = (prefs.rooms[r] || 0) + 1;
  }

  // Narx tarixi
  if (listing.priceNum) {
    prefs.prices.push(listing.priceNum);
    prefs.prices = prefs.prices.slice(-20);
  }

  savePrefs(prefs);
}

/** Kategoriya bosishni saqlash */
export function trackCategory(cat) {
  if (!cat) return;
  const prefs = getPrefs();
  prefs.cats[cat] = (prefs.cats[cat] || 0) + 3;
  savePrefs(prefs);
}

/**
 * Tavsiya algoritmi — har bir e'lonni foydalanuvchi qiziqishlariga
 * qarab ball beradi va tartiblaydi.
 */
export function scoreListings(listings) {
  if (!listings?.length) return [];
  const prefs = getPrefs();
  const viewedIds = new Set(prefs.views.map((v) => v.id));

  // Eng ko'p bosilgan kategoriya
  const topCat = Object.entries(prefs.cats).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Eng ko'p ko'rilgan xona soni
  const topRooms = Object.entries(prefs.rooms).sort((a, b) => b[1] - a[1])[0]?.[0];

  // O'rtacha narx (tarixi bo'yicha)
  const avgPrice =
    prefs.prices.length > 0
      ? prefs.prices.reduce((a, b) => a + b, 0) / prefs.prices.length
      : null;

  // Qidiruv kalit so'zlari (so'nggi 5 ta qidiruvdan)
  const keywords = prefs.searches
    .slice(0, 5)
    .flatMap((s) => s.q.split(/\s+/).filter((w) => w.length >= 2));

  return listings
    .map((l) => {
      let score = 0;

      // 1. Kategoriya mos kelsa — yuqori ball
      if (topCat && l.cat === topCat) score += 45;

      // 2. Qidiruv kalit so'zlari mos kelsa
      const ltext = `${l.type || ""} ${l.addr || ""} ${l.cat || ""}`.toLowerCase();
      keywords.forEach((kw) => {
        if (ltext.includes(kw)) score += 22;
      });

      // 3. Xona soni mos kelsa
      if (topRooms && String(l.rooms) === topRooms) score += 28;

      // 4. Narx diapazoni mos kelsa (o'rtachadan ±25%)
      if (avgPrice && l.priceNum) {
        const diff = Math.abs(l.priceNum - avgPrice) / avgPrice;
        if (diff < 0.15) score += 22;
        else if (diff < 0.25) score += 12;
        else if (diff < 0.40) score += 5;
      }

      // 5. "Arzonroq" bo'lsa — qo'shimcha ball
      if (l.priceStatus === "cheap") score += 15;

      // 6. TOP e'lon — kichik bonus
      if (l.top) score += 8;

      // 7. Hali ko'rilmagan e'lon — yangi kontent afzal
      if (!viewedIds.has(l.id)) score += 18;

      // 8. Bir xil manzil zonasi (birinchi so'z mos kelsa)
      const lastAddr = prefs.views[0]?.addr?.split(",")[0]?.toLowerCase() || "";
      if (lastAddr && l.addr?.toLowerCase().includes(lastAddr)) score += 10;

      return { ...l, _score: score };
    })
    .sort((a, b) => b._score - a._score);
}
