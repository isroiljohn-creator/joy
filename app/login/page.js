"use client";
import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [mode, setMode] = useState("login");
  return (
    <div className="shell">
      <div className="visual">
        <div className="vbg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=75')" }}></div>
        <div className="ov"></div>
        <Link className="vlogo" href="/"><span className="dot"></span>Joy</Link>
        <div className="vtext">
          <h2 className="display">Joyingizni Joydan toping</h2>
          <p>Minglab ishonchli e'lon, xaritada qidiruv va to'g'ridan-to'g'ri aloqa — barchasi bir joyda.</p>
        </div>
        <div></div>
      </div>

      <div className="formside">
        <div className="formbox">
          <div className="aseg">
            <button className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>Kirish</button>
            <button className={mode === "register" ? "on" : ""} onClick={() => setMode("register")}>Ro'yxatdan o'tish</button>
          </div>
          <h1 className="display">{mode === "login" ? "Xush kelibsiz" : "Hisob yarating"}</h1>
          <div className="lead">{mode === "login" ? "Hisobingizga kiring va davom eting" : "Bir daqiqada ro'yxatdan o'ting"}</div>

          {mode === "register" && (
            <div className="afield"><label>Ism familiya</label><div className="inp"><i className="ti ti-user"></i><input placeholder="Aziz Karimov" /></div></div>
          )}
          <div className="afield"><label>Telefon raqami</label><div className="inp"><i className="ti ti-phone"></i><input defaultValue="+998 90 123 45 67" /></div></div>
          <div className="afield"><label>Parol</label><div className="inp"><i className="ti ti-lock"></i><input type="password" defaultValue="password" /><i className="ti ti-eye" style={{ cursor: "pointer" }}></i></div></div>

          <Link className="btn-main" href="/profile" style={{ textDecoration: "none" }}>
            <i className={mode === "login" ? "ti ti-login-2" : "ti ti-user-plus"}></i> {mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
          </Link>

          <div className="divider">yoki</div>
          <div className="socials">
            <button className="soc"><i className="ti ti-brand-google"></i> Google</button>
            <button className="soc"><i className="ti ti-id-badge-2"></i> MyID</button>
          </div>
        </div>
      </div>
    </div>
  );
}
