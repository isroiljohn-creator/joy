"use client";
import { useState } from "react";

export default function ShareBtn() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Nusxalashda xatolik:", err);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button 
        type="button" 
        className="ibtn" 
        onClick={handleShare}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        title="Ulashish"
      >
        <i className="ti ti-share"></i>
      </button>

      {copied && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: 8,
            background: "var(--ink)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: 8,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 100
          }}
        >
          Havola nusxalandi!
        </div>
      )}
    </div>
  );
}
