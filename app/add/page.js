"use client";
import { useState } from "react";
import { Nav } from "@/components/ui";

const cats = [
  { key: "Yangi uy", icon: "ti-building-skyscraper" },
  { key: "Ikkilamchi", icon: "ti-home" },
  { key: "Ijara", icon: "ti-key" },
  { key: "Ofis", icon: "ti-briefcase" },
];

export default function Add() {
  const [cat, setCat] = useState("Yangi uy");
  return (
    <>
      <Nav />
      <div className="wrap">
        <h1 className="page-title display">E'lon qo'shish</h1>
        <div className="page-sub">Uyingizni soting yoki ijaraga bering — bepul va tez</div>

        <div className="flayout">
          <div>
            <div className="fsection">
              <h2 className="display"><span className="fnum">1</span> Toifa</h2>
              <div className="chips">
                {cats.map((c) => (
                  <div key={c.key} className={"chip" + (cat === c.key ? " on" : "")} onClick={() => setCat(c.key)}>
                    <i className={`ti ${c.icon}`}></i><span>{c.key}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fsection">
              <h2 className="display"><span className="fnum">2</span> Asosiy ma'lumotlar</h2>
              <div className="frow"><div className="field full"><label>Sarlavha</label><input defaultValue="3 xonali kvartira" /></div></div>
              <div className="frow">
                <div className="field"><label>Xonalar soni</label><select defaultValue="3 xona"><option>1 xona</option><option>2 xona</option><option>3 xona</option><option>4 xona</option><option>5+ xona</option></select></div>
                <div className="field"><label>Hammomlar</label><select><option>1</option><option>2</option><option>3</option></select></div>
              </div>
              <div className="frow">
                <div className="field"><label>Maydon (m²)</label><input defaultValue="78" /></div>
                <div className="field"><label>Qavat / Jami</label><input defaultValue="5 / 9" /></div>
              </div>
            </div>

            <div className="fsection">
              <h2 className="display"><span className="fnum">3</span> Narx</h2>
              <div className="frow">
                <div className="field"><label>Narx (USD)</label><input defaultValue="72 000" /></div>
                <div className="field"><label>To'lov turi</label><select><option>Sotuv</option><option>Oylik ijara</option><option>Kunlik ijara</option></select></div>
              </div>
            </div>

            <div className="fsection">
              <h2 className="display"><span className="fnum">4</span> Joylashuvi</h2>
              <div className="frow">
                <div className="field"><label>Tuman</label><select><option>Chilonzor</option><option>Yunusobod</option><option>Mirzo Ulug'bek</option><option>Sergeli</option></select></div>
                <div className="field"><label>Mahalla / kvartal</label><input defaultValue="9-kvartal" /></div>
              </div>
            </div>

            <div className="fsection">
              <h2 className="display"><span className="fnum">5</span> Fotosuratlar</h2>
              <div className="drop"><i className="ti ti-photo-up"></i><div className="t">Rasmlarni shu yerga torting yoki tanlang</div><div className="s">JPG, PNG · 20 tagacha · har biri 10 MB gacha</div></div>
            </div>

            <div className="fsection">
              <h2 className="display"><span className="fnum">6</span> Tavsif</h2>
              <div className="field full"><textarea defaultValue="Chilonzor tumanining markazida, metroga yaqin yorug' 3 xonali kvartira."></textarea></div>
            </div>
          </div>

          <div>
            <div className="side" style={{ position: "sticky", top: 84, padding: 0, overflow: "hidden" }}>
              <div style={{ fontSize: 12, color: "var(--muted)", padding: "14px 16px 0", display: "flex", alignItems: "center", gap: 6 }}><i className="ti ti-eye" style={{ fontSize: 15 }}></i> Ko'rinishi</div>
              <div style={{ padding: "12px 12px 0" }}>
                <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--sand)" }}>
                  <div style={{ height: 130, backgroundImage: "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=70')", backgroundSize: "cover", position: "relative" }}><span className="badge">YANGI</span></div>
                  <div style={{ padding: "14px 16px 16px" }}>
                    <div className="price" style={{ fontSize: 20 }}>$72 000</div>
                    <div style={{ fontSize: 14, fontWeight: 600, margin: "4px 0 2px" }}>3 xonali kvartira</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}><i className="ti ti-map-pin" style={{ fontSize: 13 }}></i> Chilonzor 9-kvartal</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <button className="btn-pub"><i className="ti ti-rocket"></i> E'lonni joylash</button>
                <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 10 }}>Joylashdan oldin moderatsiyadan o'tadi</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
