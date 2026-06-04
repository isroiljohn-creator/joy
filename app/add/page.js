"use client";
import { useState } from "react";
import { Nav } from "@/components/ui";
import { createListingAction } from "@/app/actions";

const cats = [
  { key: "Yangi uy", icon: "ti-building-skyscraper" },
  { key: "Ikkilamchi", icon: "ti-home" },
  { key: "Ijara", icon: "ti-key" },
  { key: "Ofis", icon: "ti-briefcase" },
];

export default function Add() {
  const [cat, setCat] = useState("Yangi uy");
  const [title, setTitle] = useState("3 xonali kvartira");
  const [rooms, setRooms] = useState("3 xona");
  const [baths, setBaths] = useState("1");
  const [area, setArea] = useState("78");
  const [floor, setFloor] = useState("5/9");
  const [price, setPrice] = useState("72 000");
  const [district, setDistrict] = useState("Chilonzor");
  const [quarter, setQuarter] = useState("9-kvartal");
  const [desc, setDesc] = useState("Chilonzor tumanining markazida, metroga yaqin yorug' 3 xonali kvartira.");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("cat", cat);
    formData.append("title", title);
    formData.append("rooms", rooms.split(" ")[0]);
    formData.append("baths", baths);
    formData.append("area", area);
    formData.append("floor", floor);
    formData.append("price", price);
    formData.append("district", district);
    formData.append("quarter", quarter);
    formData.append("desc", desc);

    try {
      await createListingAction(formData);
    } catch (err) {
      console.error(err);
      alert("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
      setLoading(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="wrap">
        <h1 className="page-title display">E'lon qo'shish</h1>
        <div className="page-sub">
          Uyingizni soting yoki ijaraga bering — bepul va tez
        </div>

        <form onSubmit={handleSubmit} className="flayout">
          <div>
            <div className="fsection">
              <h2 className="display">
                <span className="fnum">1</span> Toifa
              </h2>
              <div className="chips">
                {cats.map((c) => (
                  <div
                    key={c.key}
                    className={"chip" + (cat === c.key ? " on" : "")}
                    onClick={() => setCat(c.key)}
                  >
                    <i className={`ti ${c.icon}`}></i>
                    <span>{c.key}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fsection">
              <h2 className="display">
                <span className="fnum">2</span> Asosiy ma'lumotlar
              </h2>
              <div className="frow">
                <div className="field full">
                  <label>Sarlavha (Kvartira turi)</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="frow">
                <div className="field">
                  <label>Xonalar soni</label>
                  <select
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                  >
                    <option>1 xona</option>
                    <option>2 xona</option>
                    <option>3 xona</option>
                    <option>4 xona</option>
                    <option>5+ xona</option>
                  </select>
                </div>
                <div className="field">
                  <label>Hammomlar</label>
                  <select
                    value={baths}
                    onChange={(e) => setBaths(e.target.value)}
                  >
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                  </select>
                </div>
              </div>
              <div className="frow">
                <div className="field">
                  <label>Maydon (m²)</label>
                  <input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>Qavat / Jami</label>
                  <input
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="fsection">
              <h2 className="display">
                <span className="fnum">3</span> Narx
              </h2>
              <div className="frow">
                <div className="field">
                  <label>Narx (USD)</label>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>To'lov turi</label>
                  <select>
                    <option>Sotuv</option>
                    <option>Oylik ijara</option>
                    <option>Kunlik ijara</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="fsection">
              <h2 className="display">
                <span className="fnum">4</span> Joylashuvi
              </h2>
              <div className="frow">
                <div className="field">
                  <label>Tuman</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  >
                    <option>Chilonzor</option>
                    <option>Yunusobod</option>
                    <option>Mirzo Ulug'bek</option>
                    <option>Sergeli</option>
                  </select>
                </div>
                <div className="field">
                  <label>Mahalla / kvartal</label>
                  <input
                    value={quarter}
                    onChange={(e) => setQuarter(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="fsection">
              <h2 className="display">
                <span className="fnum">5</span> Fotosuratlar
              </h2>
              <div className="drop">
                <i className="ti ti-photo-up"></i>
                <div className="t">Rasmlarni shu yerga torting yoki tanlang</div>
                <div className="s">
                  JPG, PNG · 20 tagacha · har biri 10 MB gacha
                </div>
              </div>
            </div>

            <div className="fsection">
              <h2 className="display">
                <span className="fnum">6</span> Tavsif
              </h2>
              <div className="field full">
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>
          </div>

          <div>
            <div
              className="side"
              style={{
                position: "sticky",
                top: 84,
                padding: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  padding: "14px 16px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i className="ti ti-eye" style={{ fontSize: 15 }}></i>{" "}
                Ko'rinishi (Live Preview)
              </div>
              <div style={{ padding: "12px 12px 0" }}>
                <div
                  style={{
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "1px solid var(--sand)",
                    background: "#fff"
                  }}
                >
                  <div
                    style={{
                      height: 130,
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=70')",
                      backgroundSize: "cover",
                      position: "relative",
                    }}
                  >
                    <span className="badge">YANGI</span>
                  </div>
                  <div style={{ padding: "14px 16px 16px" }}>
                    <div className="price" style={{ fontSize: 20 }}>
                      ${price.replace(/\s/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        margin: "4px 0 2px",
                      }}
                    >
                      {title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      <i className="ti ti-map-pin" style={{ fontSize: 13 }}></i>{" "}
                      {district} {quarter}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <button type="submit" className="btn-pub" disabled={loading}>
                  <i className="ti ti-rocket"></i>{" "}
                  {loading ? "Joylanmoqda..." : "E'lonni joylash"}
                </button>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    textAlign: "center",
                    marginTop: 10,
                  }}
                >
                  Baza bilan jonli bog'lanish va deploy
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
