"use client";
import { useState, useRef } from "react";
import { Nav, CustomSelect } from "@/components/ui";
import { createListingAction } from "@/app/actions";

const cats = [
  { key: "Yangi uy", icon: "ti-building-skyscraper" },
  { key: "Ikkilamchi", icon: "ti-home" },
  { key: "Ijara", icon: "ti-key" },
  { key: "Ofis", icon: "ti-briefcase" },
];

const districts = [
  "Chilonzor",
  "Yunusobod",
  "Mirzo Ulug'bek",
  "Sergeli",
  "Yakkasaroy",
  "Shayxontohur",
  "Olmazor",
  "Uchtepa",
  "Mirabad",
  "Bektemir",
  "Yashnobod",
];

export default function Add() {
  const [cat, setCat] = useState("");
  const [title, setTitle] = useState("");
  const [rooms, setRooms] = useState("1 xona");
  const [baths, setBaths] = useState("1");
  const [area, setArea] = useState("");
  const [floor, setFloor] = useState("");
  const [price, setPrice] = useState("");
  const [paymentType, setPaymentType] = useState("Sotuv");
  const [hasMortgage, setHasMortgage] = useState(false);
  const [district, setDistrict] = useState("");
  const [quarter, setQuarter] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Progress bo'limlari to'ldirilganligini hisoblash
  const sectionsFilled = [
    !!cat,                              // 1. Toifa
    !!(title && area && floor),         // 2. Asosiy ma'lumotlar
    !!price,                            // 3. Narx
    !!(district),                       // 4. Joylashuvi
    selectedFiles.length > 0,           // 5. Fotosuratlar
    desc.length > 0,                    // 6. Tavsif
  ];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files].slice(0, 20));
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let base64Photo = "";
    if (selectedFiles.length > 0) {
      try {
        base64Photo = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(selectedFiles[0]);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });
      } catch (err) {
        console.error("FileReader error:", err);
      }
    }

    const formData = new FormData();
    formData.append("cat", cat);
    formData.append("title", title);
    formData.append("rooms", rooms.split(" ")[0]);
    formData.append("baths", baths);
    formData.append("area", area);
    formData.append("floor", floor);
    formData.append("price", price);
    formData.append("paymentType", paymentType);
    formData.append("has_mortgage", hasMortgage.toString());
    formData.append("district", district);
    formData.append("quarter", quarter);
    formData.append("desc", desc);
    if (base64Photo) {
      formData.append("photo", base64Photo);
    }

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
        <h1 className="page-title display">E&apos;lon qo&apos;shish</h1>
        <div className="page-sub">
          Uyingizni soting yoki ijaraga bering — bepul va tez
        </div>

        {/* Progress indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 10px", justifyContent: "center" }}>
          {sectionsFilled.map((filled, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: filled ? "var(--orange)" : "#eee",
                color: filled ? "#fff" : "var(--muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                transition: "all 0.2s ease"
              }}>
                {filled ? <i className="ti ti-check" style={{ fontSize: 14 }}></i> : i + 1}
              </div>
              {i < 5 && (
                <div style={{ width: 24, height: 2, background: filled && sectionsFilled[i + 1] ? "var(--orange)" : "#eee", borderRadius: 1 }} />
              )}
            </div>
          ))}
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
                <span className="fnum">2</span> Asosiy ma&apos;lumotlar
              </h2>
              <div className="frow">
                <div className="field full">
                  <label>Sarlavha (Kvartira turi)</label>
                  <input
                    placeholder="Masalan: 3 xonali kvartira"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="frow">
                <div className="field">
                  <label>Xonalar soni</label>
                  <CustomSelect
                    value={rooms}
                    onChange={setRooms}
                    options={["1 xona", "2 xona", "3 xona", "4 xona", "5+ xona"]}
                    placeholder="Xonalar soni"
                  />
                </div>
                <div className="field">
                  <label>Hammomlar</label>
                  <CustomSelect
                    value={baths}
                    onChange={setBaths}
                    options={["1", "2", "3"]}
                    placeholder="Hammomlar"
                  />
                </div>
              </div>
              <div className="frow">
                <div className="field">
                  <label>Maydon (m²)</label>
                  <input
                    placeholder="78"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>Qavat / Jami</label>
                  <input
                    placeholder="5/9"
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
                    placeholder="72 000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>To&apos;lov turi</label>
                  <CustomSelect
                    value={paymentType}
                    onChange={setPaymentType}
                    options={["Sotuv", "Oylik ijara", "Kunlik ijara"]}
                    placeholder="To'lov turi"
                  />
                </div>
              </div>
              {paymentType === "Sotuv" && (
                <div className="frow" style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, fontWeight: 500, userSelect: "none" }}>
                      <input
                        type="checkbox"
                        checked={hasMortgage}
                        onChange={(e) => setHasMortgage(e.target.checked)}
                        style={{
                          width: 18,
                          height: 18,
                          accentColor: "var(--orange)",
                          cursor: "pointer"
                        }}
                      />
                      <span>Ipoteka olish imkoniyati mavjud</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="fsection">
              <h2 className="display">
                <span className="fnum">4</span> Joylashuvi
              </h2>
              <div className="frow">
                <div className="field">
                  <label>Tuman</label>
                  <CustomSelect
                    value={district}
                    onChange={setDistrict}
                    options={[
                      { value: "", label: "Tanlang..." },
                      ...districts.map(d => ({ value: d, label: d }))
                    ]}
                    placeholder="Tanlang..."
                  />
                </div>
                <div className="field">
                  <label>Mahalla / kvartal</label>
                  <input
                    placeholder="9-kvartal"
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <div
                className="drop"
                style={{ cursor: "pointer" }}
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="ti ti-photo-up"></i>
                <div className="t">Rasmlarni shu yerga torting yoki tanlang</div>
                <div className="s">
                  JPG, PNG · 20 tagacha · har biri 10 MB gacha
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selectedFiles.map((file, i) => (
                    <div key={i} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "var(--orange-tint)",
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      <i className="ti ti-photo" style={{ fontSize: 14, color: "var(--orange)" }}></i>
                      <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                      <i
                        className="ti ti-x"
                        style={{ fontSize: 14, cursor: "pointer", color: "var(--muted)" }}
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      ></i>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="fsection">
              <h2 className="display">
                <span className="fnum">6</span> Tavsif
              </h2>
              <div className="field full">
                <textarea
                  placeholder="E'lon haqida batafsil yozing..."
                  value={desc}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) setDesc(e.target.value);
                  }}
                  required
                ></textarea>
                <div style={{
                  textAlign: "right",
                  fontSize: 12,
                  color: desc.length >= 900 ? "#d9534f" : "var(--muted)",
                  marginTop: 4,
                  fontWeight: desc.length >= 900 ? 600 : 400
                }}>
                  {desc.length}/1000
                </div>
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
                Ko&apos;rinishi (Live Preview)
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
                        selectedFiles.length > 0
                          ? `url('${URL.createObjectURL(selectedFiles[0])}')`
                          : "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=70')",
                      backgroundSize: "cover",
                      position: "relative",
                    }}
                  >
                    <span className="badge">YANGI</span>
                  </div>
                  <div style={{ padding: "14px 16px 16px" }}>
                    <div className="price" style={{ fontSize: 20 }}>
                      ${price ? price.replace(/\s/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "0"}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        margin: "4px 0 2px",
                      }}
                    >
                      {title || "Sarlavha"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      <i className="ti ti-map-pin" style={{ fontSize: 13 }}></i>{" "}
                      {district || "Tuman"} {quarter}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <button type="submit" className="btn-pub" disabled={loading}>
                  <i className="ti ti-rocket"></i>{" "}
                  {loading ? "Joylanmoqda..." : "E'lonni joylash"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
