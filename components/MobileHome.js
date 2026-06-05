"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATS = [
  { k: "Yangi uylar", i: "ti-building-skyscraper", bg: "var(--orange-tint)", fg: "var(--orange-dark)" },
  { k: "Ikkilamchi", i: "ti-home", bg: "var(--blue-tint)", fg: "var(--blue)" },
  { k: "Ijara", i: "ti-key", bg: "var(--amber-tint)", fg: "var(--amber)" },
  { k: "Ofis", i: "ti-briefcase", bg: "var(--purple-tint)", fg: "var(--purple)" },
];

export default function MobileHome({ listings = [], count = 0 }) {
  const router = useRouter();
  const featured = listings[0];
  const rest = listings.slice(1, 4);

  return (
    <div className="mobile-only">
      {/* Top Bar */}
      <div className="mtop">
        <div className="miconbtn">
          <i className="ti ti-menu-2"></i>
        </div>
        <div className="mloc">
          <div className="ml">Sizning hududingiz</div>
          <div className="mv">
            Toshkent, UZ <i className="ti ti-chevron-down"></i>
          </div>
        </div>
        <div className="miconbtn circle">
          <i className="ti ti-bell"></i>
          <span className="mdot"></span>
        </div>
      </div>

      {/* Search */}
      <div className="msearch" onClick={() => router.push('/listings')}>
        <i className="ti ti-search"></i>
        <input placeholder="Qidirishni boshlang..." readOnly />
        <i className="ti ti-adjustments-horizontal mfilt"></i>
      </div>

      {/* Categories */}
      <div className="mcats">
        {CATS.map((c) => (
          <Link
            key={c.k}
            href={`/listings?cat=${encodeURIComponent(c.k)}`}
            className="mcat"
          >
            <div className="mcc" style={{ background: c.bg, color: c.fg }}>
              <i className={"ti " + c.i}></i>
            </div>
            <div className="mcn">{c.k}</div>
          </Link>
        ))}
      </div>

      {/* Featured */}
      {featured && (
        <>
          <div className="msh">
            <h2>Sotuvga tavsiyalar</h2>
            <Link href="/listings" className="mall">Hammasi</Link>
          </div>
          <div className="mfcard" onClick={() => router.push(`/property/${featured.id}`)}>
            <div
              className="mph"
              style={{ backgroundImage: featured.photos?.[0] ? `url('${featured.photos[0]}')` : undefined }}
            ></div>
            <div className="mmeta">
              <div className="mrow1">
                <div className="mic">
                  <i className="ti ti-building-skyscraper"></i>
                </div>
                <div className="mttl">
                  <div className="mt">{featured.type}</div>
                  <div className="ma">{featured.addr}, Toshkent</div>
                </div>
                <div className="marrow">
                  <i className="ti ti-arrow-up-right"></i>
                </div>
              </div>
              <div className="mprice">{featured.price}</div>
              <div className="mpills">
                <div className="mp"><i className="ti ti-bed"></i>{featured.rooms} xona</div>
                <div className="mp"><i className="ti ti-bath"></i>{featured.baths} hammom</div>
                <div className="mp"><i className="ti ti-stairs"></i>{featured.floor}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent Listings */}
      {rest.length > 0 && (
        <>
          <div className="msh">
            <h2>Yangi e'lonlar</h2>
            <Link href="/listings" className="mall">Hammasi</Link>
          </div>
          {rest.map((l) => (
            <div
              key={l.id}
              className="mlcard"
              onClick={() => router.push(`/property/${l.id}`)}
            >
              <div
                className="mlp"
                style={{ backgroundImage: l.photos?.[0] ? `url('${l.photos[0]}')` : undefined }}
              >
                {l.top && <span className="mbdg">TOP</span>}
              </div>
              <div className="mli">
                <div>
                  <div className="mlp1">{l.price}</div>
                  <div className="mlt">{l.type}</div>
                  <div className="mla">
                    <i className="ti ti-map-pin"></i> {l.addr}
                  </div>
                </div>
                <div className="mlspec">
                  <span><i className="ti ti-bed"></i>{l.rooms}</span>
                  <span><i className="ti ti-bath"></i>{l.baths}</span>
                  <span><i className="ti ti-ruler-2"></i>{l.area}m²</span>
                  <span><i className="ti ti-stairs"></i>{l.floor}</span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      <div style={{ height: 90 }}></div>
    </div>
  );
}
