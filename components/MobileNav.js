"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function MobileNav() {
  const path = usePathname();
  const [view, setView] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setView(params.get("view"));
    }

    const cookiesList = document.cookie.split(";").reduce((acc, c) => {
      const [key, val] = c.trim().split("=");
      if (key && val) {
        acc[key] = val;
      }
      return acc;
    }, {});
    if (cookiesList.is_logged_in === "true") {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [path]);

  const items = [
    { key: "home", icon: "ti-home", label: "Asosiy", href: "/" },
    { key: "saved", icon: "ti-bookmark", label: "Saqlangan", href: "/saved" },
    { key: "add", fab: true, href: "/add" },
    { key: "map", icon: "ti-map-2", label: "Xarita", href: "/listings?view=map" },
    { key: "profile", icon: "ti-user", label: "Profil", href: isLoggedIn ? "/profile" : "/login" },
  ];

  const isActive = (href) => {
    if (href === "/") return path === "/";
    if (href.startsWith("/listings?view=map")) {
      return path === "/listings" && view === "map";
    }
    return path.startsWith(href);
  };

  return (
    <div className="bnav">
      {items.map((it) => {
        if (it.fab) {
          return (
            <Link key={it.key} href={it.href} className="bn fab-wrap">
              <div className="bfab">
                <i className="ti ti-plus"></i>
              </div>
              <div className="blbl">Qo'shish</div>
            </Link>
          );
        }
        return (
          <Link
            key={it.key}
            href={it.href}
            className={"bn" + (isActive(it.href) ? " on" : "")}
          >
            <i className={"ti " + it.icon}></i>
            <div className="blbl">{it.label}</div>
          </Link>
        );
      })}
    </div>
  );
}
