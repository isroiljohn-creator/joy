"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmPaymentAction } from "@/app/actions";

export default function PaymentMockClient({ user, txId, amount, type }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await confirmPaymentAction(parseInt(txId));
      if (res && res.success) {
        // To'lov muvaffaqiyatli, profilga qaytaramiz
        router.push("/profile?payment_success=true");
      } else {
        setError(res?.error || "To'lov tasdiqlashda xatolik");
        setLoading(false);
      }
    } catch (err) {
      setError("Tarmoq xatosi");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/profile");
  };

  const title = type === "subscription" ? "maskon.uz Premium Obuna" : "E'lonni Topga chiqarish";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)" }}>
      <div style={{ background: "var(--card-bg)", padding: 40, borderRadius: 24, width: "100%", maxWidth: 400, border: "1px solid var(--sand)", boxShadow: "0 10px 40px rgba(0,0,0,0.05)" }}>
        
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--orange-tint)", color: "var(--orange)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
            <i className="ti ti-credit-card"></i>
          </div>
          <h1 className="display" style={{ fontSize: 24, marginBottom: 8 }}>To'lov tizimi (Test)</h1>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Hozircha Click/Payme o'rniga "Mock" to'lov oynasidasiz.</p>
        </div>

        <div style={{ background: "var(--cream)", padding: 20, borderRadius: 16, marginBottom: 30, border: "1px solid var(--sand)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
            <span style={{ color: "var(--muted)" }}>Xizmat:</span>
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>{title}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
            <span style={{ color: "var(--muted)" }}>Mijoz:</span>
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>{user.name}</span>
          </div>
          <div style={{ height: 1, background: "var(--sand)", margin: "16px 0" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800 }}>
            <span style={{ color: "var(--ink)" }}>Jami:</span>
            <span style={{ color: "var(--orange)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {parseInt(amount).toLocaleString()} UZS
            </span>
          </div>
        </div>

        {error && (
          <div style={{ padding: 12, background: "#fee2e2", color: "#dc2626", borderRadius: 12, fontSize: 13, marginBottom: 20, textAlign: "center" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button 
            className="cbtn primary" 
            style={{ width: "100%", padding: 16, fontSize: 16 }}
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? "To'lanmoqda..." : "To'lovni tasdiqlash"}
          </button>
          
          <button 
            className="cbtn gh" 
            style={{ width: "100%", padding: 16, fontSize: 16 }}
            onClick={handleCancel}
            disabled={loading}
          >
            Bekor qilish
          </button>
        </div>

      </div>
    </div>
  );
}
