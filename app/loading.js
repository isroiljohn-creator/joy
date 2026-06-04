export default function Loading() {
  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      {/* Navbar skeleton */}
      <div
        style={{
          borderBottom: "1px solid var(--sand)",
          padding: "14px 28px",
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 70,
            height: 28,
            borderRadius: 8,
            background: "var(--sand)",
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
        <div style={{ flex: 1 }} />
        <div
          style={{
            width: 100,
            height: 38,
            borderRadius: 24,
            background: "var(--sand)",
            animation: "shimmer 1.5s ease-in-out infinite",
            animationDelay: "0.1s",
          }}
        />
        <div
          style={{
            width: 130,
            height: 38,
            borderRadius: 24,
            background: "var(--sand)",
            animation: "shimmer 1.5s ease-in-out infinite",
            animationDelay: "0.2s",
          }}
        />
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--sand)",
            animation: "shimmer 1.5s ease-in-out infinite",
            animationDelay: "0.3s",
          }}
        />
      </div>

      {/* Content skeleton */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 28px",
        }}
      >
        {/* Title skeleton */}
        <div
          style={{
            width: 320,
            height: 36,
            borderRadius: 10,
            background: "var(--sand)",
            marginBottom: 10,
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: 200,
            height: 18,
            borderRadius: 8,
            background: "var(--sand)",
            marginBottom: 32,
            animation: "shimmer 1.5s ease-in-out infinite",
            animationDelay: "0.15s",
          }}
        />

        {/* Cards grid skeleton */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 22,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                border: "1px solid var(--sand)",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: 190,
                  background: "var(--sand)",
                  animation: "shimmer 1.5s ease-in-out infinite",
                  animationDelay: `${i * 0.15}s`,
                }}
              />
              <div style={{ padding: "15px 17px 17px" }}>
                <div
                  style={{
                    width: 120,
                    height: 24,
                    borderRadius: 8,
                    background: "var(--sand)",
                    marginBottom: 10,
                    animation: "shimmer 1.5s ease-in-out infinite",
                    animationDelay: `${i * 0.15 + 0.1}s`,
                  }}
                />
                <div
                  style={{
                    width: "80%",
                    height: 16,
                    borderRadius: 6,
                    background: "var(--sand)",
                    marginBottom: 8,
                    animation: "shimmer 1.5s ease-in-out infinite",
                    animationDelay: `${i * 0.15 + 0.2}s`,
                  }}
                />
                <div
                  style={{
                    width: "60%",
                    height: 14,
                    borderRadius: 6,
                    background: "var(--sand)",
                    marginBottom: 14,
                    animation: "shimmer 1.5s ease-in-out infinite",
                    animationDelay: `${i * 0.15 + 0.3}s`,
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: 16,
                        background: "var(--sand)",
                        animation: "shimmer 1.5s ease-in-out infinite",
                        animationDelay: `${i * 0.15 + 0.35 + j * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
