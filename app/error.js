"use client";

import Link from "next/link";

export default function Error({ error, reset }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--cream)",
        padding: "40px 28px",
        textAlign: "center",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          position: "absolute",
          top: 28,
          left: 28,
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: 25,
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          color: "var(--ink)",
        }}
      >
        <span
          style={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: "var(--orange)",
            display: "inline-block",
          }}
        />
        Joy
      </Link>

      {/* Error icon */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "var(--orange-tint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
        }}
      >
        <i
          className="ti ti-alert-triangle"
          style={{ fontSize: 56, color: "var(--orange)" }}
        />
      </div>

      <h1
        className="display"
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "var(--ink)",
          marginBottom: 12,
        }}
      >
        Xatolik yuz berdi
      </h1>

      <p
        style={{
          fontSize: 16,
          color: "var(--text2)",
          maxWidth: 420,
          lineHeight: 1.6,
          marginBottom: 16,
        }}
      >
        Kutilmagan xatolik ro'y berdi. Iltimos, qayta urinib ko'ring yoki bosh
        sahifaga qayting.
      </p>

      {error && (
        <div style={{
          background: "#fee2e2",
          border: "1.5px solid #ef4444",
          color: "#991b1b",
          padding: 16,
          borderRadius: 12,
          fontSize: 13,
          fontFamily: "monospace",
          textAlign: "left",
          maxWidth: 650,
          width: "90%",
          boxSizing: "border-box",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          marginBottom: 32
        }}>
          <strong style={{ color: "#7f1d1d" }}>Xatolik tafsilotlari:</strong>
          <div style={{ marginTop: 4 }}>{error.message || String(error)}</div>
          {error.stack && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: "pointer", fontWeight: "bold", outline: "none", color: "#7f1d1d" }}>
                Stack trace ko&apos;rish
              </summary>
              <pre style={{ marginTop: 8, fontSize: 11, color: "#991b1b", overflowX: "auto" }}>{error.stack}</pre>
            </details>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => reset()}
          className="btn-add"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 15,
            fontWeight: 600,
            padding: "14px 28px",
            cursor: "pointer",
          }}
        >
          <i className="ti ti-refresh" />
          Qayta urinish
        </button>

        <Link
          href="/"
          className="btn-ghost"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 15,
            padding: "14px 28px",
            textDecoration: "none",
          }}
        >
          <i className="ti ti-home" />
          Bosh sahifaga
        </Link>
      </div>
    </div>
  );
}
