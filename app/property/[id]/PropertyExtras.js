"use client";
import { useState, useEffect } from "react";
import { incrementViewAction } from "@/app/actions";
import { trackView } from "@/lib/userPrefs";

const DISTRICT_AVGS = {
  "chilonzor": 850,
  "yunusobod": 900,
  "mirzo ulug'bek": 1050,
  "yakkasaroy": 1100,
  "shayxontohur": 1000,
  "sergeli": 750,
  "uchtepa": 800,
  "bektemir": 650,
  "mirabad": 1200,
  "olmazor": 850,
  "yashnobod": 900
};

const DISTRICT_RENTAL_AVGS = {
  "chilonzor": 8,
  "yunusobod": 9,
  "mirzo ulug'bek": 11,
  "yakkasaroy": 12,
  "shayxontohur": 10,
  "sergeli": 6,
  "uchtepa": 7,
  "bektemir": 5,
  "mirabad": 14,
  "olmazor": 8,
  "yashnobod": 9
};

const DISTRICT_OFFICE_AVGS = {
  "chilonzor": 15,
  "yunusobod": 18,
  "mirzo ulug'bek": 22,
  "yakkasaroy": 25,
  "shayxontohur": 20,
  "sergeli": 12,
  "uchtepa": 14,
  "bektemir": 10,
  "mirabad": 30,
  "olmazor": 15,
  "yashnobod": 18
};

function getDistrictFromAddr(addr) {
  if (!addr) return "mirabad";
  const address = String(addr).toLowerCase();
  for (const district of Object.keys(DISTRICT_AVGS)) {
    if (address.includes(district)) {
      return district;
    }
  }
  return "mirabad";
}

export default function PropertyExtras({ priceNum, listingId, listing = null, hasMortgage = false }) {
  const [downPayment, setDownPayment] = useState(20);
  const [term, setTerm] = useState(25);
  const [rate, setRate] = useState(12);

  // Banklar va ariza yuborish holatlari
  const [activeTab, setActiveTab] = useState("calc"); // "calc" yoki "banks"
  const [selectedBank, setSelectedBank] = useState(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("+998 ");
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // AI Valuation Interaktiv parametr
  const [renovation, setRenovation] = useState("yevro"); // none, average, yevro, premium

  // View counter + tracking
  useEffect(() => {
    incrementViewAction(listingId);
    if (listing) trackView(listing);
  }, [listingId, listing]);

  // Ipoteka hisoblash
  const loanAmount = priceNum * (1 - downPayment / 100);
  const monthlyRate = rate / 100 / 12;
  const totalMonths = term * 12;
  const monthly = monthlyRate > 0 && totalMonths > 0
    ? Math.round((loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalMonths)))
    : Math.round(loanAmount / totalMonths);

  // AI Valuation hisoblash
  const cat = listing?.cat || "Ikkilamchi";
  const area = listing?.area || 50;
  const district = getDistrictFromAddr(listing?.addr);
  const rooms = listing?.rooms || 2;
  
  let baseM2Rate = DISTRICT_AVGS[district] || 900;
  if (cat === "Yangi uylar" || cat === "Yangi uy") {
    baseM2Rate *= 1.15;
  } else if (cat === "Ijara") {
    baseM2Rate = DISTRICT_RENTAL_AVGS[district] || 9;
  } else if (cat === "Ofis") {
    if (priceNum < 8000) {
      baseM2Rate = DISTRICT_OFFICE_AVGS[district] || 18;
    } else {
      baseM2Rate = (DISTRICT_AVGS[district] || 900) * 1.1;
    }
  }
  
  if (rooms === 1) baseM2Rate *= 1.05;
  if (rooms >= 4) baseM2Rate *= 0.95;

  let renovationMultiplier = 1.0;
  if (renovation === "none") renovationMultiplier = 0.85;
  if (renovation === "average") renovationMultiplier = 1.0;
  if (renovation === "yevro") renovationMultiplier = 1.15;
  if (renovation === "premium") renovationMultiplier = 1.35;

  const fairPrice = Math.round(baseM2Rate * area * renovationMultiplier);
  const diffPercent = Math.round(((priceNum - fairPrice) / fairPrice) * 100);

  // Gauge bar pozitsiyasi (-30% va +30% oralig'ida)
  const pinPos = Math.min(100, Math.max(0, ((diffPercent + 30) / 60) * 100));

  let valStatusLabel = "Bozor narxida";
  let valColor = "var(--orange, #eab308)";
  let valBg = "rgba(234, 179, 8, 0.1)";
  
  if (diffPercent <= -5) {
    valStatusLabel = `Bozordan ${Math.abs(diffPercent)}% arzon`;
    valColor = "var(--green, #1D9E75)";
    valBg = "var(--green-tint, rgba(29, 158, 117, 0.15))";
  } else if (diffPercent >= 5) {
    valStatusLabel = `Bozordan ${Math.abs(diffPercent)}% qimmat`;
    valColor = "#ef4444";
    valBg = "rgba(239, 68, 68, 0.1)";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 1. AI Bozor narxini baholash shkalasi */}
      {listing && (
        <div className="mort" style={{ position: "relative", padding: 18 }}>
          <div style={{
            fontSize: 13,
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 12
          }}>
            <i className="ti ti-cpu" style={{ fontSize: 16, color: "var(--orange)" }}></i>
            <span>AI Valuation — Narx tahlili</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                ${fairPrice.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                Tavsiya etilgan bozor bahosi
              </div>
            </div>
            <div style={{
              background: valBg,
              color: valColor,
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700
            }}>
              {valStatusLabel}
            </div>
          </div>

          {/* Vizual Gauge Bar */}
          <div style={{ margin: "20px 0 10px 0", position: "relative" }}>
            {/* Pointer (Pin) */}
            <div style={{
              position: "absolute",
              left: `${pinPos}%`,
              top: -10,
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 2,
              transition: "left 0.3s ease"
            }}>
              <div style={{
                background: "var(--ink, #1a130e)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
                marginBottom: 2,
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                whiteSpace: "nowrap"
              }}>
                {diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`}
              </div>
              <div style={{
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "6px solid var(--ink, #1a130e)"
              }}></div>
            </div>

            {/* Rangli shkala bar */}
            <div style={{
              height: 8,
              borderRadius: 4,
              background: "linear-gradient(to right, #1d9e75 0%, #1d9e75 35%, #eab308 50%, #ef4444 65%, #ef4444 100%)",
              width: "100%"
            }}></div>

            {/* Skala belgilari */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
              <span>Arzon (-30%)</span>
              <span style={{ fontWeight: 600 }}>O&apos;rtacha</span>
              <span>Qimmat (+30%)</span>
            </div>
          </div>

          {/* Interaktiv: Ta'mirlanish holatini tanlash */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed var(--sand)" }}>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8, fontWeight: 600 }}>
              Ta&apos;mir darajasi (AI baholashni moslash):
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {[
                { key: "none", label: "Ta'mirsiz", short: "Yo'q" },
                { key: "average", label: "O'rtacha", short: "O'rtacha" },
                { key: "yevro", label: "Yevro", short: "Yevro" },
                { key: "premium", label: "Premium", short: "Luks" }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setRenovation(item.key)}
                  style={{
                    background: renovation === item.key ? "var(--orange)" : "var(--cream, #fbf7f3)",
                    color: renovation === item.key ? "#fff" : "var(--ink)",
                    border: renovation === item.key ? "1px solid var(--orange)" : "1px solid var(--sand)",
                    borderRadius: 8,
                    padding: "6px 2px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  title={item.label}
                >
                  {item.short}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Ipoteka kalkulyatori */}
      <div className="mort" style={{ position: "relative" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--sand)", marginBottom: 16 }}>
          <button
            onClick={() => setActiveTab("calc")}
            disabled={!hasMortgage}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "none",
              border: "none",
              borderBottom: activeTab === "calc" && hasMortgage ? "2px solid var(--orange)" : "none",
              color: activeTab === "calc" && hasMortgage ? "var(--orange)" : "var(--muted)",
              fontWeight: 700,
              cursor: hasMortgage ? "pointer" : "not-allowed",
              fontSize: 13,
              opacity: hasMortgage ? 1 : 0.5
            }}
          >
            <i className="ti ti-calculator" style={{ marginRight: 6 }}></i> Kalkulyator
          </button>
          <button
            onClick={() => setActiveTab("banks")}
            disabled={!hasMortgage}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "none",
              border: "none",
              borderBottom: activeTab === "banks" && hasMortgage ? "2px solid var(--orange)" : "none",
              color: activeTab === "banks" && hasMortgage ? "var(--orange)" : "var(--muted)",
              fontWeight: 700,
              cursor: hasMortgage ? "pointer" : "not-allowed",
              fontSize: 13,
              opacity: hasMortgage ? 1 : 0.5
            }}
          >
            <i className="ti ti-briefcase" style={{ marginRight: 6 }}></i> Bank takliflari
          </button>
        </div>

        {hasMortgage ? (
          activeTab === "calc" ? (
            <div className="mv" style={{ marginBottom: 12 }}>
              ≈ ${monthly.toLocaleString()}{" "}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: "var(--muted)",
                }}
              >
                /oy
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {[
                { name: "SQB", rate: 17, logo: "🏛️" },
                { name: "Ipoteka Bank", rate: 16.5, logo: "🏦" },
                { name: "Hamkorbank", rate: 18, logo: "🏢" },
                { name: "Xalq Banki", rate: 17.5, logo: "💰" }
              ].map((bank) => {
                const bankLoanAmount = priceNum * (1 - downPayment / 100);
                const bankMonthlyRate = bank.rate / 100 / 12;
                const bankTotalMonths = term * 12;
                const bankMonthly = bankMonthlyRate > 0 && bankTotalMonths > 0
                  ? Math.round((bankLoanAmount * bankMonthlyRate) / (1 - Math.pow(1 + bankMonthlyRate, -bankTotalMonths)))
                  : Math.round(bankLoanAmount / bankTotalMonths);

                return (
                  <div
                    key={bank.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "var(--cream, #fbf7f3)",
                      border: "1px solid var(--sand)",
                      borderRadius: 12,
                      padding: 10,
                      gap: 8
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{bank.logo}</span>
                        <span style={{ fontWeight: 700, color: "var(--ink)", fontSize: 13 }}>{bank.name}</span>
                        <span style={{
                          background: "var(--orange-tint)",
                          color: "var(--orange-dark)",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: 20
                        }}>
                          {bank.rate}%
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                        Boshlang&apos;ich: {downPayment}% · {term} yil
                      </div>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <div style={{
                        fontWeight: 800,
                        color: "var(--ink)",
                        fontSize: 14,
                        fontFamily: "'Bricolage Grotesque', sans-serif"
                      }}>
                        ${bankMonthly.toLocaleString()}
                        <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted)" }}> /oy</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBank(bank.name);
                          setIsSubmitted(false);
                          setClientName("");
                          setClientPhone("+998 ");
                        }}
                        className="btn-add"
                        style={{
                          padding: "4px 8px",
                          fontSize: 10,
                          marginTop: 4,
                          border: "none",
                          cursor: "pointer"
                        }}
                      >
                        Ariza
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="mv" style={{ color: "#ef4444", fontSize: 20, marginBottom: 12 }}>
            Mavjud emas
          </div>
        )}

        {!hasMortgage && (
          <div style={{
            background: "rgba(239, 68, 68, 0.06)",
            border: "1px solid rgba(239, 68, 68, 0.15)",
            color: "#dc2626",
            padding: "10px 14px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500,
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <i className="ti ti-info-circle" style={{ fontSize: 16, flexShrink: 0 }}></i>
            <span>Bu uyga ipoteka mavjud emas</span>
          </div>
        )}

        {/* Interaktiv sliderlar */}
        <div style={{ marginTop: 12, opacity: hasMortgage ? 1 : 0.4, pointerEvents: hasMortgage ? "auto" : "none" }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
              <span>Boshlang&apos;ich to&apos;lov</span>
              <span style={{ fontWeight: 600 }}>{downPayment}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              disabled={!hasMortgage}
              style={{ width: "100%", accentColor: "var(--orange)" }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
              <span>Muddat</span>
              <span style={{ fontWeight: 600 }}>{term} yil</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
              disabled={!hasMortgage}
              style={{ width: "100%", accentColor: "var(--orange)" }}
            />
          </div>

          {hasMortgage && activeTab === "calc" && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
                <span>Foiz stavkasi</span>
                <span style={{ fontWeight: 600 }}>{rate}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                disabled={!hasMortgage}
                style={{ width: "100%", accentColor: "var(--orange)" }}
              />
            </div>
          )}
        </div>

        {hasMortgage && activeTab === "calc" && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            {downPayment}% boshlang&apos;ich · {term} yil · {rate}%
          </div>
        )}
      </div>

      {/* Simulated Application Modal */}
      {selectedBank && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedBank(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>
                <i className="ti ti-briefcase"></i> Ipoteka arizasi ({selectedBank})
              </h2>
              <button className="modal-close" onClick={() => setSelectedBank(null)} aria-label="Yopish">
                <i className="ti ti-x"></i>
              </button>
            </div>

            {isSubmitted ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <i className="ti ti-circle-check" style={{ fontSize: 64, color: "var(--green, #1d9e75)", display: "block", marginBottom: 16 }}></i>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--ink)" }}>Muvaffaqiyatli yuborildi!</h3>
                <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.5, margin: "0 0 20px" }}>
                  Sizning arizangiz <strong>{selectedBank}</strong>ga qabul qilindi. Tez orada mutaxassislarimiz siz bilan bog&apos;lanishadi.
                </p>
                <button
                  className="btn-add"
                  onClick={() => setSelectedBank(null)}
                  style={{ padding: "10px 24px", border: "none", cursor: "pointer" }}
                >
                  Yopish
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitting(true);
                  setTimeout(() => {
                    setSubmitting(false);
                    setIsSubmitted(true);
                  }, 800);
                }}
                style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}
              >
                <p style={{ fontSize: 13, color: "var(--text2)", margin: 0 }}>
                  Quyidagi ma&apos;lumotlarni to&apos;ldiring. Biz sizning nomingizdan bankka ariza yo&apos;llaymiz.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>F.I.SH.</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ismingiz va familiyangiz"
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--sand)",
                      background: "var(--cream, #fbf7f3)",
                      color: "var(--ink)",
                      fontSize: 14
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>Telefon raqam</label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+998 (90) 123-45-67"
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--sand)",
                      background: "var(--cream, #fbf7f3)",
                      color: "var(--ink)",
                      fontSize: 14
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedBank(null)}
                    className="btn-add"
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      background: "none",
                      border: "1px solid var(--sand)",
                      color: "var(--ink)",
                      cursor: "pointer"
                    }}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="btn-add"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    {submitting ? "Yuborilmoqda..." : "Yuborish"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
