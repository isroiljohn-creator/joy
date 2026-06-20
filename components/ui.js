"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toggleFavoriteAction } from "@/app/actions";
import { useTranslation } from "@/lib/useTranslation";

export function Nav() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [navQuery, setNavQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [compareCount, setCompareCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const isLandingPage = pathname === "/";

  useEffect(() => {
    // Cookie-larni o'qiymiz
    const cookiesList = document.cookie.split(";").reduce((acc, c) => {
      const [key, val] = c.trim().split("=");
      if (key && val) {
        acc[key] = val;
      }
      return acc;
    }, {});

    if (cookiesList.is_logged_in === "true" && cookiesList.user_display_name) {
      setUser({
        id: cookiesList.is_logged_in,
        name: decodeURIComponent(cookiesList.user_display_name),
        role: cookiesList.user_role || "user"
      });
    }

    // Tungi rejimni localStorage dan o'qish
    const saved = localStorage.getItem("joy-theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }

    const handleThemeChange = () => {
      setDarkMode(localStorage.getItem("joy-theme") === "dark");
    };
    window.addEventListener("joy-theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("joy-theme-change", handleThemeChange);
    };
  }, []);

  useEffect(() => {
    const updateCompareCount = () => {
      const list = JSON.parse(localStorage.getItem("joy_compare") || "[]");
      setCompareCount(list.length);
    };
    updateCompareCount();
    window.addEventListener("compare_updated", updateCompareCount);
    return () => {
      window.removeEventListener("compare_updated", updateCompareCount);
    };
  }, []);

  // Mobil menyu ochilganda scroll-ni bloklash
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "user_display_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "user_phone=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "is_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = "/";
  };

  const handleNavSearch = (e) => {
    if (e.key === "Enter" && navQuery.trim()) {
      router.push(`/listings?q=${encodeURIComponent(navQuery.trim())}`);
      setNavQuery("");
    }
  };

  const handleNavSearchClick = () => {
    if (navQuery.trim()) {
      router.push(`/listings?q=${encodeURIComponent(navQuery.trim())}`);
      setNavQuery("");
    }
  };

  return (
    <nav>
      <div className="nav-in">
        <Link className="logo" href="/">
          <span className="dot"></span>Joy
        </Link>

        {/* Navbar qidiruv — bosh sahifadan boshqa barcha sahifalarda */}
        {!isLandingPage && (
          <div className="nav-search">
            <i className="ti ti-search"></i>
            <input
              placeholder={t("search_placeholder")}
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              onKeyDown={handleNavSearch}
            />
            {navQuery && (
              <button className="nav-search-clear" onClick={() => setNavQuery("")} aria-label="Tozalash">
                <i className="ti ti-x"></i>
              </button>
            )}
            <button className="nav-search-go" onClick={handleNavSearchClick} aria-label="Qidirish">
              <i className="ti ti-arrow-right"></i>
            </button>
          </div>
        )}

        {/* Bosh sahifadagi nav havolalari */}
        {isLandingPage && (
          <div className="nav-links">
            <Link href="/listings?cat=Ikkilamchi">{t("buy")}</Link>
            <Link href="/listings?cat=Ijara">{t("rent")}</Link>
            <Link href="/listings?cat=Ofis">{t("office")}</Link>
            <Link href="/listings?cat=Yangi%20uylar">{t("novostroyka")}</Link>
            <Link href="/agencies">{t("agencies")}</Link>
          </div>
        )}

        <div className="nav-r">
          {/* Mobil hamburger tugmasi */}
          <button 
            className="hamburger" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menyu"
          >
            <i className={mobileMenuOpen ? "ti ti-x" : "ti ti-menu-2"}></i>
          </button>

          {/* Tungi/kunduzgi rejim */}
          <button
            className="theme-toggle"
            onClick={() => {
              const next = !darkMode;
              setDarkMode(next);
              if (next) {
                document.documentElement.setAttribute("data-theme", "dark");
                localStorage.setItem("joy-theme", "dark");
              } else {
                document.documentElement.removeAttribute("data-theme");
                localStorage.setItem("joy-theme", "light");
              }
              window.dispatchEvent(new Event("joy-theme-change"));
            }}
            aria-label={darkMode ? t("light_mode") : t("dark_mode")}
            title={darkMode ? t("light_mode") : t("dark_mode")}
          >
            <i className={darkMode ? "ti ti-sun" : "ti ti-moon"}></i>
          </button>

          <div className="nav-r-desktop">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link href="/admin" className="btn-ghost" style={{ border: "1px solid var(--purple)", color: "var(--purple)", background: "var(--purple-tint)" }}>
                    {t("admin_panel")}
                  </Link>
                )}
                <Link href="/compare" className="btn-ghost" title="E'lonlarni solishtirish" style={{ display: "inline-flex", alignItems: "center", gap: 6, position: "relative" }}>
                  <i className="ti ti-git-compare" style={{ fontSize: 16 }}></i>
                  <span>Solishtirish</span>
                  {compareCount > 0 && (
                    <span style={{
                      background: "var(--orange)",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 16,
                      height: 16,
                      fontSize: 10,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>{compareCount}</span>
                  )}
                </Link>
                <Link href="/agency-dashboard" className="btn-ghost">
                  <i className="ti ti-building-store" style={{ marginRight: 4, verticalAlign: -1 }}></i> {t("agency_dashboard")}
                </Link>
                <Link className="btn-add" href="/add">
                  <i className="ti ti-plus"></i> {t("add_listing")}
                </Link>
                <Link 
                  className="avatar" 
                  href="/profile" 
                  style={{ 
                    background: "var(--orange-tint)", 
                    color: "var(--orange-dark)", 
                    fontWeight: 600, 
                    fontSize: 13,
                    textDecoration: "none"
                  }}
                >
                  {user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </Link>
              </>
            ) : (
              <>
                <Link href="/agencies" className="btn-ghost">{t("agencies")}</Link>
                <Link href="/compare" className="btn-ghost" title="E'lonlarni solishtirish" style={{ display: "inline-flex", alignItems: "center", gap: 6, position: "relative" }}>
                  <i className="ti ti-git-compare" style={{ fontSize: 16 }}></i>
                  <span>Solishtirish</span>
                  {compareCount > 0 && (
                    <span style={{
                      background: "var(--orange)",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 16,
                      height: 16,
                      fontSize: 10,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>{compareCount}</span>
                  )}
                </Link>
                <Link className="btn-ghost" href="/login">{t("login")}</Link>
                <Link className="btn-add" href="/login">
                  <i className="ti ti-plus"></i> {t("add_listing")}
                </Link>
                <Link className="avatar" href="/login">
                  <i className="ti ti-user"></i>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobil menyu paneli */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {/* Mobil qidiruv */}
            <div className="mobile-search">
              <i className="ti ti-search"></i>
              <input
                placeholder={t("search_placeholder")}
                value={navQuery}
                onChange={(e) => setNavQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && navQuery.trim()) {
                    router.push(`/listings?q=${encodeURIComponent(navQuery.trim())}`);
                    setNavQuery("");
                    setMobileMenuOpen(false);
                  }
                }}
              />
            </div>

            <div className="mobile-links">
              <Link href="/listings?cat=Yangi%20uylar" onClick={() => setMobileMenuOpen(false)}>
                <i className="ti ti-building-skyscraper"></i> {t("novostroyka")}
              </Link>
              <Link href="/listings?cat=Ikkilamchi" onClick={() => setMobileMenuOpen(false)}>
                <i className="ti ti-home"></i> {t("buy")}
              </Link>
              <Link href="/listings?cat=Ijara" onClick={() => setMobileMenuOpen(false)}>
                <i className="ti ti-key"></i> {t("rent")}
              </Link>
              <Link href="/listings?cat=Ofis" onClick={() => setMobileMenuOpen(false)}>
                <i className="ti ti-briefcase"></i> {t("office")}
              </Link>
              <Link href="/agencies" onClick={() => setMobileMenuOpen(false)}>
                <i className="ti ti-building-store"></i> {t("agencies")}
              </Link>
              <Link href="/compare" onClick={() => setMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <i className="ti ti-git-compare"></i>
                <span>Solishtirish</span>
                {compareCount > 0 && (
                  <span style={{
                    background: "var(--orange)",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 18,
                    height: 18,
                    fontSize: 10,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: "auto"
                  }}>{compareCount}</span>
                )}
              </Link>
            </div>

            <div className="mobile-divider"></div>

            <div className="mobile-links">
              {user ? (
                <>
                  {user.role === "admin" && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)} style={{ color: "var(--purple)" }}>
                      <i className="ti ti-shield" style={{ color: "var(--purple)" }}></i> {t("admin_panel")}
                    </Link>
                  )}
                  <Link href="/agency-dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <i className="ti ti-building-store"></i> {t("agency_dashboard")}
                  </Link>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <i className="ti ti-user"></i> {t("profile")}
                  </Link>
                  <Link href="/add" onClick={() => setMobileMenuOpen(false)}>
                    <i className="ti ti-plus"></i> {t("add_listing")}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <i className="ti ti-login-2"></i> {t("login")}
                  </Link>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <i className="ti ti-user-plus"></i> {t("login")}
                  </Link>
                </>
              )}
            </div>

            <div className="mobile-divider"></div>

            <div className="mobile-links secondary">
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}>{t("home")}</Link>
              <Link href="/help" onClick={() => setMobileMenuOpen(false)}>{t("settings")}</Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export function ListingCard({ l, isFavorite: initialFavorite = false }) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isCompared, setIsCompared] = useState(false);

  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("joy_compare") || "[]");
    setIsCompared(list.includes(l.id));
  }, [l.id]);

  const handleCompareToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    let list = JSON.parse(localStorage.getItem("joy_compare") || "[]");
    if (list.includes(l.id)) {
      list = list.filter(id => id !== l.id);
      setIsCompared(false);
    } else {
      if (list.length >= 3) {
        alert("Solishtirish uchun maksimal 3 ta e'lon tanlash mumkin.");
        return;
      }
      list.push(l.id);
      setIsCompared(true);
    }
    localStorage.setItem("joy_compare", JSON.stringify(list));
    window.dispatchEvent(new Event("compare_updated"));
  };

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Cookie-dan tekshiramiz
    const cookiesList = document.cookie.split(";").reduce((acc, c) => {
      const [key, val] = c.trim().split("=");
      if (key && val) {
        acc[key] = val;
      }
      return acc;
    }, {});

    if (cookiesList.is_logged_in !== "true") {
      window.location.href = "/login";
      return;
    }

    const prev = isFavorite;
    setIsFavorite(!prev);

    try {
      const res = await toggleFavoriteAction(l.id);
      if (res && res.error) {
        setIsFavorite(prev);
        if (res.error === "unauthorized") {
          // Sessiya o'chgan bo'lsa login sahifasiga redirect qilamiz
          document.cookie = "is_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
          window.location.href = "/login";
        }
      }
    } catch (err) {
      setIsFavorite(prev);
      console.error(err);
    }
  };

  return (
    <Link className="card" href={`/property/${l.id}`}>
      <div
        className="photo"
        style={{
          backgroundColor: "#C9BDA8",
          backgroundImage: `url('${l.photo}')`,
        }}
      >
        {l.top && (
          <span 
            className="badge" 
            style={{ 
              background: "var(--orange)", 
              color: "#fff", 
              boxShadow: "0 4px 10px rgba(255,140,0,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <i className="ti ti-star-filled" style={{ fontSize: 12 }}></i> TOP
          </span>
        )}
        {l.hasCadastreVerified && (
          <span 
            className="badge" 
            style={{ 
              background: "var(--green)", 
              color: "#fff", 
              boxShadow: "0 4px 10px rgba(29,158,117,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              top: l.top ? "40px" : "12px"
            }}
            title="Hujjatlari tekshirilgan mulk"
          >
            <i className="ti ti-shield-check" style={{ fontSize: 13 }}></i> Tekshirilgan
          </span>
        )}
        <div className="heart" onClick={handleFavorite}>
          <i 
            className={isFavorite ? "ti ti-heart-filled" : "ti ti-heart"} 
            style={{ 
              color: isFavorite ? "var(--orange)" : "var(--muted)"
            }}
          ></i>
        </div>
        <div className="compare-toggle" onClick={handleCompareToggle} title="Solishtirishga qo'shish">
          <i 
            className="ti ti-git-compare" 
            style={{ 
              color: isCompared ? "var(--orange)" : "var(--muted)",
              fontWeight: isCompared ? "bold" : "normal"
            }}
          ></i>
        </div>
      </div>
      <div className="cb">
        <div className="price">{l.price}</div>
        <div className="ptype">{l.type}</div>
        <div className="addr">
          <i className="ti ti-map-pin"></i> {l.addr}, Toshkent
        </div>

        {l.priceStatus && (
          <div style={{ margin: "6px 0", display: "flex", alignItems: "center" }}>
            {l.priceStatus === "cheap" && (
              <span style={{
                background: "rgba(34, 197, 94, 0.1)",
                color: "#16a34a",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}>
                <i className="ti ti-trending-down"></i> {Math.abs(l.priceDiffPercent)}% arzonroq
              </span>
            )}
            {l.priceStatus === "expensive" && (
              <span style={{
                background: "rgba(239, 68, 68, 0.1)",
                color: "#dc2626",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}>
                <i className="ti ti-trending-up"></i> {l.priceDiffPercent}% qimmatroq
              </span>
            )}
            {l.priceStatus === "average" && (
              <span style={{
                background: "rgba(107, 114, 128, 0.1)",
                color: "var(--muted)",
                fontSize: 11,
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}>
                <i className="ti ti-minus"></i> Bozor narxida
              </span>
            )}
          </div>
        )}

        <div className="specs">
          <div className="spec">
            <i className="ti ti-bed"></i> {l.rooms} xona
          </div>
          <div className="spec">
            <i className="ti ti-bath"></i> {l.baths} hammom
          </div>
          <div className="spec">
            <i className="ti ti-stairs"></i> {l.floor}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Custom Select ────────────────────────────────────────────────────────────
export function CustomSelect({ value, onChange, options, placeholder, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useState(null);
  const containerRef = { current: null };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => (typeof o === "string" ? o : o.value) === value);
  const label = selected
    ? typeof selected === "string" ? selected : selected.label
    : placeholder || "Tanlang...";

  return (
    <div
      className={"csel-wrap " + className}
      ref={(el) => { containerRef.current = el; }}
      style={{ position: "relative" }}
    >
      <button
        type="button"
        className={"csel-trigger" + (open ? " open" : "")}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="csel-label">{label}</span>
        <i className={"ti " + (open ? "ti-chevron-up" : "ti-chevron-down") + " csel-arrow"}></i>
      </button>

      {open && (
        <div className="csel-dropdown" role="listbox">
          {options.map((o) => {
            const val = typeof o === "string" ? o : o.value;
            const lbl = typeof o === "string" ? o : o.label;
            const active = val === value;
            return (
              <button
                key={val}
                type="button"
                role="option"
                aria-selected={active}
                className={"csel-option" + (active ? " active" : "")}
                onClick={() => {
                  onChange(val);
                  setOpen(false);
                }}
              >
                {active && <i className="ti ti-check csel-check"></i>}
                {lbl}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
