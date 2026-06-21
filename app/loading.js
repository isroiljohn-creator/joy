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
        className="logo"
        style={{
          fontSize: 32,
          color: "var(--ink, #19130F)",
          opacity: 0.9,
        }}
      >
        mask<span className="logo-pin" style={{ animation: "logoPulse 1.2s ease-in-out infinite" }}><i className="ti ti-map-pin-filled"></i></span>n
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
              background: "var(--orange, #E06334)",
              animation: `dotBounce 1s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>


    </div>
  );
}
