"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  loginAction, 
  registerAction, 
  sendOtpAction, 
  verifyOtpAction, 
  completeSmsRegisterAction,
  googleLoginAction
} from "@/app/actions";

function getPasswordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Zaif", color: "#d9534f", width: "33%" };
  if (score <= 3) return { label: "O'rtacha", color: "#f0ad4e", width: "66%" };
  return { label: "Kuchli", color: "#5cb85c", width: "100%" };
}

export default function Login() {
  const [authType, setAuthType] = useState("password"); // "password" | "sms"
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // SMS Flow States
  const [smsStep, setSmsStep] = useState(1); // 1 | 2 | 3
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [smsSuccessMsg, setSmsSuccessMsg] = useState("");

  // Google Flow States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleStep, setGoogleStep] = useState(1); // 1: Select, 2: Custom input
  const [googleCustomEmail, setGoogleCustomEmail] = useState("");
  const [googleCustomName, setGoogleCustomName] = useState("");

  const phoneValid = !phone || /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(phone);
  const passwordTooShort = password.length > 0 && password.length < 6;
  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!phone || !phoneValid) {
      setError("Telefon raqami +998 formatida bo'lishi kerak");
      return;
    }
    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("phone", phone);
    formData.append("password", password);

    if (mode === "register") {
      formData.append("name", name);
      try {
        const res = await registerAction(formData);
        if (res?.error) {
          setError(res.error);
          setLoading(false);
        }
      } catch (err) {
        setError("Tizimda xatolik yuz berdi");
        setLoading(false);
      }
    } else {
      try {
        const res = await loginAction(formData);
        if (res?.error) {
          setError(res.error);
          setLoading(false);
        }
      } catch (err) {
        setError("Tizimda xatolik yuz berdi");
        setLoading(false);
      }
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSmsSuccessMsg("");
    
    if (!phone || !phoneValid) {
      setError("Telefon raqamini to'g'ri kiriting (+998 XX XXX XX XX)");
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtpAction(phone);
      if (res?.error) {
        setError(res.error);
      } else {
        setSmsSuccessMsg(`SMS tasdiqlash kodi yuborildi: ${res.demoCode}`);
        setResendTimer(60);
        setSmsStep(2);
      }
    } catch (err) {
      setError("Tizimda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSmsSuccessMsg("");

    if (!otpCode || otpCode.length !== 6) {
      setError("6 xonali tasdiqlash kodini kiriting");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpAction(phone, otpCode);
      if (res?.error) {
        setError(res.error);
      } else {
        if (res.exists) {
          window.location.href = "/profile";
        } else {
          setSmsStep(3);
        }
      }
    } catch (err) {
      setError("Tizimda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegister = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!name || name.trim().length < 2) {
      setError("Ism familiyangizni kiriting (kamida 2 ta belgi)");
      return;
    }

    setLoading(true);
    try {
      const res = await completeSmsRegisterAction(phone, otpCode, name);
      if (res?.error) {
        setError(res.error);
      } else {
        window.location.href = "/profile";
      }
    } catch (err) {
      setError("Tizimda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGoogleAccount = async (email, accountName) => {
    setError("");
    setLoading(true);
    setShowGoogleModal(false);
    try {
      const res = await googleLoginAction(email, accountName);
      if (res?.error) {
        setError(res.error);
      } else {
        window.location.href = "/profile";
      }
    } catch (err) {
      setError("Google orqali kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!googleCustomEmail || !/^\S+@\S+\.\S+$/.test(googleCustomEmail)) {
      alert("Haqiqiy email manzilini kiriting!");
      return;
    }
    if (!googleCustomName || googleCustomName.trim().length < 2) {
      alert("Ism familiyangizni kiriting!");
      return;
    }

    setLoading(true);
    setShowGoogleModal(false);
    try {
      const res = await googleLoginAction(googleCustomEmail, googleCustomName);
      if (res?.error) {
        setError(res.error);
      } else {
        window.location.href = "/profile";
      }
    } catch (err) {
      setError("Google orqali kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell">
      <div className="visual">
        <div
          className="vbg"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=75')",
          }}
        ></div>
        <div className="ov"></div>
        <Link className="vlogo" href="/">
          <span className="dot"></span>Joy
        </Link>
        <div className="vtext">
          <h2 className="display">Joyingizni Joydan toping</h2>
          <p>
            Minglab ishonchli e&apos;lon, xaritada qidiruv va to&apos;g&apos;ridan-to&apos;g&apos;ri aloqa
            — barchasi bir joyda.
          </p>
        </div>
        <div></div>
      </div>

      <div className="formside">
        <div className="formbox">
          {/* Auth Type Tabs */}
          <div className="auth-tabs" style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "1px solid var(--sand)", paddingBottom: 10 }}>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                fontSize: 15,
                fontWeight: 600,
                color: authType === "password" ? "var(--orange)" : "var(--muted)",
                cursor: "pointer",
                padding: "8px 16px",
                borderBottom: authType === "password" ? "3px solid var(--orange)" : "3px solid transparent",
                transition: "all 0.2s",
                fontFamily: "inherit"
              }}
              onClick={() => {
                setAuthType("password");
                setError("");
              }}
            >
              Parol orqali
            </button>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                fontSize: 15,
                fontWeight: 600,
                color: authType === "sms" ? "var(--orange)" : "var(--muted)",
                cursor: "pointer",
                padding: "8px 16px",
                borderBottom: authType === "sms" ? "3px solid var(--orange)" : "3px solid transparent",
                transition: "all 0.2s",
                fontFamily: "inherit"
              }}
              onClick={() => {
                setAuthType("sms");
                setSmsStep(1);
                setOtpCode("");
                setError("");
                setSmsSuccessMsg("");
              }}
            >
              SMS kod orqali
            </button>
          </div>

          {error && (
            <div
              style={{
                color: "#b23e12",
                background: "#fdeae2",
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 16,
              }}
            >
              <i className="ti ti-alert-circle"></i> {error}
            </div>
          )}

          {authType === "password" ? (
            <form onSubmit={handleSubmitPassword}>
              <div className="aseg">
                <button
                  type="button"
                  className={mode === "login" ? "on" : ""}
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Kirish
                </button>
                <button
                  type="button"
                  className={mode === "register" ? "on" : ""}
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                >
                  Ro&apos;yxatdan o&apos;tish
                </button>
              </div>

              <h1 className="display">
                {mode === "login" ? "Xush kelibsiz" : "Hisob yarating"}
              </h1>
              <div className="lead">
                {mode === "login"
                  ? "Hisobingizga kiring va davom eting"
                  : "Bir daqiqada ro'yxatdan o'tish"}
              </div>

              {mode === "register" && (
                <div className="afield">
                  <label>Ism familiya</label>
                  <div className="inp">
                    <i className="ti ti-user"></i>
                    <input
                      placeholder="Aziz Karimov"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="afield">
                <label>Telefon raqami</label>
                <div className="inp" style={{ borderColor: !phoneValid ? "#d9534f" : undefined }}>
                  <i className="ti ti-phone"></i>
                  <input
                    placeholder="+998 90 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                {!phoneValid && (
                  <div style={{ color: "#d9534f", fontSize: 12, marginTop: 4 }}>
                    <i className="ti ti-alert-triangle" style={{ fontSize: 13 }}></i> +998 XX XXX XX XX formatida kiriting
                  </div>
                )}
              </div>

              <div className="afield">
                <label>Parol</label>
                <div className="inp" style={{ borderColor: passwordTooShort ? "#d9534f" : undefined }}>
                  <i className="ti ti-lock"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Kamida 6 ta belgi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <i
                    className={showPassword ? "ti ti-eye-off" : "ti ti-eye"}
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowPassword(!showPassword)}
                  ></i>
                </div>
                {passwordTooShort && (
                  <div style={{ color: "#d9534f", fontSize: 12, marginTop: 4 }}>
                    <i className="ti ti-alert-triangle" style={{ fontSize: 13 }}></i> Parol kamida 6 ta belgidan iborat bo&apos;lishi kerak
                  </div>
                )}
                {strength && password.length >= 1 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 4, borderRadius: 2, background: "#eee", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: 2, transition: "width 0.3s ease" }} />
                    </div>
                    <div style={{ fontSize: 11, color: strength.color, marginTop: 3, fontWeight: 600 }}>
                      {strength.label}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="btn-main" disabled={loading}>
                <i className={mode === "login" ? "ti ti-login-2" : "ti ti-user-plus"}></i>{" "}
                {loading ? "Kutilmoqda..." : mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
              </button>

              {mode === "login" && (
                <div style={{ textAlign: "center", marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => alert("Tez kunda ishga tushadi")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--orange)",
                      fontSize: 13,
                      cursor: "pointer",
                      fontWeight: 500,
                      textDecoration: "underline",
                    }}
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>
              )}
            </form>
          ) : (
            <div>
              {smsStep === 1 && (
                <form onSubmit={handleSendOtp}>
                  <h1 className="display">SMS orqali kirish</h1>
                  <div className="lead">Telefon raqamingizni kiriting va biz sizga tasdiqlash kodini yuboramiz</div>
                  
                  <div className="afield">
                    <label>Telefon raqami</label>
                    <div className="inp" style={{ borderColor: !phoneValid ? "#d9534f" : undefined }}>
                      <i className="ti ti-phone"></i>
                      <input
                        placeholder="+998 90 123 45 67"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    {!phoneValid && (
                      <div style={{ color: "#d9534f", fontSize: 12, marginTop: 4 }}>
                        <i className="ti ti-alert-triangle" style={{ fontSize: 13 }}></i> +998 XX XXX XX XX formatida kiriting
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn-main" disabled={loading}>
                    <i className="ti ti-mail-fast"></i> {loading ? "Yuborilmoqda..." : "Tasdiqlash kodini yuborish"}
                  </button>
                </form>
              )}

              {smsStep === 2 && (
                <form onSubmit={handleVerifyOtp}>
                  <h1 className="display">Kodni tasdiqlash</h1>
                  <div className="lead">Tasdiqlash kodi telefoningizga yuborildi.</div>

                  {smsSuccessMsg && (
                    <div
                      style={{
                        color: "var(--green, #1d9e75)",
                        background: "var(--green-tint, #e1f5ee)",
                        padding: "12px 14px",
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        border: "0.5px solid var(--green)"
                      }}
                    >
                      <i className="ti ti-mail-opened" style={{ fontSize: 16 }}></i>
                      <span>{smsSuccessMsg}</span>
                    </div>
                  )}

                  <div className="afield">
                    <label>SMS Tasdiqlash Kodi</label>
                    <div className="inp">
                      <i className="ti ti-key"></i>
                      <input
                        placeholder="6 xonali kod"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-main" disabled={loading}>
                    <i className="ti ti-shield-check"></i> {loading ? "Kutilmoqda..." : "Kodni tasdiqlash"}
                  </button>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => setSmsStep(1)}
                      style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <i className="ti ti-arrow-left"></i> Telefonni o'zgartirish
                    </button>

                    {resendTimer > 0 ? (
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>Qayta yuborish: {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        style={{ background: "none", border: "none", color: "var(--orange)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                      >
                        Kodni qayta yuborish
                      </button>
                    )}
                  </div>
                </form>
              )}

              {smsStep === 3 && (
                <form onSubmit={handleCompleteRegister}>
                  <h1 className="display">Ro'yxatdan o'tish</h1>
                  <div className="lead">Tizimda yangi ekansiz. Davom etish uchun ism va familiyangizni kiriting:</div>

                  <div className="afield">
                    <label>Ism familiya</label>
                    <div className="inp">
                      <i className="ti ti-user"></i>
                      <input
                        placeholder="Aziz Karimov"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-main" disabled={loading}>
                    <i className="ti ti-user-plus"></i> {loading ? "Kutilmoqda..." : "Ro'yxatdan o'tishni yakunlash"}
                  </button>

                  <div style={{ marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => setSmsStep(2)}
                      style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <i className="ti ti-arrow-left"></i> Ortga qaytish
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="divider">yoki</div>
          <div className="socials">
            <button 
              type="button" 
              className="soc" 
              onClick={() => {
                setShowGoogleModal(true);
                setGoogleStep(1);
              }}
            >
              <i className="ti ti-brand-google"></i> Google
            </button>
            <button type="button" className="soc" onClick={() => alert("Apple orqali kirish tez kunda ishga tushadi!")}>
              <i className="ti ti-brand-apple"></i> Apple
            </button>
          </div>
        </div>
      </div>

      {/* Google Account Selector Modal */}
      {showGoogleModal && (
        <div style={gOverlayStyle} onClick={() => setShowGoogleModal(false)}>
          <div style={gBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-block", background: "var(--sand)", padding: 6, borderRadius: 8 }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" style={{ display: "block" }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", fontFamily: "sans-serif" }}>Google Accounts</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowGoogleModal(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text2)" }}
              >
                <i className="ti ti-x"></i>
              </button>
            </div>

            {googleStep === 1 ? (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px", fontFamily: "inherit", color: "var(--ink)", textAlign: "left" }}>Hisobni tanlang</h2>
                <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24, textAlign: "left" }}>Joy.uz platformasiga o&apos;tish uchun</div>

                {/* Account list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  <button
                    type="button"
                    onClick={() => handleSelectGoogleAccount("aziz@gmail.com", "Aziz Karimov")}
                    style={gAccountBtnStyle}
                  >
                    <div style={gAvatarStyle}>A</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>Aziz Karimov</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>aziz@gmail.com</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectGoogleAccount("dilnoza@gmail.com", "Dilnoza Yusupova")}
                    style={gAccountBtnStyle}
                  >
                    <div style={gAvatarStyle}>D</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>Dilnoza Yusupova</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>dilnoza@gmail.com</div>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setGoogleStep(2)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "1px dashed var(--sand)",
                    borderRadius: 12,
                    padding: "12px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--orange)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "background 0.2s",
                    fontFamily: "inherit"
                  }}
                >
                  <i className="ti ti-user-plus"></i> Boshqa hisobdan foydalanish
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px", fontFamily: "inherit", color: "var(--ink)", textAlign: "left" }}>Tizimga kirish</h2>
                <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 20, textAlign: "left" }}>Google hisob ma&apos;lumotlarini kiriting</div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20, textAlign: "left" }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>Ism familiyangiz</label>
                    <input
                      type="text"
                      placeholder="Aziz Karimov"
                      value={googleCustomName}
                      onChange={(e) => setGoogleCustomName(e.target.value)}
                      required
                      style={gInputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>Google Email</label>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={googleCustomEmail}
                      onChange={(e) => setGoogleCustomEmail(e.target.value)}
                      required
                      style={gInputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setGoogleStep(1)}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "1px solid var(--sand)",
                      borderRadius: 12,
                      padding: "12px 0",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit"
                    }}
                  >
                    Ortga
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      background: "var(--orange)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      padding: "12px 0",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit"
                    }}
                  >
                    Kirish
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Styling (Google Account Selector)
const gOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(26, 19, 14, 0.6)",
  backdropFilter: "blur(5px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999999
};

const gBoxStyle = {
  background: "var(--card-bg)",
  borderRadius: 16,
  padding: 28,
  width: "90%",
  maxWidth: 420,
  boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
  border: "1px solid var(--sand)",
  boxSizing: "border-box",
  color: "var(--ink)"
};

const gAccountBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "12px 14px",
  background: "var(--card-bg)",
  border: "1px solid var(--sand)",
  color: "var(--ink)",
  borderRadius: 12,
  cursor: "pointer",
  transition: "all 0.2s",
  outline: "none",
  fontFamily: "inherit"
};

const gAvatarStyle = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: "var(--orange-tint)",
  color: "var(--orange)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 16
};

const gInputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid var(--sand)",
  background: "var(--card-bg)",
  color: "var(--ink)",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
  fontFamily: "inherit"
};
