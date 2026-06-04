import { Nav } from "@/components/ui";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Foydalanish shartlari — Joy",
  description: "Joy platformasining foydalanish shartlari va maxfiylik siyosati",
};

const sections = [
  {
    title: "1. Umumiy qoidalar",
    content: `Joy platformasi (keyingi o'rinlarda — "Platforma") ko'chmas mulk e'lonlarini joylashtirish va qidirish uchun mo'ljallangan onlayn xizmat hisoblanadi. Platformadan foydalanish ushbu shartlarga rozilik bildirishni anglatadi. Platforma O'zbekiston Respublikasi qonunchiligiga muvofiq faoliyat yuritadi. Biz istalgan vaqtda ushbu shartlarni o'zgartirish huquqini saqlab qolamiz va o'zgarishlar saytda e'lon qilingandan keyin kuchga kiradi.`,
  },
  {
    title: "2. Foydalanish shartlari",
    content: `Platformadan foydalanish uchun siz kamida 18 yoshda bo'lishingiz kerak. Ro'yxatdan o'tishda siz haqiqiy ma'lumotlarni taqdim etishga rozilik bildirasiz. Har bir foydalanuvchi faqat bitta hisob yaratishi mumkin. Siz o'z hisobingiz xavfsizligi uchun javobgarsiz. Platformani noqonuniy maqsadlarda foydalanish taqiqlanadi. Boshqa foydalanuvchilarga nisbatan hurmatli bo'lishingiz talab etiladi.`,
  },
  {
    title: "3. E'lonlar qoidalari",
    content: `E'lonlar faqat ko'chmas mulkka oid bo'lishi kerak. E'lon joylashda haqiqiy ma'lumotlar, to'g'ri narx va sifatli rasmlar taqdim etilishi shart. Yolg'on yoki chalg'ituvchi e'lonlar joylashish taqiqlanadi. Har bir e'lon moderatsiyadan o'tkaziladi va mos bo'lmagan e'lonlar rad etilishi mumkin. Bir xil mulk uchun bir nechta e'lon joylash taqiqlanadi. Noqonuniy mulklarni e'lon qilish jinoiy javobgarlikka sabab bo'lishi mumkin.`,
  },
  {
    title: "4. Maxfiylik siyosati",
    content: `Biz foydalanuvchilarning shaxsiy ma'lumotlarini himoya qilishga katta e'tibor beramiz. To'plangan ma'lumotlar: ism, telefon raqami, elektron pochta manzili va IP manzili. Ushbu ma'lumotlar faqat platformaning ishlashi va xavfsizligini ta'minlash maqsadida ishlatiladi. Biz foydalanuvchi ma'lumotlarini uchinchi tomonlarga sotmaymiz yoki bermaymiz (qonun talab qilgan holatlar bundan mustasno). Siz istalgan vaqtda hisobingizni va barcha ma'lumotlarni o'chirish huquqiga egasiz.`,
  },
  {
    title: "5. Cookie fayllari",
    content: `Platforma cookie fayllaridan foydalanadi. Cookie fayllar saytning to'g'ri ishlashi, foydalanuvchi tajribasini yaxshilash va statistik ma'lumotlar to'plash uchun ishlatiladi. Siz brauzer sozlamalari orqali cookie fayllarni boshqarishingiz mumkin, ammo ba'zi funksiyalar cookie larsiz to'g'ri ishlamasligi mumkin.`,
  },
  {
    title: "6. Javobgarlik chegaralari",
    content: `Joy platformasi e'lonlar tarkibidagi ma'lumotlarning to'g'riligiga kafolat bermaydi. Biz foydalanuvchilar o'rtasidagi bitimlar uchun javobgar emasmiz. Platforma vositachilik xizmatini ko'rsatmaydi — faqat e'lon beruvchi va qidiruvchini bog'laydi. Texnik nosozliklar yoki ta'mirlash ishlari sababli xizmatning vaqtincha to'xtatilishi mumkin. Platforma foydalanuvchilar tomonidan yetkazilgan zarar uchun javobgarlik olmaydi.`,
  },
  {
    title: "7. Intellektual mulk",
    content: `Platformadagi barcha dizayn, kod, grafika va kontent Joy platformasining intellektual mulki hisoblanadi. Ruxsatsiz nusxa ko'chirish, tarqatish yoki o'zgartirish taqiqlanadi. Foydalanuvchilar joylashtirgan kontent (rasmlar, tavsiflar) foydalanuvchining o'ziga tegishli bo'lib qoladi, ammo platformada ko'rsatish huquqi Joy ga beriladi.`,
  },
  {
    title: "8. Nizolarni hal qilish",
    content: `Platforma bilan bog'liq nizolar birinchi navbatda muzokaralar yo'li bilan hal qilinadi. Kelishuv erishilmagan taqdirda, nizo O'zbekiston Respublikasi qonunchiligiga muvofiq sudga murojaat qilish orqali hal etiladi. Barcha savol va shikoyatlar uchun info@joy.uz manziliga murojaat qilishingiz mumkin.`,
  },
];

export default function TermsPage() {
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
            <i className="ti ti-file-text" />
            Huquqiy hujjat
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
            Foydalanish shartlari
          </h1>
          <p style={{ fontSize: 15, color: "#B6ADA3" }}>
            Oxirgi yangilanish: 2026-yil, 1-iyun
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="wrap" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {sections.map((s) => (
            <div key={s.title} style={{ marginBottom: 36 }}>
              <h2
                className="display"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 14,
                  color: "var(--ink)",
                }}
              >
                {s.title}
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--text2)",
                  lineHeight: 1.8,
                }}
              >
                {s.content}
              </p>
            </div>
          ))}

          {/* Contact info */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--sand)",
              borderRadius: 20,
              padding: 28,
              marginTop: 40,
            }}
          >
            <h3
              className="display"
              style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}
            >
              Aloqa ma'lumotlari
            </h3>
            <div
              style={{
                fontSize: 15,
                color: "var(--text2)",
                lineHeight: 2,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <i className="ti ti-building" style={{ color: "var(--orange)", fontSize: 18 }} />
                Joy LLC, Toshkent shahri
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <i className="ti ti-mail" style={{ color: "var(--orange)", fontSize: 18 }} />
                info@joy.uz
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <i className="ti ti-phone" style={{ color: "var(--orange)", fontSize: 18 }} />
                +998 71 200 00 00
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
