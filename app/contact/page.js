"use client";

import { useState } from "react";
import { Nav } from "@/components/ui";
import Footer from "@/components/Footer";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <>
      <Nav />

      {/* Header */}
      <section
        style={{
          background: "var(--ink)",
          padding: "56px 0",
          textAlign: "center",
          color: "var(--cream)",
        }}
      >
        <div className="wrap">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(242,89,31,0.18)",
              color: "var(--orange)",
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 14px",
              borderRadius: 20,
              marginBottom: 22,
            }}
          >
            <i className="ti ti-mail" />
            Aloqa
          </div>
          <h1
            className="display"
            style={{
              fontSize: 44,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: 12,
            }}
          >
            Biz bilan bog'laning
          </h1>
          <p style={{ fontSize: 16, color: "#B6ADA3", maxWidth: 480, margin: "0 auto" }}>
            Savolingiz bormi? Biz sizga yordam berishdan mamnunmiz
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="wrap" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 36,
            alignItems: "start",
          }}
        >
          {/* Form */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--sand)",
              borderRadius: 24,
              padding: 32,
            }}
          >
            <h2
              className="display"
              style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}
            >
              Xabar yuborish
            </h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
              Formani to'ldiring, biz tez orada javob beramiz
            </p>

            {sent && (
              <div
                style={{
                  background: "var(--green-tint)",
                  color: "var(--green)",
                  padding: "14px 18px",
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <i className="ti ti-check" style={{ fontSize: 20 }} />
                Xabaringiz muvaffaqiyatli yuborildi!
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div className="field">
                  <label>Ismingiz</label>
                  <input
                    name="name"
                    placeholder="Sardor Karimov"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="field">
                  <label>Elektron pochta</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="sardor@mail.uz"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Telefon raqami</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="field" style={{ marginBottom: 20 }}>
                <label>Xabar</label>
                <textarea
                  name="message"
                  placeholder="Xabaringizni yozing..."
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                />
              </div>
              <button
                type="submit"
                className="btn-pub"
                style={{ borderRadius: 16 }}
              >
                <i className="ti ti-send" style={{ fontSize: 18 }} />
                Yuborish
              </button>
            </form>
          </div>

          {/* Contact Info Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Office */}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--sand)",
                borderRadius: 20,
                padding: 24,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "var(--orange-tint)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <i className="ti ti-building" style={{ fontSize: 24, color: "var(--orange)" }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                Ofis manzili
              </h3>
              <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6 }}>
                Toshkent sh., Mirzo Ulug'bek tumani,
                <br />
                Buyuk Ipak Yo'li ko'chasi, 15-uy,
                <br />
                3-qavat, 301-xona
              </p>
            </div>

            {/* Phone */}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--sand)",
                borderRadius: 20,
                padding: 24,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "var(--orange-tint)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <i className="ti ti-phone" style={{ fontSize: 24, color: "var(--orange)" }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                Telefon
              </h3>
              <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.8 }}>
                +998 71 200 00 00
                <br />
                +998 90 123 45 67
              </p>
            </div>

            {/* Email */}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--sand)",
                borderRadius: 20,
                padding: 24,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "var(--orange-tint)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <i className="ti ti-mail" style={{ fontSize: 24, color: "var(--orange)" }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                Elektron pochta
              </h3>
              <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.8 }}>
                info@maskon.uz
                <br />
                support@maskon.uz
              </p>
            </div>

            {/* Working hours */}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--sand)",
                borderRadius: 20,
                padding: 24,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "var(--orange-tint)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <i className="ti ti-clock" style={{ fontSize: 24, color: "var(--orange)" }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                Ish vaqti
              </h3>
              <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Dushanba — Juma</span>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>09:00 — 18:00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Shanba</span>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>10:00 — 15:00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Yakshanba</span>
                  <span style={{ fontWeight: 600, color: "var(--muted)" }}>Dam olish</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
