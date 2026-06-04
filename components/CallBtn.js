"use client";
import { useState } from "react";

export default function CallBtn({ phone = "+998 90 123 45 67" }) {
  const [revealed, setRevealed] = useState(false);

  const handleClick = (e) => {
    if (!revealed) {
      e.preventDefault();
      setRevealed(true);
    }
  };

  return (
    <a
      href={revealed ? `tel:${phone.replace(/\s/g, "")}` : "#"}
      onClick={handleClick}
      className="cbtn primary"
      style={{
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "all 0.2s ease"
      }}
    >
      <i className="ti ti-phone"></i>
      {revealed ? `Qo'ng'iroq: ${phone}` : "Qo'ng'iroq qilish"}
    </a>
  );
}
