"use client";

import { useState } from "react";
import { Nav } from "@/components/ui";
import Footer from "@/components/Footer";

const faqs = [
  {
    q: "maskon platformasida qanday ro'yxatdan o'taman?",
    a: "\"Kirish\" tugmasini bosing, telefon raqamingizni kiriting va SMS orqali tasdiqlang. Ro'yxatdan o'tish mutlaqo bepul va bir necha daqiqa davom etadi. Ro'yxatdan o'tgandan so'ng barcha imkoniyatlardan foydalanishingiz mumkin.",
  },
  {
    q: "E'lon joylash pullikmi?",
    a: "Yo'q, maskon platformasida e'lon joylash mutlaqo bepul. Siz uyingiz, kvartirangiz yoki ofisingiz haqida e'lon joylab, minglab potentsial xaridorlar va ijarachilar bilan bog'lanishingiz mumkin. Premium ta'rif tanlamasangiz, hech qanday to'lov talab qilinmaydi.",
  },
  {
    q: "Qanday qilib e'lon joylash mumkin?",
    a: "Hisobingizga kiring, \"E'lon qo'shish\" tugmasini bosing. Mulk turini tanlang, manzil, narx, xonalar soni va boshqa ma'lumotlarni kiriting. Rasmlar qo'shing va \"Joylashtirish\" tugmasini bosing. E'loningiz moderatsiyadan o'tgandan so'ng saytda paydo bo'ladi.",
  },
  {
    q: "E'lonimni qanday tahrirlash yoki o'chirish mumkin?",
    a: "Profilingizga o'ting va \"Mening e'lonlarim\" bo'limida kerakli e'lonni toping. \"Tahrirlash\" tugmasi orqali ma'lumotlarni o'zgartirishingiz, \"O'chirish\" tugmasi orqali esa e'lonni butunlay olib tashlashingiz mumkin.",
  },
  {
    q: "Xaritada qidiruv qanday ishlaydi?",
    a: "E'lonlar ro'yxati sahifasida xarita avtomatik ko'rsatiladi. Siz xaritada navigatsiya qilishingiz, masshtabni o'zgartirishingiz va ma'lum hududdagi e'lonlarni ko'rishingiz mumkin. Har bir pin ustida narx ko'rsatiladi, bosganingizda esa to'liq ma'lumot ochiladi.",
  },
  {
    q: "Sotuvchi yoki uy egasi bilan qanday bog'lanaman?",
    a: "E'lon sahifasida \"Qo'ng'iroq qilish\" yoki \"Xabar yozish\" tugmalarini bosing. Telefon raqami to'g'ridan-to'g'ri ko'rsatiladi. Shuningdek, platformadagi ichki xabar tizimi orqali ham muloqot qilishingiz mumkin.",
  },
  {
    q: "E'lonlar qanday tasdiqlanadi?",
    a: "Har bir yangi e'lon bizning moderatorlar jamoamiz tomonidan tekshiriladi. Biz rasmlar, narx va manzil ma'lumotlarini tasdiqlaimiz. Soxta yoki noto'g'ri e'lonlar rad etiladi. Bu jarayon odatda 1-2 soat ichida yakunlanadi.",
  },
  {
    q: "maskon platformasida qanday mulk turlari bor?",
    a: "Platformamizda kvartiralar, xususiy uylar, ofislar, tijorat binolari, er uchastkalar va yangi qurilish loyihalari (novostroykalar) mavjud. Har bir toifa bo'yicha qulay filtrlar yordamida kerakli mulkni osongina topishingiz mumkin.",
  },
  {
    q: "Ijaraga olish uchun qanday hujjatlar kerak?",
    a: "Bu to'g'ridan-to'g'ri uy egasi bilan kelishiladi. Odatda pasport nusxasi va ijara shartnomasi talab qilinadi. maskon platformasi vositachilik qilmaydi — biz faqat siz va uy egasini bog'laymiz.",
  },
  {
    q: "Texnik muammo yuzaga kelsa kimga murojaat qilaman?",
    a: "Bizning qo'llab-quvvatlash xizmatimiz dushanba-juma, soat 9:00 dan 18:00 gacha ishlaydi. Telegram: @maskon_support, telefon: +998 71 200 00 00 yoki info@maskon.uz manziliga xat yuboring.",
  },
];

function AccordionItem({ faq, isOpen, toggle }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--sand)",
        borderRadius: 18,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        boxShadow: isOpen ? "0 8px 24px rgba(26,19,14,0.06)" : "none",
      }}
    >
      <button
        onClick={toggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 16,
          fontWeight: 600,
          color: isOpen ? "var(--orange)" : "var(--ink)",
          textAlign: "left",
          gap: 16,
          transition: "color 0.2s",
        }}
      >
        <span style={{ flex: 1 }}>{faq.q}</span>
        <i
          className={isOpen ? "ti ti-chevron-up" : "ti ti-chevron-down"}
          style={{
            fontSize: 20,
            color: isOpen ? "var(--orange)" : "var(--muted)",
            flexShrink: 0,
            transition: "transform 0.2s",
          }}
        />
      </button>
      {isOpen && (
        <div
          style={{
            padding: "0 24px 20px",
            fontSize: 15,
            color: "var(--text2)",
            lineHeight: 1.7,
          }}
        >
          {faq.a}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState(0);

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
            <i className="ti ti-help-circle" />
            Yordam markazi
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
            Ko'p so'raladigan savollar
          </h1>
          <p style={{ fontSize: 16, color: "#B6ADA3", maxWidth: 500, margin: "0 auto" }}>
            Eng ko'p beriladigan savollarga javoblarni shu yerda topishingiz mumkin
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="wrap" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              faq={faq}
              isOpen={openIndex === i}
              toggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="wrap" style={{ paddingTop: 0, paddingBottom: 64 }}>
        <div
          style={{
            background: "var(--orange-tint)",
            borderRadius: 24,
            padding: "40px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3
              className="display"
              style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}
            >
              Javob topmadingizmi?
            </h3>
            <p style={{ fontSize: 15, color: "var(--text2)" }}>
              Bizning qo'llab-quvvatlash xizmatimiz bilan bog'laning
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href="tel:+998712000000"
              className="btn-add"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                fontWeight: 600,
                padding: "12px 22px",
                textDecoration: "none",
              }}
            >
              <i className="ti ti-phone" />
              +998 71 200 00 00
            </a>
            <a
              href="mailto:info@maskon.uz"
              className="btn-ghost"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                padding: "12px 22px",
                textDecoration: "none",
              }}
            >
              <i className="ti ti-mail" />
              info@maskon.uz
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
