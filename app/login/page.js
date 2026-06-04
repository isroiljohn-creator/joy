"use client";
import { useState } from "react";
import Link from "next/link";
import { loginAction, registerAction } from "@/app/actions";

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
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const phoneValid = !phone || /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(phone);
  const passwordTooShort = password.length > 0 && password.length < 6;
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!phoneValid) {
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
        <form onSubmit={handleSubmit} className="formbox">
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
              : "Bir daqiqada ro'yxatdan o'ting"}
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
            <i
              className={mode === "login" ? "ti ti-login-2" : "ti ti-user-plus"}
            ></i>{" "}
            {loading
              ? "Kutilmoqda..."
              : mode === "login"
              ? "Kirish"
              : "Ro'yxatdan o'tish"}
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

          <div className="divider">yoki</div>
          <div className="socials">
            <button type="button" className="soc" onClick={() => alert("Google orqali kirish tez kunda ishga tushadi!")}>
              <i className="ti ti-brand-google"></i> Google
            </button>
            <button type="button" className="soc" onClick={() => alert("MyID orqali kirish tez kunda ishga tushadi!")}>
              <i className="ti ti-id-badge-2"></i> MyID
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
