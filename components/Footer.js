"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="wrap" style={{ marginTop: 40, borderTop: "1px solid var(--sand)", padding: "36px 0" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
        <Link className="logo" href="/">
          <span className="dot"></span>Joy
        </Link>
        <div className="fnav" style={{ display: "flex", gap: 22 }}>
          <Link href="/about" style={{ color: "var(--text2)", textDecoration: "none" }}>Biz haqimizda</Link>
          <Link href="/help" style={{ color: "var(--text2)", textDecoration: "none" }}>Yordam</Link>
          <Link href="/terms" style={{ color: "var(--text2)", textDecoration: "none" }}>Shartlar</Link>
          <Link href="/contact" style={{ color: "var(--text2)", textDecoration: "none" }}>Aloqa</Link>
        </div>
      </div>

      {/* Social media icons */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); alert("Tez kunda"); }}
          style={{ color: "var(--text2)", fontSize: 22, textDecoration: "none", transition: "color 0.2s" }}
          title="Telegram"
        >
          <i className="ti ti-brand-telegram"></i>
        </a>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); alert("Tez kunda"); }}
          style={{ color: "var(--text2)", fontSize: 22, textDecoration: "none", transition: "color 0.2s" }}
          title="Instagram"
        >
          <i className="ti ti-brand-instagram"></i>
        </a>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); alert("Tez kunda"); }}
          style={{ color: "var(--text2)", fontSize: 22, textDecoration: "none", transition: "color 0.2s" }}
          title="Facebook"
        >
          <i className="ti ti-brand-facebook"></i>
        </a>
      </div>

      {/* Contact info */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20, fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
        <a href="mailto:info@joy.uz" style={{ color: "var(--text2)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-mail" style={{ fontSize: 16 }}></i> info@joy.uz
        </a>
        <a href="tel:+998712000000" style={{ color: "var(--text2)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-phone" style={{ fontSize: 16 }}></i> +998 71 200 00 00
        </a>
      </div>

      <div style={{ fontSize: 13, color: "var(--muted)" }}>© {new Date().getFullYear()} Joy.uz</div>
    </footer>
  );
}
