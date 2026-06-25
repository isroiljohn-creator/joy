"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { erpSetupAction } from "@/app/erp-actions";

// Light va dark uchun rang to'plamlari
const THEMES = {
  light: {
    bg:          "#FAF7F3",
    surface:     "#FFFFFF",
    ink:         "#19130F",
    muted:       "#6E665F",
    border:      "#E9E3DB",
    inputBg:     "#FFFFFF",
    inputBorder: "#E9E3DB",
    navBg:       "#FFFFFF",
    navBorder:   "#E9E3DB",
    featureBg:   "#FFFFFF",
    errorBg:     "#FEF2F2",
    errorBorder: "#FECACA",
    errorText:   "#B91C1C",
  },
  dark: {
    bg:          "#1A1612",
    surface:     "#231F1A",
    ink:         "#F5F0EB",
    muted:       "#8A837B",
    border:      "#2D2822",
    inputBg:     "#2D2822",
    inputBorder: "#3A342E",
    navBg:       "rgba(26,22,18,0.92)",
    navBorder:   "#2D2822",
    featureBg:   "#2D2822",
    errorBg:     "rgba(185,28,28,0.12)",
    errorBorder: "rgba(254,202,202,0.2)",
    errorText:   "#FCA5A5",
  },
};

// Brand ranglari — har ikkala temada bir xil
const orange      = "#E06334";
const orangeTint  = "#F6E2D8";
const orangeDark  = "#C8522A";
const orangeTintD = "#2D201A"; // dark mode uchun tint

export default function ErpOnboarding({ user }) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [cookieUser, setCookieUser] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [companyName,    setCompanyName]    = useState("");
  const [companyPhone,   setCompanyPhone]   = useState(
    user?.phone && !user.phone.startsWith("google_") ? user.phone : ""
  );
  const [companyAddress, setCompanyAddress] = useState("");
  const [projectName,    setProjectName]    = useState("");
  const [projectLocation,setProjectLocation]= useState("");
  const [projectBudget,  setProjectBudget]  = useState("");

  // Tema va cookie ni aniqlash
  useEffect(() => {
    const detectTheme = () => {
      const saved = localStorage.getItem("maskon-theme") || localStorage.getItem("joy-theme");
      setIsDark(saved === "dark" || document.documentElement.getAttribute("data-theme") === "dark");
    };
    detectTheme();
    window.addEventListener("maskon-theme-change", detectTheme);

    // Cookie user
    const cookies = document.cookie.split(";").reduce((acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = v;
      return acc;
    }, {});
    if (cookies.is_logged_in === "true" && cookies.user_display_name) {
      setCookieUser({ name: decodeURIComponent(cookies.user_display_name) });
    }

    return () => window.removeEventListener("maskon-theme-change", detectTheme);
  }, []);

  const c = isDark ? THEMES.dark : THEMES.light;
  const ot = isDark ? orangeTintD : orangeTint;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await erpSetupAction({
      companyName, companyPhone, companyAddress,
      projectName, projectLocation, projectBudget,
    });
    setLoading(false);
    if (res?.error) setError(res.error);
    else router.refresh();
  };

  const displayName = user?.name || cookieUser?.name || "";
  const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const iStyle = {
    width: "100%", padding: "11px 13px",
    background: c.inputBg, border: `1.5px solid ${c.inputBorder}`,
    borderRadius: 10, color: c.ink, fontSize: 14, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };
  const focusStyle = `
    .erp-ob-inp:focus {
      border-color: ${orange} !important;
      box-shadow: 0 0 0 3px ${ot} !important;
      outline: none;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  return (
    <div style={{ minHeight: "100vh", background: c.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Sticky Nav ── */}
      <header style={{
        background: c.navBg,
        borderBottom: `1px solid ${c.navBorder}`,
        backdropFilter: "blur(12px)",
        padding: "0 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 58, position: "sticky", top: 0, zIndex: 100,
      }}>
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 8,
          textDecoration: "none", color: c.ink,
          fontWeight: 800, fontSize: 18, letterSpacing: -0.5,
          fontFamily: "'Bricolage Grotesque', sans-serif",
        }}>
          <span style={{
            width: 30, height: 30, borderRadius: 7, background: orange,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 14, flexShrink: 0,
          }}>
            <i className="ti ti-building-skyscraper"></i>
          </span>
          mask<span style={{ color: orange }}>on</span>
          <span style={{
            background: orange, color: "#fff", fontSize: 9, fontWeight: 700,
            padding: "2px 6px", borderRadius: 5, letterSpacing: 1, alignSelf: "center",
          }}>ERP</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user || cookieUser ? (
            <Link href="/profile" style={{
              display: "flex", alignItems: "center", gap: 8,
              textDecoration: "none", fontSize: 14, fontWeight: 500, color: c.muted,
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: "50%",
                background: ot, color: orange,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 12, flexShrink: 0,
              }}>
                {initials || <i className="ti ti-user" style={{ fontSize: 14 }}></i>}
              </span>
              {displayName}
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ color: c.muted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
                Kirish
              </Link>
              <Link href="/register" style={{
                background: orange, color: "#fff",
                padding: "8px 18px", borderRadius: 20,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
              }}>
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "calc(100vh - 58px)", padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 560 }}>

          {/* Badge + heading */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: ot, borderRadius: 20, padding: "6px 14px", marginBottom: 14,
            }}>
              <i className="ti ti-rocket" style={{ color: orange, fontSize: 13 }}></i>
              <span style={{ color: orange, fontSize: 13, fontWeight: 700 }}>Bepul boshlang</span>
            </div>
            <h1 style={{
              color: c.ink, fontSize: 26, fontWeight: 800,
              fontFamily: "'Bricolage Grotesque', sans-serif",
              letterSpacing: -0.8, margin: "0 0 8px",
            }}>
              Biznesingizni ERP bilan boshqaring
            </h1>
            <p style={{ color: c.muted, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              2 daqiqada sozlang — loyihalar, sotuv va xodimlar boshqaruvi
            </p>
          </div>

          {/* Step dots */}
          <div style={{ display: "flex", gap: 6, marginBottom: 22, justifyContent: "center" }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                width: s === step ? 30 : 8, height: 8, borderRadius: 4,
                background: s <= step ? orange : c.border,
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>

          {/* Card */}
          <div style={{
            background: c.surface, border: `1px solid ${c.border}`,
            borderRadius: 20, padding: "34px",
            boxShadow: isDark
              ? "0 4px 24px rgba(0,0,0,0.4)"
              : "0 2px 20px rgba(25,19,15,0.06)",
          }}>
            <form onSubmit={handleSubmit}>

              {/* Step 1 */}
              {step === 1 && <>
                <StepHeader icon="ti-building" title="Kompaniyangiz"
                  desc="Qurilish kompaniyangiz haqida asosiy ma'lumotlar"
                  c={c} ot={ot} />
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label="Kompaniya nomi" required c={c}>
                    <input className="erp-ob-inp" value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="Masalan: Atlantis Qurilish MChJ" required style={iStyle} />
                  </Field>
                  <Field label="Telefon raqam" c={c}>
                    <input className="erp-ob-inp" value={companyPhone}
                      onChange={e => setCompanyPhone(e.target.value)}
                      placeholder="+998 90 000 00 00" style={iStyle} />
                  </Field>
                  <Field label="Manzil" c={c}>
                    <input className="erp-ob-inp" value={companyAddress}
                      onChange={e => setCompanyAddress(e.target.value)}
                      placeholder="Masalan: Toshkent, Yunusobod tumani" style={iStyle} />
                  </Field>
                </div>
                {error && <ErrBox msg={error} c={c} />}
                <button type="button" style={btn()} onClick={() => {
                  if (!companyName.trim()) { setError("Kompaniya nomi majburiy"); return; }
                  setError(""); setStep(2);
                }}>
                  Davom etish <i className="ti ti-arrow-right" style={{ marginLeft: 6 }}></i>
                </button>
              </>}

              {/* Step 2 */}
              {step === 2 && <>
                <button type="button" onClick={() => setStep(1)} style={{
                  background: "none", border: "none", color: c.muted, cursor: "pointer",
                  padding: 0, marginBottom: 18, display: "flex", alignItems: "center", gap: 6, fontSize: 13,
                }}>
                  <i className="ti ti-arrow-left"></i> Orqaga
                </button>
                <StepHeader icon="ti-crane" title="Birinchi loyihangiz"
                  desc="Hozirda qurayotgan yoki sotayotgan ob'ektingiz"
                  c={c} ot={ot} />
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label="Loyiha / ob'ekt nomi" required c={c}>
                    <input className="erp-ob-inp" value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                      placeholder="Masalan: Atlantis Residence, 24-uy" required style={iStyle} />
                  </Field>
                  <Field label="Joylashuv" c={c}>
                    <input className="erp-ob-inp" value={projectLocation}
                      onChange={e => setProjectLocation(e.target.value)}
                      placeholder="Masalan: Toshkent, Mirzo Ulug'bek tumani" style={iStyle} />
                  </Field>
                  <Field label="Byudjet (so'mda)" c={c}>
                    <input className="erp-ob-inp" value={projectBudget}
                      onChange={e => setProjectBudget(e.target.value.replace(/\D/g, ""))}
                      placeholder="Masalan: 5 000 000 000" type="text" inputMode="numeric" style={iStyle} />
                  </Field>
                </div>
                {error && <ErrBox msg={error} c={c} />}
                <button type="submit" disabled={loading} style={{ ...btn(), opacity: loading ? 0.75 : 1 }}>
                  {loading
                    ? <><i className="ti ti-loader-2" style={{ marginRight: 8, animation: "spin 1s linear infinite" }}></i>Yaratilmoqda...</>
                    : <><i className="ti ti-rocket" style={{ marginRight: 8 }}></i>ERP panelni ishga tushirish</>}
                </button>
                <p style={{ color: c.muted, fontSize: 12, textAlign: "center", marginTop: 14, marginBottom: 0, lineHeight: 1.6 }}>
                  Keyinchalik xodimlar, xonadonlar va boshqa ma&apos;lumotlarni qo&apos;shishingiz mumkin
                </p>
              </>}
            </form>
          </div>

          {/* Feature tiles */}
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            {[
              { icon: "ti-building-skyscraper", text: "Loyiha va xonadonlar" },
              { icon: "ti-users",               text: "Lidlar va sotuv" },
              { icon: "ti-chart-bar",            text: "Tahlil va hisobotlar" },
            ].map(f => (
              <div key={f.icon} style={{
                flex: 1, minWidth: 130,
                background: c.featureBg, border: `1px solid ${c.border}`,
                borderRadius: 12, padding: "11px 14px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: ot, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <i className={`ti ${f.icon}`} style={{ color: orange, fontSize: 15 }}></i>
                </span>
                <span style={{ color: c.ink, fontSize: 12, fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{focusStyle}</style>
    </div>
  );
}

/* ── Reusable helpers ── */
function StepHeader({ icon, title, desc, c, ot }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 11, background: ot,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
      }}>
        <i className={`ti ${icon}`} style={{ color: "#E06334", fontSize: 20 }}></i>
      </div>
      <h2 style={{
        color: c.ink, fontSize: 19, fontWeight: 700,
        fontFamily: "'Bricolage Grotesque', sans-serif",
        letterSpacing: -0.4, margin: "0 0 5px",
      }}>{title}</h2>
      <p style={{ color: c.muted, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function Field({ label, required, children, c }) {
  return (
    <div>
      <label style={{ color: c.ink, fontSize: 13, display: "block", marginBottom: 6, fontWeight: 600 }}>
        {label}{required && <span style={{ color: "#E06334", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function ErrBox({ msg, c }) {
  return (
    <div style={{
      marginTop: 14, padding: "11px 14px",
      background: c.errorBg, border: `1px solid ${c.errorBorder}`,
      borderRadius: 10, color: c.errorText, fontSize: 13,
    }}>
      <i className="ti ti-alert-circle" style={{ marginRight: 7 }}></i>{msg}
    </div>
  );
}

function btn() {
  return {
    width: "100%", marginTop: 20, padding: "13px 24px",
    background: "#E06334", border: "none", borderRadius: 12,
    color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit", letterSpacing: -0.3,
  };
}
