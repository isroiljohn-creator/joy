import Link from "next/link";
import { Nav, ListingCard } from "@/components/ui";
import SearchBox from "@/components/SearchBox";
import Footer from "@/components/Footer";
import MobileHome from "@/components/MobileHome";
import { getListings, getListingCount, categories } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allActive = await getListings();
  const featured = allActive.slice(0, 3);
  const count = await getListingCount();

  return (
    <>
      <Nav />
      <header className="wrap hero">
        <div>
          <div className="tagline">
            <i className="ti ti-map-pin"></i> O&apos;zbekiston bo&apos;ylab {count.toLocaleString()}+ e&apos;lon
          </div>
          <h1 className="display">
            Joyingizni <span className="acc">Joy</span>dan toping
          </h1>
          <p>
            Uy sotib oling, ijaraga oling yoki ofis tanlang — xaritada qidiring,
            ishonchli e&apos;lonlarni ko&apos;ring va to&apos;g&apos;ridan-to&apos;g&apos;ri egasi bilan
            bog&apos;laning.
          </p>
          
          <SearchBox />
          
          <div className="stats">
            <div className="stat-h">
              <div className="n">{count.toLocaleString()}+</div>
              <div className="l">Faol e&apos;lon</div>
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
          <Link href="/property/1" className="float tl" style={{ cursor: "pointer" }}>
            <div className="ic">
              <i className="ti ti-home"></i>
            </div>
            <div>
              <div className="v">3 xonali</div>
              <div className="s">Chilonzor · $72 000</div>
            </div>
          </Link>
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
            <p>To&apos;rt toifadan birini tanlang</p>
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
          <div className="sub">Uy izlash hech qachon bunchalik oson bo&apos;lmagan</div>
          <div className="feats">
            <div className="feat">
              <div className="fic">
                <i className="ti ti-map-2"></i>
              </div>
              <h3>Xaritada qidiruv</h3>
              <p>
                Uylarni xaritada ko&apos;ring — metro, maktab va infratuzilmaga
                yaqinligini bir qarashda biling.
              </p>
            </div>
            <div className="feat">
              <div className="fic">
                <i className="ti ti-shield-check"></i>
              </div>
              <h3>Ishonchli e&apos;lonlar</h3>
              <p>
                Har bir e&apos;lon va egasi tasdiqlanadi. Soxta e&apos;lonlarsiz, faqat
                haqiqiy takliflar.
              </p>
            </div>
            <div className="feat">
              <div className="fic">
                <i className="ti ti-messages"></i>
              </div>
              <h3>To&apos;g&apos;ridan-to&apos;g&apos;ri aloqa</h3>
              <p>
                Vositachisiz, to&apos;g&apos;ridan-to&apos;g&apos;ri sotuvchi yoki ijaraga beruvchi
                bilan bog&apos;laning.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 0 }}>
        <div className="cta">
          <h2 className="display">Uyingizni soting yoki ijaraga bering</h2>
          <p>Bepul e&apos;lon joylang — minglab xaridorlar sizni topadi</p>
          <Link className="ctabtn" href="/add">
            <i className="ti ti-plus"></i> E&apos;lon qo&apos;shish
          </Link>
        </div>
      </section>

      <Footer />

      {/* Mobil versiya */}
      <MobileHome listings={allActive} count={count} />
    </>
  );
}
