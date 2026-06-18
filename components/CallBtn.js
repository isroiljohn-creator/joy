"use client";
import { useState } from "react";

export default function CallBtn({ phone = "+998 90 123 45 67" }) {
  const [revealed, setRevealed] = useState(false);

  const cleanPhone = phone.replace(/\s/g, "");

  if (!revealed) {
    return (
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); setRevealed(true); }}
        className="cbtn primary"
        style={{ textDecoration: "none" }}
      >
        <i className="ti ti-phone" style={{ fontSize: 18, flexShrink: 0 }}></i>
        Qo&apos;ng&apos;iroq qilish
      </a>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      {/* Telefon raqami */}
      <div style={{
        textAlign: "center",
        fontWeight: 700,
        fontSize: 16,
        color: "var(--ink)",
        padding: "4px 0 2px",
        letterSpacing: "0.02em",
      }}>
        {phone}
      </div>

      {/* Qo'ng'iroq — katta tugma */}
      <a
        href={`tel:${cleanPhone}`}
        className="cbtn primary"
        style={{ textDecoration: "none" }}
      >
        <i className="ti ti-phone" style={{ fontSize: 18, flexShrink: 0 }}></i>
        Qo&apos;ng&apos;iroq
      </a>

      {/* WhatsApp + Telegram — ikki teng tugma */}
      <div style={{ display: "flex", gap: 8 }}>
        <a
          href={`https://wa.me/${cleanPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="cbtn gh"
          style={{ textDecoration: "none", flex: 1 }}
        >
          <i className="ti ti-brand-whatsapp" style={{ fontSize: 17, flexShrink: 0 }}></i>
          WhatsApp
        </a>
        <a
          href={`https://t.me/${cleanPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="cbtn gh"
          style={{ textDecoration: "none", flex: 1 }}
        >
          <i className="ti ti-brand-telegram" style={{ fontSize: 17, flexShrink: 0 }}></i>
          Telegram
        </a>
      </div>
    </div>
  );
}
