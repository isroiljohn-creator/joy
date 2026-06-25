"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { erpSetupAction } from "@/app/erp-actions";

export default function ErpOnboarding({ user }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState(user?.phone && !user.phone.startsWith("google_") ? user.phone : "");
  const [companyAddress, setCompanyAddress] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectBudget, setProjectBudget] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await erpSetupAction({
      companyName, companyPhone, companyAddress,
      projectName, projectLocation, projectBudget
    });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else {
      router.refresh();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Bricolage Grotesque', sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 600 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            color: "#fff", fontSize: 24, fontWeight: 800, letterSpacing: -1, marginBottom: 8
          }}>
            <span style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #e94560, #c62a47)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18
            }}>
              <i className="ti ti-building-skyscraper" style={{ color: "#fff" }}></i>
            </span>
            maskon <span style={{ color: "#e94560" }}>ERP</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0 }}>
            Qurilish loyihalari va sotuv boshqaruv tizimi
          </p>
        </div>

        {/* Steps indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, justifyContent: "center" }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              width: s === step ? 32 : 8, height: 8, borderRadius: 4,
              background: s === step ? "#e94560" : s < step ? "rgba(233,69,96,0.4)" : "rgba(255,255,255,0.1)",
              transition: "all 0.3s ease"
            }} />
          ))}
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "40px",
          backdropFilter: "blur(20px)"
        }}>
          <form onSubmit={handleSubmit}>

            {/* Step 1: Kompaniya ma'lumotlari */}
            {step === 1 && (
              <>
                <div style={{ marginBottom: 28 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "linear-gradient(135deg, rgba(233,69,96,0.2), rgba(233,69,96,0.05))",
                    border: "1px solid rgba(233,69,96,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 16
                  }}>
                    <i className="ti ti-building" style={{ color: "#e94560", fontSize: 22 }}></i>
                  </div>
                  <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>
                    Kompaniyangizni sozlang
                  </h1>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                    Qurilish kompaniyangiz haqida asosiy ma'lumotlarni kiriting
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, display: "block", marginBottom: 8, fontWeight: 500 }}>
                      Kompaniya nomi <span style={{ color: "#e94560" }}>*</span>
                    </label>
                    <input
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="Masalan: Atlantis Qurilish MChJ"
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, display: "block", marginBottom: 8, fontWeight: 500 }}>
                      Telefon raqam
                    </label>
                    <input
                      value={companyPhone}
                      onChange={e => setCompanyPhone(e.target.value)}
                      placeholder="+998 90 000 00 00"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, display: "block", marginBottom: 8, fontWeight: 500 }}>
                      Manzil
                    </label>
                    <input
                      value={companyAddress}
                      onChange={e => setCompanyAddress(e.target.value)}
                      placeholder="Masalan: Toshkent, Yunusobod tumani"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!companyName.trim()) { setError("Kompaniya nomi majburiy"); return; }
                    setError("");
                    setStep(2);
                  }}
                  style={btnStyle}
                >
                  Davom etish <i className="ti ti-arrow-right" style={{ marginLeft: 6 }}></i>
                </button>
              </>
            )}

            {/* Step 2: Birinchi loyiha */}
            {step === 2 && (
              <>
                <div style={{ marginBottom: 28 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
                  >
                    <i className="ti ti-arrow-left"></i> Orqaga
                  </button>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "linear-gradient(135deg, rgba(233,69,96,0.2), rgba(233,69,96,0.05))",
                    border: "1px solid rgba(233,69,96,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 16
                  }}>
                    <i className="ti ti-crane" style={{ color: "#e94560", fontSize: 22 }}></i>
                  </div>
                  <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>
                    Birinchi loyihani qo'shing
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                    Hozirda qurayotgan yoki sotayotgan ob'ektingizni kiriting
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, display: "block", marginBottom: 8, fontWeight: 500 }}>
                      Loyiha / ob'ekt nomi <span style={{ color: "#e94560" }}>*</span>
                    </label>
                    <input
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                      placeholder="Masalan: Atlantis Residence, 24-uy"
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, display: "block", marginBottom: 8, fontWeight: 500 }}>
                      Manzil / joylashuv
                    </label>
                    <input
                      value={projectLocation}
                      onChange={e => setProjectLocation(e.target.value)}
                      placeholder="Masalan: Toshkent, Mirzo Ulug'bek tumani"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, display: "block", marginBottom: 8, fontWeight: 500 }}>
                      Umumiy byudjet (so'mda)
                    </label>
                    <input
                      value={projectBudget}
                      onChange={e => setProjectBudget(e.target.value.replace(/\D/g, ""))}
                      placeholder="Masalan: 5000000000"
                      type="text"
                      inputMode="numeric"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{
                    marginTop: 16, padding: "12px 16px",
                    background: "rgba(233,69,96,0.1)", border: "1px solid rgba(233,69,96,0.3)",
                    borderRadius: 10, color: "#e94560", fontSize: 13
                  }}>
                    <i className="ti ti-alert-circle" style={{ marginRight: 8 }}></i>{error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? (
                    <><i className="ti ti-loader-2" style={{ marginRight: 8, animation: "spin 1s linear infinite" }}></i>Yaratilmoqda...</>
                  ) : (
                    <><i className="ti ti-rocket" style={{ marginRight: 8 }}></i>ERP panelni ishga tushirish</>
                  )}
                </button>

                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textAlign: "center", marginTop: 16, marginBottom: 0, lineHeight: 1.6 }}>
                  Keyinchalik xodimlar, xonadonlar va boshqa ma'lumotlarni qo'shishingiz mumkin
                </p>
              </>
            )}
          </form>
        </div>

        {/* Features row */}
        <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
          {[
            { icon: "ti-building-skyscraper", text: "Loyiha va xonadonlar" },
            { icon: "ti-users", text: "Lidlar va sotuv" },
            { icon: "ti-chart-bar", text: "Tahlil va hisobotlar" }
          ].map(f => (
            <div key={f.icon} style={{
              flex: 1, minWidth: 140,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 10
            }}>
              <i className={`ti ${f.icon}`} style={{ color: "#e94560", fontSize: 18 }}></i>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "13px 16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.2s"
};

const btnStyle = {
  width: "100%",
  marginTop: 24,
  padding: "14px 24px",
  background: "linear-gradient(135deg, #e94560, #c62a47)",
  border: "none",
  borderRadius: 12,
  color: "#fff",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
  letterSpacing: -0.3
};
