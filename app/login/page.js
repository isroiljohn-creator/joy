"use client";
import { useState } from "react";
import Link from "next/link";
import { loginAction, registerAction } from "@/app/actions";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998 90 123 45 67");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
            Minglab ishonchli e'lon, xaritada qidiruv va to'g'ridan-to'g'ri aloqa
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
              Ro'yxatdan o'tish
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
            <div className="inp">
              <i className="ti ti-phone"></i>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="afield">
            <label>Parol</label>
            <div className="inp">
              <i className="ti ti-lock"></i>
              <input
                type={showPassword ? "text" : "password"}
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

          <div className="divider">yoki</div>
          <div className="socials">
            <button type="button" className="soc">
              <i className="ti ti-brand-google"></i> Google
            </button>
            <button type="button" className="soc">
              <i className="ti ti-id-badge-2"></i> MyID
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
