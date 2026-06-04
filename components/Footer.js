"use client";
import Link from "next/link";

export default function Footer() {
  const handleAlert = (topic) => {
    alert(`${topic} bo'limi tez kunda ishga tushadi.`);
  };

  return (
    <footer className="wrap" style={{ marginTop: 40, borderTop: "1px solid var(--sand)", padding: "36px 0" }}>
      <Link className="logo" href="/">
        <span className="dot"></span>Joy
      </Link>
      <div className="fnav" style={{ display: "flex", gap: 22 }}>
        <a style={{ cursor: "pointer" }} onClick={() => handleAlert("Biz haqimizda")}>Biz haqimizda</a>
        <a style={{ cursor: "pointer" }} onClick={() => handleAlert("Yordam")}>Yordam</a>
        <a style={{ cursor: "pointer" }} onClick={() => handleAlert("Shartlar")}>Shartlar</a>
        <a style={{ cursor: "pointer" }} onClick={() => handleAlert("Aloqa")}>Aloqa</a>
      </div>
      <div>© 2026 Joy.uz</div>
    </footer>
  );
}
