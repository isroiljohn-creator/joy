"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { erpSetupAction } from "@/app/erp-actions";
import { sendOtpAction, verifyOtpAction } from "@/app/actions";

const THEMES = {
  light: {
    bg: "#FAF7F3", surface: "#FFFFFF", ink: "#19130F", muted: "#6E665F",
    border: "#E9E3DB", inputBg: "#FFFFFF", inputBorder: "#E9E3DB",
    navBg: "#FFFFFF", navBorder: "#E9E3DB", featureBg: "#FFFFFF",
    errorBg: "#FEF2F2", errorBorder: "#FECACA", errorText: "#B91C1C",
    planCard: "#FFFFFF", planBorder: "#E9E3DB",
  },
  dark: {
    bg: "#1A1612", surface: "#231F1A", ink: "#F5F0EB", muted: "#8A837B",
    border: "#2D2822", inputBg: "#2D2822", inputBorder: "#3A342E",
    navBg: "rgba(26,22,18,0.92)", navBorder: "#2D2822", featureBg: "#2D2822",
    errorBg: "rgba(185,28,28,0.12)", errorBorder: "rgba(254,202,202,0.2)", errorText: "#FCA5A5",
    planCard: "#231F1A", planBorder: "#2D2822",
  },
};
const ORANGE = "#E06334";
const ORANGE_DARK = "#C8522A";

// Tariflar
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$299",
    period: "/ oy",
    desc: "Kichik agentlik yoki yakka tadbirkor uchun",
    features: [
      "1 ta loyiha",
      "100 ta xonadon",
      "3 ta xodim",
      "CRM — lidlar va uchrashuvlar",
      "Sotuv hisobotlari",
    ],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$399",
    period: "/ oy",
    desc: "O'sib borayotgan qurilish kompaniyasi uchun",
    features: [
      "5 ta loyiha",
      "500 ta xonadon",
      "15 ta xodim",
      "CRM + SMS bildirishnomalar",
      "Kengaytirilgan hisobotlar",
      "API integratsiyasi",
    ],
    highlight: true,
    badge: "Eng mashhur",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Kelishiladi",
    period: "",
    desc: "Yirik qurilish holdinglari uchun",
    features: [
      "Cheksiz loyihalar",
      "Cheksiz xonadonlar",
      "Cheksiz xodimlar",
      "Maxsus integratsiyalar",
      "Dedicated support",
      "SLA kafolat",
    ],
    highlight: false,
  },
];

export default function ErpOnboarding({ user }) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [cookieUser, setCookieUser] = useState(null);

  // Onboarding bosqichlari: "pricing" → "company" → "otp" → "project"
  const [stage, setStage] = useState("pricing");
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Forma state-lari
  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState(
    user?.phone && !user.phone.startsWith("google_") ? user.phone : ""
  );
  const [companyAddress, setCompanyAddress] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectBudget, setProjectBudget] = useState("");

  // OTP state-lari
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Umumiy state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tema va cookie
  useEffect(() => {
    const detectTheme = () => {
      const saved = localStorage.getItem("maskon-theme") || localStorage.getItem("joy-theme");
      setIsDark(saved === "dark" || document.documentElement.getAttribute("data-theme") === "dark");
    };
    detectTheme();
    window.addEventListener("maskon-theme-change", detectTheme);
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

  // OTP sanash (countdown)
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const c = isDark ? THEMES.dark : THEMES.light;
  const ot = isDark ? "#2D201A" : "#F6E2D8";

  // OTP yuborish
  const handleSendOtp = async () => {
    if (!companyPhone.trim()) { setError("Telefon raqamni kiriting"); return; }
    setOtpLoading(true); setError(""); setSuccess("");
    const res = await sendOtpAction(companyPhone.trim());
    setOtpLoading(false);
    if (res?.error) { setError(res.error); return; }
    setOtpSent(true);
    setCountdown(60);
    setSuccess("Tasdiqlash kodi yuborildi");
    if (res.demoCode) setSuccess(`Demo kod: ${res.demoCode}`);
  };

  // OTP tekshirish
  const handleVerifyOtp = async () => {
    if (otpCode.length < 4) { setError("Kodni to'liq kiriting"); return; }
    setOtpLoading(true); setError("");
    const res = await verifyOtpAction(companyPhone.trim(), otpCode);
    setOtpLoading(false);
    if (res?.error) { setError(res.error); return; }
    setPhoneVerified(true);
    setSuccess("Telefon tasdiqlandi ✓");
    setStage("project");
  };

  // Yakuniy saqlash
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneVerified) { setError("Avval telefon raqamni tasdiqlang"); return; }
    setLoading(true); setError("");
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

  return (
    <div style={{ minHeight: "100vh", background: c.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Sticky Nav ── */}
      <header style={{
        background: c.navBg, borderBottom: `1px solid ${c.navBorder}`,
        backdropFilter: "blur(12px)", padding: "0 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 58, position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Asosiy loyiha logo uslubida */}
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center",
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700, fontSize: 22, color: c.ink,
          textDecoration: "none", textTransform: "lowercase", letterSpacing: -0.3,
          gap: 0,
        }}>
          mask
          <span style={{ color: ORANGE, display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 -0.5px", fontSize: "0.85em", verticalAlign: "middle" }}>
            <i className="ti ti-map-pin-filled"></i>
          </span>
          n
          <span style={{
            marginLeft: 8,
            background: ORANGE, color: "#fff",
            fontSize: 10, fontWeight: 800,
            padding: "2px 7px", borderRadius: 5, letterSpacing: 0.8,
            alignSelf: "center", textTransform: "uppercase",
          }}>ERP</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user || cookieUser ? (
            <Link href="/profile" style={{
              display: "flex", alignItems: "center", gap: 8,
              textDecoration: "none", fontSize: 14, fontWeight: 500, color: c.muted,
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: "50%", background: ot, color: ORANGE,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 12, flexShrink: 0,
              }}>
                {initials || <i className="ti ti-user" style={{ fontSize: 14 }}></i>}
              </span>
              {displayName}
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ color: c.muted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Kirish</Link>
              <Link href="/register" style={{
                background: ORANGE, color: "#fff", padding: "8px 18px",
                borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: "none",
              }}>Ro&apos;yxatdan o&apos;tish</Link>
            </>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        minHeight: "calc(100vh - 58px)", padding: "48px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: stage === "pricing" ? 900 : 560 }}>

          {/* ══════════════ PRICING STAGE ══════════════ */}
          {stage === "pricing" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <h1 style={{
                  color: c.ink, fontSize: 30, fontWeight: 800,
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  letterSpacing: -1, margin: "0 0 10px",
                }}>
                  ERP tizimini ulang
                </h1>
                <p style={{ color: c.muted, fontSize: 15, margin: 0, lineHeight: 1.6 }}>
                  Qurilish kompaniyangiz hajmiga mos tarifni tanlang
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                {PLANS.map(plan => (
                  <div key={plan.id} style={{
                    background: plan.highlight ? ORANGE : c.planCard,
                    border: `2px solid ${plan.highlight ? ORANGE : selectedPlan === plan.id ? ORANGE : c.planBorder}`,
                    borderRadius: 18, padding: "28px 24px",
                    cursor: "pointer", transition: "all 0.2s",
                    position: "relative",
                    boxShadow: plan.highlight
                      ? "0 8px 32px rgba(224,99,52,0.3)"
                      : selectedPlan === plan.id ? "0 4px 16px rgba(224,99,52,0.15)" : "none",
                    transform: plan.highlight ? "scale(1.02)" : "scale(1)",
                  }}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.badge && (
                      <div style={{
                        position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                        background: "#fff", color: ORANGE, fontSize: 11, fontWeight: 800,
                        padding: "4px 12px", borderRadius: 20, border: `2px solid ${ORANGE}`,
                        whiteSpace: "nowrap", letterSpacing: 0.3,
                      }}>{plan.badge}</div>
                    )}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, marginBottom: 16,
                      background: plan.highlight ? "rgba(255,255,255,0.2)" : ot,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <i className="ti ti-building-skyscraper" style={{ color: plan.highlight ? "#fff" : ORANGE, fontSize: 18 }}></i>
                    </div>
                    <div style={{
                      fontSize: 17, fontWeight: 800, color: plan.highlight ? "#fff" : c.ink,
                      fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 4,
                    }}>{plan.name}</div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={{
                        fontSize: 26, fontWeight: 800, color: plan.highlight ? "#fff" : ORANGE,
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                      }}>{plan.price}</span>
                      {plan.period && <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.7)" : c.muted, marginLeft: 4 }}>{plan.period}</span>}
                    </div>
                    <p style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.8)" : c.muted, margin: "0 0 18px", lineHeight: 1.5 }}>{plan.desc}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {plan.features.map(f => (
                        <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <i className="ti ti-check" style={{ color: plan.highlight ? "#fff" : ORANGE, fontSize: 14, flexShrink: 0 }}></i>
                          <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.9)" : c.ink }}>{f}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      marginTop: 22, padding: "11px", borderRadius: 10, textAlign: "center",
                      background: plan.highlight ? "rgba(255,255,255,0.15)" : selectedPlan === plan.id ? ORANGE : ot,
                      color: plan.highlight ? "#fff" : selectedPlan === plan.id ? "#fff" : ORANGE,
                      fontWeight: 700, fontSize: 14, border: plan.highlight ? "none" : `1.5px solid ${selectedPlan === plan.id ? ORANGE : "transparent"}`,
                      transition: "all 0.2s",
                    }}>
                      {selectedPlan === plan.id && !plan.highlight ? "✓ Tanlandi" : "Tanlash"}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "center", marginTop: 28 }}>
                <button
                  onClick={() => {
                    if (!selectedPlan) { setError("Avval tarif tanlang"); return; }
                    setError(""); setStage("company");
                  }}
                  style={{
                    background: ORANGE, color: "#fff", border: "none",
                    padding: "14px 36px", borderRadius: 12, fontSize: 15,
                    fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    display: "inline-flex", alignItems: "center", gap: 8,
                  }}
                >
                  Davom etish <i className="ti ti-arrow-right"></i>
                </button>
                {error && <p style={{ color: "#ef4444", marginTop: 10, fontSize: 13 }}>{error}</p>}
              </div>
            </>
          )}

          {/* ══════════════ COMPANY + OTP STAGES ══════════════ */}
          {(stage === "company" || stage === "otp" || stage === "project") && (
            <>
              {/* Step dots */}
              <div style={{ display: "flex", gap: 6, marginBottom: 24, justifyContent: "center" }}>
                {["company", "otp", "project"].map((s, i) => (
                  <div key={s} style={{
                    width: s === stage ? 28 : 8, height: 8, borderRadius: 4,
                    background: ["company", "otp", "project"].indexOf(stage) >= i ? ORANGE : c.border,
                    transition: "all 0.3s",
                  }} />
                ))}
              </div>

              <div style={{
                background: c.surface, border: `1px solid ${c.border}`,
                borderRadius: 20, padding: "34px",
                boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 2px 20px rgba(25,19,15,0.06)",
              }}>
                <form onSubmit={handleSubmit}>

                  {/* ── Stage: Kompaniya ── */}
                  {stage === "company" && (
                    <>
                      <button type="button" onClick={() => { setStage("pricing"); setError(""); }} style={backBtn(c)}>
                        <i className="ti ti-arrow-left"></i> Orqaga
                      </button>
                      <StepHeader icon="ti-building" title="Kompaniyangiz"
                        desc="Qurilish kompaniyangiz haqida asosiy ma'lumotlar"
                        c={c} ot={ot} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <Field label="Kompaniya nomi" required c={c}>
                          <input className="erp-ob-inp" value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            placeholder="Masalan: Atlantis Qurilish MChJ" required style={iStyle} />
                        </Field>

                        {/* Telefon + OTP */}
                        <Field label="Telefon raqam" required c={c}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              className="erp-ob-inp"
                              value={companyPhone}
                              onChange={e => { setCompanyPhone(e.target.value); setPhoneVerified(false); setOtpSent(false); setOtpCode(""); setError(""); setSuccess(""); }}
                              placeholder="+998 90 000 00 00"
                              disabled={phoneVerified}
                              style={{ ...iStyle, flex: 1, opacity: phoneVerified ? 0.7 : 1 }}
                            />
                            {!phoneVerified && (
                              <button type="button" onClick={handleSendOtp} disabled={otpLoading || countdown > 0}
                                style={{
                                  padding: "0 16px", borderRadius: 10, border: "none",
                                  background: countdown > 0 ? c.border : ORANGE,
                                  color: countdown > 0 ? c.muted : "#fff",
                                  fontWeight: 700, fontSize: 13, cursor: countdown > 0 ? "default" : "pointer",
                                  whiteSpace: "nowrap", fontFamily: "inherit",
                                }}>
                                {otpLoading ? "..." : countdown > 0 ? `${countdown}s` : "Kod yuborish"}
                              </button>
                            )}
                            {phoneVerified && (
                              <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#16a34a", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
                                <i className="ti ti-circle-check-filled"></i> Tasdiqlandi
                              </span>
                            )}
                          </div>
                        </Field>

                        {/* OTP kod kiritish */}
                        {otpSent && !phoneVerified && (
                          <div>
                            <label style={{ color: c.ink, fontSize: 13, display: "block", marginBottom: 6, fontWeight: 600 }}>
                              Tasdiqlash kodi <span style={{ color: ORANGE }}>*</span>
                            </label>
                            <div style={{ display: "flex", gap: 8 }}>
                              <input
                                className="erp-ob-inp"
                                value={otpCode}
                                onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="6 xonali kod"
                                maxLength={6}
                                inputMode="numeric"
                                style={{ ...iStyle, flex: 1, letterSpacing: 4, fontSize: 18, fontWeight: 700 }}
                              />
                              <button type="button" onClick={handleVerifyOtp} disabled={otpLoading}
                                style={{
                                  padding: "0 18px", borderRadius: 10, border: "none",
                                  background: ORANGE, color: "#fff",
                                  fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                                }}>
                                {otpLoading ? "..." : "Tasdiqlash"}
                              </button>
                            </div>
                          </div>
                        )}

                        <Field label="Manzil" c={c}>
                          <input className="erp-ob-inp" value={companyAddress}
                            onChange={e => setCompanyAddress(e.target.value)}
                            placeholder="Masalan: Toshkent, Yunusobod tumani" style={iStyle} />
                        </Field>
                      </div>
                      {success && <SuccessBox msg={success} />}
                      {error && <ErrBox msg={error} c={c} />}
                      <button type="button" style={btnStyle()} onClick={() => {
                        if (!companyName.trim()) { setError("Kompaniya nomi majburiy"); return; }
                        if (!phoneVerified) { setError("Telefon raqamni tasdiqlang"); return; }
                        setError(""); setStage("project");
                      }}>
                        Davom etish <i className="ti ti-arrow-right" style={{ marginLeft: 6 }}></i>
                      </button>
                    </>
                  )}

                  {/* ── Stage: Loyiha ── */}
                  {stage === "project" && (
                    <>
                      <button type="button" onClick={() => { setStage("company"); setError(""); }} style={backBtn(c)}>
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
                      <button type="submit" disabled={loading} style={{ ...btnStyle(), opacity: loading ? 0.75 : 1 }}>
                        {loading
                          ? <><i className="ti ti-loader-2" style={{ marginRight: 8, animation: "spin 1s linear infinite" }}></i>Yaratilmoqda...</>
                          : <><i className="ti ti-rocket" style={{ marginRight: 8 }}></i>ERP panelni ishga tushirish</>}
                      </button>
                      <p style={{ color: c.muted, fontSize: 12, textAlign: "center", marginTop: 14, marginBottom: 0, lineHeight: 1.6 }}>
                        Keyinchalik xodimlar, xonadonlar va boshqa ma&apos;lumotlarni qo&apos;shishingiz mumkin
                      </p>
                    </>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .erp-ob-inp:focus { border-color: ${ORANGE} !important; box-shadow: 0 0 0 3px ${isDark ? "#2D201A" : "#F6E2D8"} !important; outline: none; }
      `}</style>
    </div>
  );
}

/* ── Helpers ── */
function StepHeader({ icon, title, desc, c, ot }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, background: ot, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <i className={`ti ${icon}`} style={{ color: ORANGE, fontSize: 20 }}></i>
      </div>
      <h2 style={{ color: c.ink, fontSize: 19, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: -0.4, margin: "0 0 5px" }}>{title}</h2>
      <p style={{ color: c.muted, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function Field({ label, required, children, c }) {
  return (
    <div>
      <label style={{ color: c.ink, fontSize: 13, display: "block", marginBottom: 6, fontWeight: 600 }}>
        {label}{required && <span style={{ color: ORANGE, marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function ErrBox({ msg, c }) {
  return (
    <div style={{ marginTop: 14, padding: "11px 14px", background: c.errorBg, border: `1px solid ${c.errorBorder}`, borderRadius: 10, color: c.errorText, fontSize: 13 }}>
      <i className="ti ti-alert-circle" style={{ marginRight: 7 }}></i>{msg}
    </div>
  );
}

function SuccessBox({ msg }) {
  return (
    <div style={{ marginTop: 14, padding: "11px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, color: "#16a34a", fontSize: 13 }}>
      <i className="ti ti-circle-check" style={{ marginRight: 7 }}></i>{msg}
    </div>
  );
}

function btnStyle() {
  return {
    width: "100%", marginTop: 20, padding: "13px 24px",
    background: ORANGE, border: "none", borderRadius: 12, color: "#fff",
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit", letterSpacing: -0.3,
  };
}

function backBtn(c) {
  return {
    background: "none", border: "none", color: c.muted, cursor: "pointer",
    padding: 0, marginBottom: 18, display: "flex", alignItems: "center", gap: 6, fontSize: 13,
  };
}
