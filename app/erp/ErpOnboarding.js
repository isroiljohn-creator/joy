"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { erpSetupAction } from "@/app/erp-actions";

// Hardcoded brand colors — dark mode ta'sir qilmasin
const C = {
  bg:        "#FAF7F3",
  white:     "#FFFFFF",
  ink:       "#19130F",
  muted:     "#6E665F",
  sand:      "#E9E3DB",
  orange:    "#E06334",
  orangeTint:"#F6E2D8",
  errorBg:   "#FEF2F2",
  errorBorder:"#FECACA",
  errorText: "#B91C1C",
};

export default function ErpOnboarding({ user }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Foydalanuvchi ma'lumotlari cookie'dan
  const [cookieUser, setCookieUser] = useState(null);
  useEffect(() => {
    const cookies = document.cookie.split(";").reduce((acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = v;
      return acc;
    }, {});
    if (cookies.is_logged_in === "true" && cookies.user_display_name) {
      setCookieUser({
        name: decodeURIComponent(cookies.user_display_name),
        role: cookies.user_role || "user",
      });
    }
  }, []);

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
    if (res?.error) setError(res.error);
    else router.refresh();
  };

  const initials = (user?.name || cookieUser?.name || "")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      colorScheme: "light", // dark mode override
    }}>

      {/* ── Mini Nav ── */}
      <header style={{
        background: C.white,
        borderBottom: `1px solid ${C.sand}`,
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 8,
          textDecoration: "none", color: C.ink, fontWeight: 800,
          fontSize: 18, letterSpacing: -0.5,
          fontFamily: "'Bricolage Grotesque', sans-serif",
        }}>
          <span style={{
            width: 30, height: 30, borderRadius: 7,
            background: C.orange, display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 14, flexShrink: 0,
          }}>
            <i className="ti ti-building-skyscraper"></i>
          </span>
          mask<span style={{ color: C.orange }}>on</span>
          <span style={{
            background: C.orange, color: "#fff",
            fontSize: 9, fontWeight: 700, padding: "2px 6px",
            borderRadius: 5, letterSpacing: 1, alignSelf: "center",
          }}>ERP</span>
        </Link>

        {/* Auth area */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user || cookieUser ? (
            <>
              <Link href="/profile" style={{
                display: "flex", alignItems: "center", gap: 8,
                color: C.ink, textDecoration: "none", fontSize: 14, fontWeight: 600,
              }}>
                <span style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: C.orangeTint, color: C.orange,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 12, flexShrink: 0,
                }}>
                  {initials || <i className="ti ti-user" style={{ fontSize: 14 }}></i>}
                </span>
                <span style={{ color: C.muted, fontWeight: 500 }}>
                  {user?.name || cookieUser?.name}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" style={{
                color: C.muted, textDecoration: "none", fontSize: 14, fontWeight: 500,
              }}>
                Kirish
              </Link>
              <Link href="/register" style={{
                background: C.orange, color: "#fff",
                padding: "8px 18px", borderRadius: 20,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
              }}>
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "calc(100vh - 60px)", padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 560 }}>

          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: C.orangeTint, borderRadius: 20,
              padding: "6px 14px", marginBottom: 16,
            }}>
              <i className="ti ti-rocket" style={{ color: C.orange, fontSize: 14 }}></i>
              <span style={{ color: C.orange, fontSize: 13, fontWeight: 700 }}>
                Bepul boshlang
              </span>
            </div>
            <h1 style={{
              color: C.ink, fontSize: 28, fontWeight: 800,
              fontFamily: "'Bricolage Grotesque', sans-serif",
              letterSpacing: -1, margin: "0 0 8px",
            }}>
              Biznesingizni ERP bilan boshqaring
            </h1>
            <p style={{ color: C.muted, fontSize: 15, margin: 0, lineHeight: 1.6 }}>
              2 daqiqada sozlang — loyihalar, sotuv va xodimlar boshqaruvi
            </p>
          </div>

          {/* Steps indicator */}
          <div style={{ display: "flex", gap: 6, marginBottom: 24, justifyContent: "center" }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                width: s === step ? 32 : 8, height: 8, borderRadius: 4,
                background: s <= step ? C.orange : C.sand,
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>

          {/* Card */}
          <div style={{
            background: C.white,
            border: `1px solid ${C.sand}`,
            borderRadius: 20,
            padding: "36px",
            boxShadow: "0 2px 20px rgba(25,19,15,0.06)",
          }}>
            <form onSubmit={handleSubmit}>

              {/* ── Step 1 ── */}
              {step === 1 && (
                <>
                  <StepHeader
                    icon="ti-building"
                    title="Kompaniyangiz"
                    desc="Qurilish kompaniyangiz haqida asosiy ma'lumotlar"
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Field label="Kompaniya nomi" required>
                      <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                        placeholder="Masalan: Atlantis Qurilish MChJ" required style={iStyle} />
                    </Field>
                    <Field label="Telefon raqam">
                      <input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)}
                        placeholder="+998 90 000 00 00" style={iStyle} />
                    </Field>
                    <Field label="Manzil">
                      <input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)}
                        placeholder="Masalan: Toshkent, Yunusobod tumani" style={iStyle} />
                    </Field>
                  </div>
                  {error && <ErrBox msg={error} />}
                  <button type="button" style={btnStyle} onClick={() => {
                    if (!companyName.trim()) { setError("Kompaniya nomi majburiy"); return; }
                    setError(""); setStep(2);
                  }}>
                    Davom etish <i className="ti ti-arrow-right" style={{ marginLeft: 6 }}></i>
                  </button>
                </>
              )}

              {/* ── Step 2 ── */}
              {step === 2 && (
                <>
                  <button type="button" onClick={() => setStep(1)} style={{
                    background: "none", border: "none", color: C.muted,
                    cursor: "pointer", padding: 0, marginBottom: 20,
                    display: "flex", alignItems: "center", gap: 6, fontSize: 13,
                  }}>
                    <i className="ti ti-arrow-left"></i> Orqaga
                  </button>
                  <StepHeader
                    icon="ti-crane"
                    title="Birinchi loyihangiz"
                    desc="Hozirda qurayotgan yoki sotayotgan ob'ektingiz"
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Field label="Loyiha / ob'ekt nomi" required>
                      <input value={projectName} onChange={e => setProjectName(e.target.value)}
                        placeholder="Masalan: Atlantis Residence, 24-uy" required style={iStyle} />
                    </Field>
                    <Field label="Joylashuv">
                      <input value={projectLocation} onChange={e => setProjectLocation(e.target.value)}
                        placeholder="Masalan: Toshkent, Mirzo Ulug'bek tumani" style={iStyle} />
                    </Field>
                    <Field label="Byudjet (so'mda)">
                      <input value={projectBudget}
                        onChange={e => setProjectBudget(e.target.value.replace(/\D/g, ""))}
                        placeholder="Masalan: 5 000 000 000" type="text" inputMode="numeric" style={iStyle} />
                    </Field>
                  </div>
                  {error && <ErrBox msg={error} />}
                  <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.75 : 1 }}>
                    {loading
                      ? <><i className="ti ti-loader-2" style={{ marginRight: 8, animation: "spin 1s linear infinite" }}></i>Yaratilmoqda...</>
                      : <><i className="ti ti-rocket" style={{ marginRight: 8 }}></i>ERP panelni ishga tushirish</>
                    }
                  </button>
                  <p style={{ color: C.muted, fontSize: 12, textAlign: "center", marginTop: 14, marginBottom: 0, lineHeight: 1.6 }}>
                    Keyinchalik xodimlar, xonadonlar va h.k. qo&apos;shish mumkin
                  </p>
                </>
              )}
            </form>
          </div>

          {/* Features */}
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { icon: "ti-building-skyscraper", text: "Loyiha va xonadonlar" },
              { icon: "ti-users", text: "Lidlar va sotuv" },
              { icon: "ti-chart-bar", text: "Tahlil va hisobotlar" },
            ].map(f => (
              <div key={f.icon} style={{
                flex: 1, minWidth: 130,
                background: C.white, border: `1px solid ${C.sand}`,
                borderRadius: 12, padding: "11px 14px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: C.orangeTint, display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <i className={`ti ${f.icon}`} style={{ color: C.orange, fontSize: 15 }}></i>
                </span>
                <span style={{ color: C.ink, fontSize: 12, fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .erp-ob-input:focus {
          border-color: ${C.orange} !important;
          box-shadow: 0 0 0 3px ${C.orangeTint} !important;
          outline: none;
        }
      `}</style>
    </div>
  );
}

/* ── Helpers ── */
function StepHeader({ icon, title, desc }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 11,
        background: "#F6E2D8", display: "flex",
        alignItems: "center", justifyContent: "center", marginBottom: 14,
      }}>
        <i className={`ti ${icon}`} style={{ color: "#E06334", fontSize: 20 }}></i>
      </div>
      <h2 style={{
        color: "#19130F", fontSize: 20, fontWeight: 700,
        fontFamily: "'Bricolage Grotesque', sans-serif",
        letterSpacing: -0.4, margin: "0 0 5px",
      }}>{title}</h2>
      <p style={{ color: "#6E665F", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={{
        color: "#19130F", fontSize: 13, display: "block",
        marginBottom: 6, fontWeight: 600,
      }}>
        {label}{required && <span style={{ color: "#E06334", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function ErrBox({ msg }) {
  return (
    <div style={{
      marginTop: 14, padding: "11px 14px",
      background: "#FEF2F2", border: "1px solid #FECACA",
      borderRadius: 10, color: "#B91C1C", fontSize: 13,
    }}>
      <i className="ti ti-alert-circle" style={{ marginRight: 7 }}></i>{msg}
    </div>
  );
}

const iStyle = {
  width: "100%",
  padding: "11px 13px",
  background: "#FFFFFF",
  border: "1.5px solid #E9E3DB",
  borderRadius: 10,
  color: "#19130F",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s",
  className: "erp-ob-input",
};

const btnStyle = {
  width: "100%",
  marginTop: 22,
  padding: "13px 24px",
  background: "#E06334",
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
};
