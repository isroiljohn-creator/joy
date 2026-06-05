"use client";
import { useState, useEffect, useRef } from "react";

export default function ShareBtn({ btnClass = "ibtn" }) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleShare = async () => {
    // Use Web Share API if available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // User cancelled or error — fall through to dropdown
        if (err.name === "AbortError") return;
      }
    }
    // Fallback: show dropdown menu
    setShowMenu((prev) => !prev);
  };

  const shareViaTelegram = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://t.me/share/url?url=${url}`, "_blank");
    setShowMenu(false);
  };

  const shareViaWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://wa.me/?text=${url}`, "_blank");
    setShowMenu(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Nusxalashda xatolik:", err);
    }
    setShowMenu(false);
  };

  const menuItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    border: "none",
    background: "none",
    width: "100%",
    cursor: "pointer",
    fontSize: 14,
    color: "var(--ink)",
    borderRadius: 8,
    transition: "background 0.15s",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button
        type="button"
        className={btnClass}
        onClick={handleShare}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        title="Ulashish"
      >
        <i className="ti ti-share"></i>
      </button>

      {showMenu && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 8,
            background: "#fff",
            borderRadius: 14,
            padding: 6,
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            border: "1px solid var(--sand)",
            zIndex: 200,
            minWidth: 180,
          }}
        >
          <button
            style={menuItemStyle}
            onClick={shareViaTelegram}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--orange-tint)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <i className="ti ti-brand-telegram" style={{ fontSize: 18, color: "var(--orange)" }}></i>
            Telegram
          </button>
          <button
            style={menuItemStyle}
            onClick={shareViaWhatsApp}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--orange-tint)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <i className="ti ti-brand-whatsapp" style={{ fontSize: 18, color: "var(--orange)" }}></i>
            WhatsApp
          </button>
          <button
            style={menuItemStyle}
            onClick={copyLink}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--orange-tint)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <i className="ti ti-copy" style={{ fontSize: 18, color: "var(--orange)" }}></i>
            Nusxa olish
          </button>
        </div>
      )}

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
            zIndex: 100,
          }}
        >
          Havola nusxalandi!
        </div>
      )}
    </div>
  );
}
