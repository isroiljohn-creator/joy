"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/ui";

export default function PremiumClient({ user }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const premiumPrice = 50000; // 50,000 UZS / oy

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscription", amount: premiumPrice })
      });
      const data = await res.json();
      if (data.success && data.paymentUrl) {
        router.push(data.paymentUrl);
      } else {
        alert("Xatolik: " + (data.error || "Ulanishda muammo"));
        setLoading(false);
      }
    } catch (err) {
      alert("Tarmoq xatosi");
      setLoading(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="page-wrap" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 20, background: "var(--orange-tint)", color: "var(--orange)", fontSize: 32, marginBottom: 20 }}>
            <i className="ti ti-rosette-discount-check-filled"></i>
          </div>
          <h1 className="display" style={{ fontSize: 32, marginBottom: 12 }}>Joy.uz Premium</h1>
          <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 400, margin: "0 auto" }}>
            Tasdiqlangan foydalanuvchi maqomini oling va e'lonlaringiz ishonchliligini oshiring.
          </p>
        </div>

        {user.isVerified ? (
          <div style={{ background: "var(--card-bg)", padding: 40, borderRadius: 24, border: "2px solid var(--orange)", textAlign: "center" }}>
            <h2 className="display" style={{ fontSize: 24, marginBottom: 12 }}>Siz allaqachon Premium obunachisiz!</h2>
            <p style={{ color: "var(--text2)" }}>Sizning e'lonlaringiz mijozlarga ishonchli ko'rinadi va profilingiz tasdiqlangan.</p>
            <button className="cbtn gh" style={{ marginTop: 24 }} onClick={() => router.push("/profile")}>
              Profilga qaytish
            </button>
          </div>
        ) : (
          <div style={{ background: "var(--card-bg)", borderRadius: 24, overflow: "hidden", border: "1px solid var(--sand)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 40, background: "linear-gradient(135deg, var(--card-bg), var(--cream))" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--orange)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Premium Obuna</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: 48, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, color: "var(--ink)" }}>{premiumPrice.toLocaleString()}</span>
                <span style={{ color: "var(--muted)", fontWeight: 500 }}>UZS / oy</span>
              </div>
              <p style={{ color: "var(--text2)", fontSize: 15 }}>
                1 oy davomida to'liq imtiyozlarga ega bo'ling. To'lov xavfsiz himoyalangan.
              </p>
            </div>
            
            <div style={{ padding: 40, background: "var(--card-bg)", flex: 1 }}>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px", display: "flex", flexDirection: "column", gap: 16 }}>
                <li style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <i className="ti ti-check" style={{ color: "var(--orange)", fontSize: 20 }}></i>
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>Tasdiqlangan foydalanuvchi belgisi (✔️)</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <i className="ti ti-check" style={{ color: "var(--orange)", fontSize: 20 }}></i>
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>E'lonlarga 2x ko'proq ishonch</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <i className="ti ti-check" style={{ color: "var(--orange)", fontSize: 20 }}></i>
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>Xaridorlar to'g'ridan to'g'ri ishonadi</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <i className="ti ti-check" style={{ color: "var(--orange)", fontSize: 20 }}></i>
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>24/7 Qo'llab quvvatlash xizmati</span>
                </li>
              </ul>

              <button 
                className="cbtn primary" 
                style={{ width: "100%", padding: 18, fontSize: 16 }}
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? "Kuting..." : "Premium sotib olish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
