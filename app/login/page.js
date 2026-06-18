"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  loginAction, 
  registerAction, 
  sendOtpAction, 
  verifyOtpAction, 
  completeSmsRegisterAction 
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
            <button type="button" className="soc" onClick={() => alert("Google orqali kirish tez kunda ishga tushadi!")}>
              <i className="ti ti-brand-google"></i> Google
            </button>
            <button type="button" className="soc" onClick={() => alert("Apple orqali kirish tez kunda ishga tushadi!")}>
              <i className="ti ti-brand-apple"></i> Apple
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
