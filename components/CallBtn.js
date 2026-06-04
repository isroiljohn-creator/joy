"use client";
import { useState } from "react";

export default function CallBtn({ phone = "+998 90 123 45 67" }) {
  const [revealed, setRevealed] = useState(false);

  const cleanPhone = phone.replace(/\s/g, "");

  const handleClick = (e) => {
    if (!revealed) {
      e.preventDefault();
      setRevealed(true);
    }
  };

  if (!revealed) {
    return (
      <a
        href="#"
        onClick={handleClick}
        className="cbtn primary"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 0.2s ease",
        }}
      >
        <i className="ti ti-phone"></i>
        {"Qo'ng'iroq qilish"}
      </a>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      {/* Phone number display */}
      <div style={{
        textAlign: "center",
        fontWeight: 600,
        fontSize: 15,
        color: "var(--ink)",
        padding: "6px 0",
      }}>
        {phone}
      </div>

      {/* Action buttons row */}
      <div style={{ display: "flex", gap: 8 }}>
        <a
          href={`tel:${cleanPhone}`}
          className="cbtn primary"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            flex: 1,
            padding: "10px 0",
            margin: 0,
            fontSize: 13,
          }}
        >
          <i className="ti ti-phone" style={{ fontSize: 18 }}></i>
          {"Qo'ng'iroq"}
        </a>

        <a
          href={`https://wa.me/${cleanPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="cbtn gh"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            flex: 1,
            padding: "10px 0",
            margin: 0,
            fontSize: 13,
            color: "var(--ink)",
          }}
        >
          <i className="ti ti-brand-whatsapp" style={{ fontSize: 18 }}></i>
          WhatsApp
        </a>

        <a
          href={`https://t.me/${cleanPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="cbtn gh"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            flex: 1,
            padding: "10px 0",
            margin: 0,
            fontSize: 13,
            color: "var(--ink)",
          }}
        >
          <i className="ti ti-brand-telegram" style={{ fontSize: 18 }}></i>
          Telegram
        </a>
      </div>
    </div>
  );
}
