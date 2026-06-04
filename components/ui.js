import Link from "next/link";

export function Nav() {
  return (
    <nav>
      <div className="nav-in">
        <Link className="logo" href="/"><span className="dot"></span>Joy</Link>
        <div className="nav-links">
          <Link href="/listings">Sotib olish</Link>
          <Link href="/listings">Ijara</Link>
          <Link href="/listings">Ofis</Link>
          <Link href="/listings">Novostroyka</Link>
        </div>
        <div className="nav-r">
          <Link className="btn-ghost" href="/login">Kirish</Link>
          <Link className="btn-add" href="/add"><i className="ti ti-plus"></i> E'lon qo'shish</Link>
          <Link className="avatar" href="/profile"><i className="ti ti-user"></i></Link>
        </div>
      </div>
    </nav>
  );
}

export function ListingCard({ l }) {
  return (
    <Link className="card" href={`/property/${l.id}`}>
      <div className="photo" style={{ backgroundColor: "#C9BDA8", backgroundImage: `url('${l.photo}')` }}>
        {l.top && <span className="badge">TOP</span>}
        <div className="heart"><i className="ti ti-heart"></i></div>
      </div>
      <div className="cb">
        <div className="price">{l.price}</div>
        <div className="ptype">{l.type}</div>
        <div className="addr"><i className="ti ti-map-pin"></i> {l.addr}, Toshkent</div>
        <div className="specs">
          <div className="spec"><i className="ti ti-bed"></i> {l.rooms} xona</div>
          <div className="spec"><i className="ti ti-bath"></i> {l.baths} hammom</div>
          <div className="spec"><i className="ti ti-stairs"></i> {l.floor}</div>
        </div>
      </div>
    </Link>
  );
}
