import { Nav } from "@/components/ui";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Biz haqimizda — maskon",
  description: "maskon — O'zbekistondagi eng ishonchli ko'chmas mulk platformasi",
};

const team = [
  { name: "Sardor Karimov", role: "Asoschi & Bosh direktor", icon: "ti-user-star" },
  { name: "Malika Rashidova", role: "Texnologiya bo'limi boshlig'i", icon: "ti-code" },
  { name: "Bobur Aliyev", role: "Biznes rivojlantirish", icon: "ti-chart-line" },
  { name: "Nilufar Toshmatova", role: "Marketing menejeri", icon: "ti-speakerphone" },
  { name: "Jasur Mirzayev", role: "Mahsulot dizayneri", icon: "ti-palette" },
  { name: "Dilnoza Umarova", role: "Mijozlar xizmati", icon: "ti-headset" },
];

const stats = [
  { value: "12 000+", label: "Faol e'lonlar", icon: "ti-building" },
  { value: "50 000+", label: "Foydalanuvchilar", icon: "ti-users" },
  { value: "14", label: "Viloyat qamrovi", icon: "ti-map" },
  { value: "98%", label: "Mamnun mijozlar", icon: "ti-heart" },
];

export default function AboutPage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <section
        style={{
          background: "var(--ink)",
          padding: "72px 0 64px",
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
            <i className="ti ti-info-circle" />
            Biz haqimizda
          </div>
          <h1
            className="display"
            style={{
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: 16,
            }}
          >
            Uy-joyingizni topishda <span style={{ color: "var(--orange)" }}>ishonchli</span> hamkor
          </h1>
          <p
            style={{
              fontSize: 17,
              color: "#B6ADA3",
              lineHeight: 1.7,
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            maskon — bu O'zbekistondagi eng zamonaviy ko'chmas mulk platformasi.
            Biz uy sotib olish, ijaraga olish va sotish jarayonini oson, shaffof
            va ishonchli qilish uchun ishlaymiz.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="wrap" style={{ paddingTop: 56, paddingBottom: 56 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--sand)",
              borderRadius: 24,
              padding: 32,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "var(--orange-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <i className="ti ti-target" style={{ fontSize: 28, color: "var(--orange)" }} />
            </div>
            <h2
              className="display"
              style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}
            >
              Bizning missiya
            </h2>
            <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7 }}>
              Har bir o'zbek oilasiga o'z joyini topishda yordam berish. Biz
              ko'chmas mulk bozorini shaffof, qulay va hamma uchun ochiq
              qilishga intilamiz. Texnologiya yordamida vositachilarni kamaytirish
              va to'g'ridan-to'g'ri aloqani ta'minlash — bizning asosiy maqsadimiz.
            </p>
          </div>
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--sand)",
              borderRadius: 24,
              padding: 32,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "var(--orange-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <i className="ti ti-eye" style={{ fontSize: 28, color: "var(--orange)" }} />
            </div>
            <h2
              className="display"
              style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}
            >
              Bizning ko'rish
            </h2>
            <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7 }}>
              2030-yilga kelib O'zbekistondagi har bir ko'chmas mulk bitimi
              raqamli platformada amalga oshirilsin. Biz sun'iy intellekt va
              xarita texnologiyalarini birlashtirgan yagona ekotizim yaratishni
              maqsad qilganmiz. Ishonch va innovatsiya — bizning kelajagimiz.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="wrap" style={{ paddingTop: 0, paddingBottom: 56 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 18,
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: "#fff",
                border: "1px solid var(--sand)",
                borderRadius: 20,
                padding: 24,
                textAlign: "center",
              }}
            >
              <i
                className={`ti ${s.icon}`}
                style={{ fontSize: 28, color: "var(--orange)", marginBottom: 10, display: "block" }}
              />
              <div
                className="display"
                style={{ fontSize: 30, fontWeight: 700, marginBottom: 4 }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 14, color: "var(--muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="wrap" style={{ paddingTop: 0, paddingBottom: 64 }}>
        <div className="sec-head" style={{ marginBottom: 28 }}>
          <div>
            <h2 className="display">Bizning jamoa</h2>
            <p>maskonni yaratayotgan mutaxassislar</p>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {team.map((m) => (
            <div
              key={m.name}
              style={{
                background: "#fff",
                border: "1px solid var(--sand)",
                borderRadius: 20,
                padding: 24,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--orange-tint)",
                  color: "var(--orange-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <i className={`ti ${m.icon}`} style={{ fontSize: 24 }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
                  {m.name}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="wrap" style={{ paddingTop: 0, paddingBottom: 64 }}>
        <div
          className="why"
          style={{
            background: "var(--ink)",
            borderRadius: 32,
            padding: 54,
            color: "var(--cream)",
          }}
        >
          <h2
            className="display"
            style={{
              fontSize: 32,
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Bizning qadriyatlar
          </h2>
          <div
            style={{
              textAlign: "center",
              color: "#B6ADA3",
              fontSize: 15,
              marginBottom: 40,
            }}
          >
            Har bir qarorimizda bu tamoyillarga amal qilamiz
          </div>
          <div className="feats">
            <div className="feat">
              <div className="fic">
                <i className="ti ti-shield-check" />
              </div>
              <h3>Ishonch</h3>
              <p>
                Har bir e'lon va foydalanuvchi tasdiqlanadi. Soxta ma'lumotlardan
                himoya qilish bizning ustuvor vazifamiz.
              </p>
            </div>
            <div className="feat">
              <div className="fic">
                <i className="ti ti-bulb" />
              </div>
              <h3>Innovatsiya</h3>
              <p>
                Zamonaviy texnologiyalar — xaritali qidiruv, sun'iy intellekt
                tavsiyalari va qulay interfeys.
              </p>
            </div>
            <div className="feat">
              <div className="fic">
                <i className="ti ti-users-group" />
              </div>
              <h3>Jamiyat</h3>
              <p>
                Biz faqat platforma emas, balki ishonchli ko'chmas mulk
                jamoasini quryapmiz.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 760px) {
          .about-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
