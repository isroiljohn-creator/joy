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
  const [companyPhone, setCompanyPhone] = useState(
    user?.phone && !user.phone.startsWith("google_") ? user.phone : ""
  );
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
      projectName, projectLocation, projectBudget,
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
      background: "var(--cream, #FAF7F3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 580 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <a href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            color: "var(--ink, #19130F)", fontSize: 22, fontWeight: 800,
            letterSpacing: -1, textDecoration: "none", marginBottom: 10
          }}>
            <span style={{
              width: 38, height: 38, borderRadius: 10,
              background: "var(--orange, #E06334)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, color: "#fff", flexShrink: 0
            }}>
              <i className="ti ti-building-skyscraper"></i>
            </span>
            mask<span style={{ color: "var(--orange, #E06334)" }}>on</span>{" "}
            <span style={{
              background: "var(--orange, #E06334)",
              color: "#fff", fontSize: 11, fontWeight: 700,
              padding: "2px 8px", borderRadius: 6, letterSpacing: 1,
              alignSelf: "center", marginLeft: 2
            }}>ERP</span>
          </a>
          <p style={{
            color: "var(--muted, #6E665F)", fontSize: 14, margin: 0, lineHeight: 1.6
          }}>
            Qurilish loyihalari va sotuv boshqaruv tizimi
          </p>
        </div>

        {/* Steps indicator */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28, justifyContent: "center" }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              width: s === step ? 28 : 8, height: 8, borderRadius: 4,
              background: s <= step ? "var(--orange, #E06334)" : "var(--sand, #E9E3DB)",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: "#fff",
          border: "1px solid var(--sand, #E9E3DB)",
          borderRadius: 20,
          padding: "40px",
          boxShadow: "0 4px 24px rgba(25,19,15,0.07)",
        }}>
          <form onSubmit={handleSubmit}>

            {/* ── Step 1: Kompaniya ── */}
            {step === 1 && (
              <>
                <div style={{ marginBottom: 28 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "var(--orange-tint, #F6E2D8)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 16,
                  }}>
                    <i className="ti ti-building" style={{ color: "var(--orange, #E06334)", fontSize: 22 }}></i>
                  </div>
                  <h1 style={{
                    color: "var(--ink, #19130F)", fontSize: 22, fontWeight: 700,
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    letterSpacing: -0.5, margin: "0 0 6px"
                  }}>
                    Kompaniyangizni sozlang
                  </h1>
                  <p style={{ color: "var(--muted, #6E665F)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                    Qurilish kompaniyangiz haqida asosiy ma&apos;lumotlarni kiriting
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Field label="Kompaniya nomi" required>
                    <input
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="Masalan: Atlantis Qurilish MChJ"
                      required
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Telefon raqam">
                    <input
                      value={companyPhone}
                      onChange={e => setCompanyPhone(e.target.value)}
                      placeholder="+998 90 000 00 00"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Manzil">
                    <input
                      value={companyAddress}
                      onChange={e => setCompanyAddress(e.target.value)}
                      placeholder="Masalan: Toshkent, Yunusobod tumani"
                      style={inputStyle}
                    />
                  </Field>
                </div>

                {error && <ErrorBox msg={error} />}

                <button
                  type="button"
                  onClick={() => {
                    if (!companyName.trim()) { setError("Kompaniya nomi majburiy"); return; }
                    setError("");
                    setStep(2);
                  }}
                  style={btnPrimary}
                >
                  Davom etish <i className="ti ti-arrow-right" style={{ marginLeft: 6 }}></i>
                </button>
              </>
            )}

            {/* ── Step 2: Birinchi loyiha ── */}
            {step === 2 && (
              <>
                <div style={{ marginBottom: 28 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      background: "none", border: "none",
                      color: "var(--muted, #6E665F)", cursor: "pointer",
                      padding: 0, marginBottom: 16,
                      display: "flex", alignItems: "center", gap: 6, fontSize: 13
                    }}
                  >
                    <i className="ti ti-arrow-left"></i> Orqaga
                  </button>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "var(--orange-tint, #F6E2D8)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 16,
                  }}>
                    <i className="ti ti-crane" style={{ color: "var(--orange, #E06334)", fontSize: 22 }}></i>
                  </div>
                  <h2 style={{
                    color: "var(--ink, #19130F)", fontSize: 22, fontWeight: 700,
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    letterSpacing: -0.5, margin: "0 0 6px"
                  }}>
                    Birinchi loyihani qo&apos;shing
                  </h2>
                  <p style={{ color: "var(--muted, #6E665F)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                    Hozirda qurayotgan yoki sotayotgan ob&apos;ektingizni kiriting
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Field label="Loyiha / ob'ekt nomi" required>
                    <input
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                      placeholder="Masalan: Atlantis Residence, 24-uy"
                      required
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Manzil / joylashuv">
                    <input
                      value={projectLocation}
                      onChange={e => setProjectLocation(e.target.value)}
                      placeholder="Masalan: Toshkent, Mirzo Ulug'bek tumani"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Umumiy byudjet (so'mda)">
                    <input
                      value={projectBudget}
                      onChange={e => setProjectBudget(e.target.value.replace(/\D/g, ""))}
                      placeholder="Masalan: 5000000000"
                      type="text"
                      inputMode="numeric"
                      style={inputStyle}
                    />
                  </Field>
                </div>

                {error && <ErrorBox msg={error} />}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...btnPrimary, opacity: loading ? 0.75 : 1 }}
                >
                  {loading ? (
                    <>
                      <i className="ti ti-loader-2" style={{ marginRight: 8, animation: "spin 1s linear infinite" }}></i>
                      Yaratilmoqda...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-rocket" style={{ marginRight: 8 }}></i>
                      ERP panelni ishga tushirish
                    </>
                  )}
                </button>

                <p style={{
                  color: "var(--muted, #6E665F)", fontSize: 12,
                  textAlign: "center", marginTop: 16, marginBottom: 0, lineHeight: 1.6
                }}>
                  Keyinchalik xodimlar, xonadonlar va boshqa ma&apos;lumotlarni qo&apos;shishingiz mumkin
                </p>
              </>
            )}
          </form>
        </div>

        {/* Features row */}
        <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
          {[
            { icon: "ti-building-skyscraper", text: "Loyiha va xonadonlar" },
            { icon: "ti-users", text: "Lidlar va sotuv" },
            { icon: "ti-chart-bar", text: "Tahlil va hisobotlar" },
          ].map(f => (
            <div key={f.icon} style={{
              flex: 1, minWidth: 140,
              background: "#fff",
              border: "1px solid var(--sand, #E9E3DB)",
              borderRadius: 12, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "var(--orange-tint, #F6E2D8)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <i className={`ti ${f.icon}`} style={{ color: "var(--orange, #E06334)", fontSize: 16 }}></i>
              </span>
              <span style={{ color: "var(--ink, #19130F)", fontSize: 13, fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: var(--orange, #E06334) !important; box-shadow: 0 0 0 3px var(--orange-tint, #F6E2D8) !important; outline: none; }
      `}</style>
    </div>
  );
}

/* ── helpers ── */
function Field({ label, required, children }) {
  return (
    <div>
      <label style={{
        color: "var(--ink, #19130F)", fontSize: 13, display: "block",
        marginBottom: 7, fontWeight: 600
      }}>
        {label}{required && <span style={{ color: "var(--orange, #E06334)", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      marginTop: 16, padding: "12px 16px",
      background: "#fff5f5",
      border: "1px solid #fecaca",
      borderRadius: 10, color: "#b91c1c", fontSize: 13
    }}>
      <i className="ti ti-alert-circle" style={{ marginRight: 8 }}></i>{msg}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  background: "#fff",
  border: "1.5px solid var(--sand, #E9E3DB)",
  borderRadius: 10,
  color: "var(--ink, #19130F)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const btnPrimary = {
  width: "100%",
  marginTop: 24,
  padding: "14px 24px",
  background: "var(--orange, #E06334)",
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
  letterSpacing: -0.3,
  transition: "background 0.2s",
};
