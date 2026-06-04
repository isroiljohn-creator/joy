import Link from "next/link";
import { Nav, ListingCard } from "@/components/ui";
import SearchBox from "@/components/SearchBox";
import { getListings, categories } from "@/lib/data";

export default async function Home() {
  const allActive = await getListings();
  const featured = allActive.slice(0, 3);

  return (
    <>
      <Nav />
      <header className="wrap hero">
        <div>
          <div className="tagline">
            <i className="ti ti-map-pin"></i> O'zbekiston bo'ylab 12 000+ e'lon
          </div>
          <h1 className="display">
            Joyingizni <span className="acc">Joy</span>dan toping
          </h1>
          <p>
            Uy sotib oling, ijaraga oling yoki ofis tanlang — xaritada qidiring,
            ishonchli e'lonlarni ko'ring va to'g'ridan-to'g'ri egasi bilan
            bog'laning.
          </p>
          
          <SearchBox />
          
          <div className="stats">
            <div className="stat-h">
              <div className="n">12 000+</div>
              <div className="l">Faol e'lon</div>
            </div>
            <div className="stat-h">
              <div className="n">340+</div>
              <div className="l">Qurilish loyihasi</div>
            </div>
            <div className="stat-h">
              <div className="n">98%</div>
              <div className="l">Mamnun mijoz</div>
            </div>
          </div>
        </div>
        <div
          className="hero-art"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=75')",
          }}
        >
          <div className="float tl">
            <div className="ic">
              <i className="ti ti-home"></i>
            </div>
            <div>
              <div className="v">3 xonali</div>
              <div className="s">Chilonzor · $72 000</div>
            </div>
          </div>
          <div className="float br">
            <div className="ic">
              <i className="ti ti-shield-check"></i>
            </div>
            <div>
              <div className="v">Tasdiqlangan</div>
              <div className="s">Hujjatlar tekshirilgan</div>
            </div>
          </div>
        </div>
      </header>

      <section className="wrap" style={{ paddingTop: 20 }}>
        <div className="sec-head">
          <div>
            <h2 className="display">Nimani izlayapsiz?</h2>
            <p>To'rt toifadan birini tanlang</p>
          </div>
        </div>
        <div className="cats">
          {categories.map((c) => (
            <Link
              className="cat"
              href={`/listings?cat=${encodeURIComponent(c.key)}`}
              key={c.key}
            >
              <div className="cic" style={{ background: c.bg, color: c.fg }}>
                <i className={`ti ${c.icon}`}></i>
              </div>
              <h3>{c.key}</h3>
              <span>{c.sub}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="sec-head">
          <div>
            <h2 className="display">Sotuvga tavsiyalar</h2>
            <p>Toshkentdagi eng yaxshi takliflar</p>
          </div>
          <Link className="viewall" href="/listings">
            Hammasi <i className="ti ti-arrow-right"></i>
          </Link>
        </div>
        <div className="grid">
          {featured.map((l) => (
            <ListingCard l={l} key={l.id} />
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="why">
          <h2 className="display">Nega aynan Joy?</h2>
          <div className="sub">Uy izlash hech qachon bunchalik oson bo'lmagan</div>
          <div className="feats">
            <div className="feat">
              <div className="fic">
                <i className="ti ti-map-2"></i>
              </div>
              <h3>Xaritada qidiruv</h3>
              <p>
                Uylarni xaritada ko'ring — metro, maktab va infratuzilmaga
                yaqinligini bir qarashda biling.
              </p>
            </div>
            <div className="feat">
              <div className="fic">
                <i className="ti ti-shield-check"></i>
              </div>
              <h3>Ishonchli e'lonlar</h3>
              <p>
                Har bir e'lon va egasi tasdiqlanadi. Soxta e'lonlarsiz, faqat
                haqiqiy takliflar.
              </p>
            </div>
            <div className="feat">
              <div className="fic">
                <i className="ti ti-messages"></i>
              </div>
              <h3>To'g'ridan-to'g'ri aloqa</h3>
              <p>
                Vositachisiz, to'g'ridan-to'g'ri sotuvchi yoki ijaraga beruvchi
                bilan bog'laning.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 0 }}>
        <div className="cta">
          <h2 className="display">Uyingizni soting yoki ijaraga bering</h2>
          <p>Bepul e'lon joylang — minglab xaridorlar sizni topadi</p>
          <Link className="ctabtn" href="/add">
            <i className="ti ti-plus"></i> E'lon qo'shish
          </Link>
        </div>
      </section>

      <footer className="wrap">
        <Link className="logo" href="/">
          <span className="dot"></span>Joy
        </Link>
        <div className="fnav">
          <a>Biz haqimizda</a>
          <a>Yordam</a>
          <a>Shartlar</a>
          <a>Aloqa</a>
        </div>
        <div>© 2026 Joy.uz</div>
      </footer>
    </>
  );
}
