export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--cream, #FBF7F3)",
        gap: 20,
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: 28,
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "var(--ink, #1A130E)",
          opacity: 0.9,
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "var(--orange, #F2591F)",
            display: "inline-block",
            animation: "logoPulse 1.2s ease-in-out infinite",
          }}
        />
        Joy
      </div>

      {/* Uch nuqtali loader */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--orange, #F2591F)",
              animation: `dotBounce 1s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes logoPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
