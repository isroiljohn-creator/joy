import Link from "next/link";

export default function NotFound() {
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

      {/* Animated illustration */}
      <div
        style={{
          position: "relative",
          width: 180,
          height: 180,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "var(--orange-tint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "notFoundPulse 3s ease-in-out infinite",
          }}
        >
          <i
            className="ti ti-home-off"
            style={{
              fontSize: 72,
              color: "var(--orange)",
              animation: "notFoundFloat 3s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* 404 text */}
      <h1
        className="display"
        style={{
          fontSize: 120,
          fontWeight: 700,
          lineHeight: 1,
          background: "linear-gradient(135deg, var(--orange), var(--orange-dark))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: 12,
        }}
      >
        404
      </h1>

      <h2
        className="display"
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--ink)",
          marginBottom: 12,
        }}
      >
        Sahifa topilmadi
      </h2>

      <p
        style={{
          fontSize: 16,
          color: "var(--text2)",
          maxWidth: 420,
          lineHeight: 1.6,
          marginBottom: 32,
        }}
      >
        Siz izlayotgan sahifa mavjud emas yoki ko'chirilgan. Bosh sahifaga
        qaytib, kerakli ma'lumotni topishingiz mumkin.
      </p>

      {/* Back button */}
      <Link
        href="/"
        className="btn-add"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 15,
          fontWeight: 600,
          padding: "14px 28px",
          textDecoration: "none",
        }}
      >
        <i className="ti ti-arrow-left" />
        Bosh sahifaga qaytish
      </Link>

      <style>{`
        @keyframes notFoundPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes notFoundFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
