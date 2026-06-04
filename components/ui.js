"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toggleFavoriteAction } from "@/app/actions";

export function Nav() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
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
        name: decodeURIComponent(cookiesList.user_name)
      });
    }
  }, []);

  const handleLogout = () => {
    document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "user_phone=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = "/";
  };

  return (
    <nav>
      <div className="nav-in">
        <Link className="logo" href="/">
          <span className="dot"></span>Joy
        </Link>
        <div className="nav-links">
          {isLandingPage && (
            <>
              <Link href="/listings?cat=Ikkilamchi">Sotib olish</Link>
              <Link href="/listings?cat=Ijara">Ijara</Link>
              <Link href="/listings?cat=Ofis">Ofis</Link>
              <Link href="/listings?cat=Yangi%20uylar">Novostroyka</Link>
            </>
          )}
        </div>
        <div className="nav-r">
          {user ? (
            <>
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
