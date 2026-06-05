"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toggleFavoriteAction } from "@/app/actions";

export function Nav() {
  const [user, setUser] = useState(null);
  const [navQuery, setNavQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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

    if (cookiesList.user_id && cookiesList.user_name) {
      setUser({
        id: cookiesList.user_id,
        name: decodeURIComponent(cookiesList.user_name),
        role: cookiesList.user_role || "user"
      });
    }

    // Tungi rejimni localStorage dan o'qish
    const saved = localStorage.getItem("joy-theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
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
    document.cookie = "user_phone=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
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
              placeholder="Hudud, tuman yoki manzil bo'yicha qidiring..."
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
            <Link href="/listings?cat=Ikkilamchi">Sotib olish</Link>
            <Link href="/listings?cat=Ijara">Ijara</Link>
            <Link href="/listings?cat=Ofis">Ofis</Link>
            <Link href="/listings?cat=Yangi%20uylar">Novostroyka</Link>
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
            }}
            aria-label={darkMode ? "Kunduzgi rejim" : "Tungi rejim"}
            title={darkMode ? "Kunduzgi rejim" : "Tungi rejim"}
          >
            <i className={darkMode ? "ti ti-sun" : "ti ti-moon"}></i>
          </button>

          <div className="nav-r-desktop">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link href="/admin" className="btn-ghost" style={{ border: "1px solid var(--purple)", color: "var(--purple)", background: "var(--purple-tint)" }}>
                    Admin Panel
                  </Link>
                )}
                <button 
                  onClick={handleLogout} 
                  className="btn-ghost" 
                  style={{ border: "none", background: "none", color: "var(--muted)", cursor: "pointer" }}
                >
                  Chiqish
                </button>
                <Link className="btn-add" href="/add">
                  <i className="ti ti-plus"></i> E'lon qo'shish
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
                <Link className="btn-ghost" href="/login">Kirish</Link>
                <Link className="btn-add" href="/login">
                  <i className="ti ti-plus"></i> E'lon qo'shish
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
                placeholder="Qidirish..."
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
                <i className="ti ti-building-skyscraper"></i> Yangi uylar
              </Link>
              <Link href="/listings?cat=Ikkilamchi" onClick={() => setMobileMenuOpen(false)}>
                <i className="ti ti-home"></i> Sotib olish
              </Link>
              <Link href="/listings?cat=Ijara" onClick={() => setMobileMenuOpen(false)}>
                <i className="ti ti-key"></i> Ijara
              </Link>
              <Link href="/listings?cat=Ofis" onClick={() => setMobileMenuOpen(false)}>
                <i className="ti ti-briefcase"></i> Ofis
              </Link>
            </div>

            <div className="mobile-divider"></div>

            <div className="mobile-links">
              {user ? (
                <>
                  {user.role === "admin" && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)} style={{ color: "var(--purple)" }}>
                      <i className="ti ti-shield" style={{ color: "var(--purple)" }}></i> Admin Panel
                    </Link>
                  )}
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <i className="ti ti-user"></i> Profil
                  </Link>
                  <Link href="/add" onClick={() => setMobileMenuOpen(false)}>
                    <i className="ti ti-plus"></i> E'lon qo'shish
                  </Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                    <i className="ti ti-logout"></i> Chiqish
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <i className="ti ti-login-2"></i> Kirish
                  </Link>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <i className="ti ti-user-plus"></i> Ro'yxatdan o'tish
                  </Link>
                </>
              )}
            </div>

            <div className="mobile-divider"></div>

            <div className="mobile-links secondary">
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}>Biz haqimizda</Link>
              <Link href="/help" onClick={() => setMobileMenuOpen(false)}>Yordam</Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>Aloqa</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export function ListingCard({ l, isFavorite = false }) {
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

    if (!cookiesList.user_id) {
      window.location.href = "/login";
      return;
    }

    try {
      await toggleFavoriteAction(l.id);
    } catch (err) {
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
        {l.top && <span className="badge">TOP</span>}
        <div className="heart" onClick={handleFavorite}>
          <i 
            className="ti ti-heart" 
            style={{ 
              color: isFavorite ? "var(--orange)" : "var(--muted)",
              fontWeight: isFavorite ? "bold" : "normal"
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
