"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
  const path = usePathname();
  const items = [
    { key: "home", icon: "ti-home", label: "Asosiy", href: "/" },
    { key: "saved", icon: "ti-bookmark", label: "Saqlangan", href: "/saved" },
    { key: "add", fab: true, href: "/add" },
    { key: "map", icon: "ti-map-2", label: "Xarita", href: "/listings" },
    { key: "profile", icon: "ti-user", label: "Profil", href: "/login" },
  ];

  const isActive = (href) => {
    if (href === "/") return path === "/";
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
