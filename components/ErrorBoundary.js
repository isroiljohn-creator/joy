"use client";
import { useEffect, useState } from "react";

export default function ErrorBoundary({ children }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (e) => {
      setError({
        message: e.message || "Uncaught error",
        stack: e.error?.stack || "No stack trace available"
      });
    };

    const handleRejection = (e) => {
      setError({
        message: e.reason?.message || String(e.reason) || "Unhandled promise rejection",
        stack: e.reason?.stack || "No stack trace available"
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  if (error) {
    return (
      <div style={{
        position: "fixed",
        inset: 16,
        padding: 24,
        color: "#dc2626",
        background: "#fee2e2",
        fontFamily: "monospace",
        fontSize: 12,
        whiteSpace: "pre-wrap",
        overflowY: "auto",
        borderRadius: 16,
        border: "2px solid #ef4444",
        zIndex: 99999
      }}>
        <h3 style={{ margin: "0 0 10px", color: "#991b1b" }}>Kritik Xatolik (Global Error):</h3>
        <p style={{ margin: "0 0 16px", lineHeight: 1.5, fontWeight: "bold" }}>{error.message}</p>
        <pre style={{ margin: 0, fontSize: 10, background: "rgba(0,0,0,0.05)", padding: 10, borderRadius: 8 }}>{error.stack}</pre>
        <button
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            background: "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Qayta yuklash
        </button>
      </div>
    );
  }

  return children;
}
