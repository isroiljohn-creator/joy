"use client";
import { useState, useEffect } from "react";

export default function AlertProvider({ children }) {
  const [alertState, setAlertState] = useState({ visible: false, message: "" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("maskon-theme") || localStorage.getItem("joy-theme");
      if (saved === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    // Intercept native browser alert
    const originalAlert = window.alert;
    
    window.alert = (message) => {
      // Prevent showing empty alerts
      if (message !== undefined && message !== null) {
        setAlertState({ visible: true, message: String(message) });
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  const handleClose = () => {
    setAlertState({ visible: false, message: "" });
  };

  return (
    <>
      {children}
      {alertState.visible && (
        <div style={modalOverlayStyle} onClick={handleClose}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div style={iconCircleStyle}>
                <i className="ti ti-bell-ringing" style={{ fontSize: 24, color: "var(--orange)" }}></i>
              </div>
              <h3 style={titleStyle}>Bildirishnoma</h3>
            </div>
            <div style={messageStyle}>
              {alertState.message.split("\n").map((line, idx) => (
                <p key={idx} style={{ margin: "4px 0" }}>{line}</p>
              ))}
            </div>
            <button 
              type="button" 
              style={closeButtonStyle}
              onClick={handleClose}
            >
              Tushunarli
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Inline styles aligning with maskon's design system
const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(26, 19, 14, 0.6)",
  backdropFilter: "blur(5px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 99999, // Ensure it is on top of everything
};

const modalBoxStyle = {
  background: "var(--card-bg, #fff)",
  borderRadius: 24,
  padding: "32px 24px 24px",
  width: "90%",
  maxWidth: 380,
  boxShadow: "0 24px 60px rgba(26, 19, 14, 0.16)",
  border: "1px solid var(--sand)",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  boxSizing: "border-box"
};

const modalHeaderStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  marginBottom: 16
};

const iconCircleStyle = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "var(--orange-tint)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const titleStyle = {
  fontFamily: "'Bricolage Grotesque', sans-serif",
  fontSize: 20,
  fontWeight: 700,
  color: "var(--ink)",
  margin: 0
};

const messageStyle = {
  fontSize: 14,
  color: "var(--text2)",
  lineHeight: 1.6,
  marginBottom: 24,
  padding: "0 8px",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  textAlign: "center",
  width: "100%",
  wordBreak: "break-word"
};

const closeButtonStyle = {
  background: "var(--orange)",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  padding: "13px 0",
  width: "100%",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s",
  fontFamily: "inherit",
  boxShadow: "0 4px 12px rgba(242, 89, 31, 0.2)",
  outline: "none"
};
