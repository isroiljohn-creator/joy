"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { erpGetClientContract } from "@/app/erp-actions";

export default function ClientPortalPage() {
  const [phone, setPhone] = useState("");
  const [contractId, setContractId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showReceipt, setShowReceipt] = useState(false);
  const [currency, setCurrency] = useState("USD"); // "USD" or "UZS"

  const [currentTime, setCurrentTime] = useState("");

  // Update time for mock live feeds
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pre-fill query parameters if any (for quick preview from admin panel)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qPhone = params.get("phone");
      const qContract = params.get("contract");
      if (qPhone && qContract) {
        setPhone(qPhone);
        setContractId(qContract);
        handleLoginDirect(qPhone, qContract);
      }
    }
  }, []);

  const handleLoginDirect = async (directPhone, directContract) => {
    setLoading(true);
    setError("");
    try {
      const res = await erpGetClientContract(directPhone, directContract);
      if (res.error) {
        setError(res.error);
        setContract(null);
      } else {
        setContract(res.contract);
      }
    } catch (err) {
      console.error(err);
      setError("Tarmoqda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !contractId.trim()) {
      setError("Telefon raqami va shartnoma raqamini kiriting!");
      return;
    }
    await handleLoginDirect(phone, contractId);
  };

  const handleLogout = () => {
    setContract(null);
    setPhone("");
    setContractId("");
    setError("");
    if (typeof window !== "undefined") {
      const newUrl = window.location.pathname;
      window.history.pushState({}, "", newUrl);
    }
  };

  const formatPrice = (valueInUSD) => {
    if (valueInUSD === null || valueInUSD === undefined || valueInUSD === "") return "—";
    const val = parseInt(valueInUSD);
    if (isNaN(val)) return "—";
    if (currency === "UZS") {
      return `${(val * 12000).toLocaleString()} UZS`;
    }
    return `$${val.toLocaleString()}`;
  };

  // Dynamic installment schedule calculations
  const getInstallmentSchedule = () => {
    if (!contract || contract.payment_plan !== "installments") return [];
    
    const soldAt = new Date(contract.sold_at);
    const totalAmount = parseInt(contract.sold_price);
    const initPayment = parseInt(contract.initial_payment);
    const paidAmount = parseInt(contract.paid_amount);
    
    const remainingToInstall = totalAmount - initPayment;
    const monthlyInstallment = Math.round(remainingToInstall / 12);
    
    const schedule = [];
    const now = new Date();
    
    for (let i = 1; i <= 12; i++) {
      const dueDate = new Date(soldAt.getFullYear(), soldAt.getMonth() + i, soldAt.getDate());
      const neededCumulative = initPayment + i * monthlyInstallment;
      
      let status = "pending"; // 'paid', 'partial', 'pending', 'overdue'
      let paidForThis = 0;
      
      if (paidAmount >= neededCumulative) {
        status = "paid";
        paidForThis = monthlyInstallment;
      } else if (paidAmount > neededCumulative - monthlyInstallment) {
        status = "partial";
        paidForThis = paidAmount - (neededCumulative - monthlyInstallment);
      } else {
        if (dueDate < now) {
          status = "overdue";
        } else {
          status = "pending";
        }
        paidForThis = 0;
      }
      
      schedule.push({
        num: i,
        dueDate: dueDate.toLocaleDateString("uz-UZ"),
        amount: monthlyInstallment,
        paidForThis,
        status
      });
    }
    
    return schedule;
  };

  const installmentSchedule = getInstallmentSchedule();
  
  // Stats
  const paidPercent = contract ? Math.min(100, Math.round((parseInt(contract.paid_amount) / parseInt(contract.sold_price)) * 100)) : 0;
  const debtAmount = contract ? parseInt(contract.sold_price) - parseInt(contract.paid_amount) : 0;

  return (
    <div className="client-portal-bg" style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 10% 20%, #1c1510 0%, #0a0705 90%)",
      color: "#eae5df",
      fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
      padding: "20px 10px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: contract ? "flex-start" : "center"
    }}>
      
      {/* Header bar */}
      <div className="no-print" style={{
        width: "100%",
        maxWidth: 1000,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
        borderBottom: "1px solid rgba(224, 213, 201, 0.1)",
        paddingBottom: 15
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            background: "linear-gradient(135deg, #E06334 0%, #B2451E 100%)",
            width: 32,
            height: 32,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 18,
            color: "#fff",
            boxShadow: "0 4px 10px rgba(224, 99, 52, 0.3)"
          }}>
            M
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.5, color: "#fff" }}>MASKON</span>
        </div>
        
        {contract ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Currency toggler */}
            <button 
              onClick={() => setCurrency(prev => prev === "USD" ? "UZS" : "USD")}
              style={{
                background: "rgba(224, 213, 201, 0.05)",
                border: "1px solid rgba(224, 213, 201, 0.15)",
                color: "#eae5df",
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Valyuta: {currency}
            </button>
            
            <button 
              onClick={handleLogout}
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#ef4444",
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Chiqish
            </button>
          </div>
        ) : (
          <Link 
            href="/login"
            style={{
              color: "rgba(224, 213, 201, 0.7)",
              fontSize: 13,
              textDecoration: "none",
              fontWeight: 500
            }}
          >
            Sotuvchilar kabineti →
          </Link>
        )}
      </div>

      {/* LOGIN CARD */}
      {!contract && (
        <div style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(35, 27, 21, 0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(224, 213, 201, 0.1)",
          borderRadius: 24,
          padding: 30,
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          animation: "slideUp 0.3s ease"
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px 0", color: "#fff", textAlign: "center" }}>
            Mijoz Shaxsiy Kabineti
          </h2>
          <p style={{ fontSize: 13, color: "rgba(224, 213, 201, 0.6)", margin: "0 0 24px 0", textAlign: "center", lineHeight: "1.4" }}>
            Shartnomangiz, to'lovlar holati va qurilish progressini onlayn kuzatish uchun tizimga kiring.
          </p>
          
          {error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#ef4444",
              borderRadius: 12,
              padding: 12,
              fontSize: 12,
              lineHeight: "1.4",
              marginBottom: 20
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(224, 213, 201, 0.7)", marginBottom: 6 }}>
                Telefon raqamingiz
              </label>
              <input
                type="text"
                placeholder="Masalan: +998 90 777 77 77"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(10, 7, 5, 0.5)",
                  border: "1px solid rgba(224, 213, 201, 0.2)",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 14,
                  outline: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(224, 213, 201, 0.7)", marginBottom: 6 }}>
                Shartnoma ID yoki Xonadon raqami
              </label>
              <input
                type="text"
                placeholder="Masalan: 102 yoki 2"
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(10, 7, 5, 0.5)",
                  border: "1px solid rgba(224, 213, 201, 0.2)",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 14,
                  outline: "none"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: 14,
                background: "linear-gradient(135deg, #E06334 0%, #B2451E 100%)",
                border: "none",
                borderRadius: 14,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(224, 99, 52, 0.2)",
                transition: "all 0.2s ease"
              }}
            >
              {loading ? "Tizimga kirilmoqda..." : "Shaxsiy kabinetga kirish"}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "rgba(224, 213, 201, 0.4)" }}>
            Eslatma: Telefon raqamingiz shartnoma imzolashda ko'rsatilgan raqam bilan bir xil bo'lishi lozim. Muammolar bo'yicha sotuvchingizga murojaat qiling.
          </div>
        </div>
      )}

      {/* CLIENT DASHBOARD */}
      {contract && (
        <div style={{
          width: "100%",
          maxWidth: 1000,
          animation: "fadeIn 0.3s ease"
        }}>
          
          {/* Welcome Banner */}
          <div className="no-print" style={{
            background: "linear-gradient(135deg, rgba(35, 27, 21, 0.7) 0%, rgba(20, 15, 12, 0.7) 100%)",
            border: "1px solid rgba(224, 213, 201, 0.1)",
            borderRadius: 24,
            padding: 24,
            marginBottom: 20,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 15
          }}>
            <div>
              <span style={{ fontSize: 12, color: "#E06334", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                Shartnoma faol
              </span>
              <h2 style={{ margin: "4px 0 2px 0", fontSize: 20, fontWeight: 800, color: "#fff" }}>
                Xush kelibsiz, {contract.lead_name}!
              </h2>
              <span style={{ fontSize: 13, color: "rgba(224, 213, 201, 0.6)" }}>
                Shartnoma raqami: № {contract.id * 12 + 1045}-SH (Tuzilgan sana: {new Date(contract.sold_at).toLocaleDateString("uz-UZ")})
              </span>
            </div>
            
            <div style={{ display: "flex", gap: 8 }}>
              {["overview", "schedule", "progress"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: activeTab === tab ? "#E06334" : "rgba(224, 213, 201, 0.05)",
                    border: "none",
                    color: activeTab === tab ? "#fff" : "#eae5df",
                    padding: "8px 16px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {tab === "overview" && "Shartnoma"}
                  {tab === "schedule" && "To'lovlar grafigi"}
                  {tab === "progress" && "Qurilish progressi"}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className={!showReceipt ? "printable-area" : "no-print"}>
              
              {/* Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flexWrap: "wrap", marginBottom: 24 }} className="no-print">
                {/* Unit Specifications Card */}
                <div style={{
                  background: "rgba(35, 27, 21, 0.5)",
                  border: "1px solid rgba(224, 213, 201, 0.1)",
                  borderRadius: 24,
                  padding: 24
                }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#fff", borderBottom: "1px solid rgba(224, 213, 201, 0.1)", paddingBottom: 10 }}>
                    🏢 Olingan Xonadon Tafsilotlari
                  </h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 11, color: "rgba(224, 213, 201, 0.5)" }}>Loyiha nomi</span>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginTop: 2 }}>{contract.project_name}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "rgba(224, 213, 201, 0.5)" }}>Xonadon raqami</span>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginTop: 2 }}>{contract.unit_number}-xonadon</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "rgba(224, 213, 201, 0.5)" }}>Qavat</span>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginTop: 2 }}>{contract.floor}-qavat</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "rgba(224, 213, 201, 0.5)" }}>Xonalar soni</span>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginTop: 2 }}>{contract.rooms} xonali</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "rgba(224, 213, 201, 0.5)" }}>Umumiy maydoni</span>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginTop: 2 }}>{contract.area} m²</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "rgba(224, 213, 201, 0.5)" }}>Loyiha manzili</span>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginTop: 2 }}>{contract.project_location}</div>
                    </div>
                  </div>
                </div>

                {/* Finance Overview Card */}
                <div style={{
                  background: "rgba(35, 27, 21, 0.5)",
                  border: "1px solid rgba(224, 213, 201, 0.1)",
                  borderRadius: 24,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}>
                  <div>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#fff", borderBottom: "1px solid rgba(224, 213, 201, 0.1)", paddingBottom: 10 }}>
                      💰 To'lov Progressi va Balans
                    </h3>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                      <div>
                        <span style={{ fontSize: 11, color: "rgba(224, 213, 201, 0.5)" }}>Shartnoma qiymati</span>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 2 }}>{formatPrice(contract.sold_price)}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: "rgba(224, 213, 201, 0.5)" }}>To'lov turi</span>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#E06334", marginTop: 2 }}>
                          {contract.payment_plan === 'cash' ? 'Naqd (100%)' : contract.payment_plan === 'installments' ? "Nasiya (Bo'lib to'lash)" : 'Ipoteka krediti'}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: "rgba(224, 213, 201, 0.5)" }}>To'langan summa</span>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#22c55e", marginTop: 2 }}>{formatPrice(contract.paid_amount)}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: "rgba(224, 213, 201, 0.5)" }}>Qolgan qarz</span>
                        <div style={{ fontSize: 14, fontWeight: 600, color: debtAmount > 0 ? "#ef4444" : "#22c55e", marginTop: 2 }}>{formatPrice(debtAmount)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 12 }}>
                      <span style={{ color: "rgba(224, 213, 201, 0.6)" }}>Shartnoma yopilishi:</span>
                      <span style={{ fontWeight: 700, color: "#22c55e" }}>{paidPercent}% to'landi</span>
                    </div>
                    <div style={{ background: "rgba(224, 213, 201, 0.1)", height: 10, borderRadius: 5, overflow: "hidden" }}>
                      <div style={{ 
                        background: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)", 
                        height: "100%", 
                        width: `${paidPercent}%`,
                        borderRadius: 5,
                        boxShadow: "0 0 8px rgba(34, 197, 94, 0.4)"
                      }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar for printing */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }} className="no-print">
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>📄 Rasmiy Shartnoma Hujjati</h3>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => setShowReceipt(true)}
                    style={{
                      background: "rgba(34, 197, 94, 0.15)",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      color: "#22c55e",
                      padding: "8px 16px",
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <i className="ti ti-receipt"></i>
                    To'lov Kvitansiyasi (PDF)
                  </button>
                  <button
                    onClick={() => window.print()}
                    style={{
                      background: "linear-gradient(135deg, #E06334 0%, #B2451E 100%)",
                      border: "none",
                      color: "#fff",
                      padding: "8px 16px",
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 4px 10px rgba(224, 99, 52, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <i className="ti ti-printer"></i>
                    Shartnomani Chop Etish / PDF
                  </button>
                </div>
              </div>

              {/* Printable Official Contract Form */}
              <div style={{
                background: "rgba(35, 27, 21, 0.4)",
                border: "1px dashed rgba(224, 213, 201, 0.2)",
                borderRadius: 24,
                padding: 32,
                color: "#eae5df",
                lineHeight: "1.6",
                fontSize: 13,
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
              }} className="printable-contract-content">
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, textTransform: "uppercase", color: "#fff" }}>Xonadon Sotib Olish Shartnomasi</h2>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: "#E06334" }}>№ {contract.id * 12 + 1045}-SH</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, fontSize: 12, opacity: 0.8 }}>
                    <span>Toshkent shahri</span>
                    <span>«{new Date(contract.sold_at).toLocaleDateString("uz-UZ")}» yil</span>
                  </div>
                </div>

                <p>
                  Bir tomondan, <strong>«MASKON-QURILISH» MCHJ</strong> (quruvchi korxona), keyingi o'rinlarda <strong>«Sotuvchi»</strong> deb yuritiladi, va ikkinchi tomondan, fuqaro <strong>{contract.lead_name}</strong> (tel: {contract.lead_phone}), keyingi o'rinlarda <strong>«Xaridor»</strong> deb yuritiladi, quyidagi shartnoma bo'yicha kelishdilar:
                </p>

                <h4 style={{ fontSize: 13, fontWeight: 700, margin: "16px 0 6px 0", color: "#fff" }}>1. SHARTNOMA MAQSADI</h4>
                <p>
                  1.1. Sotuvchi shartnoma shartlariga muvofiq o'zining qurilish loyihasi bo'lgan <strong>{contract.project_name}</strong> turar-joy majmuasidan quyidagi xonadonni Xaridorga rasmiylashtirish majburiyatini oladi, Xaridor esa to'lovni o'z vaqtida amalga oshirish majburiyatini oladi.
                </p>

                <div style={{ border: "1.5px solid rgba(224, 213, 201, 0.2)", padding: 12, borderRadius: 12, margin: "14px 0", background: "rgba(10, 7, 5, 0.2)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                    <div>🏢 Loyiha: <strong>{contract.project_name}</strong></div>
                    <div>🚪 Xonadon raqami: <strong>{contract.unit_number}</strong></div>
                    <div>🪜 Qavat: <strong>{contract.floor}-qavat</strong></div>
                    <div>📐 Maydoni: <strong>{contract.area} m²</strong></div>
                    <div>🚪 Xonalar soni: <strong>{contract.rooms} xona</strong></div>
                    <div>📍 Manzili: <strong>{contract.project_location}</strong></div>
                  </div>
                </div>

                <h4 style={{ fontSize: 13, fontWeight: 700, margin: "16px 0 6px 0", color: "#fff" }}>2. NARX VA TO'LOV SHARTLARI</h4>
                <p>
                  2.1. Xonadonning umumiy sotilgan kelishilgan bahosi <strong>{formatPrice(contract.sold_price)}</strong> etib belgilandi.
                </p>
                <p>
                  2.2. To'lov turi: <strong>{contract.payment_plan === 'cash' ? 'Naqd (100% to\'lov)' : contract.payment_plan === 'installments' ? 'Nasiya / Bo\'lib to\'lash' : 'Ipoteka krediti'}</strong>.
                </p>
                <p>
                  2.3. Boshlang'ich to'lov miqdori: <strong>{formatPrice(contract.initial_payment)}</strong>. Hozirgacha to'langan jami summa: <strong>{formatPrice(contract.paid_amount)}</strong>.
                </p>
                {contract.payment_plan === 'installments' && (
                  <p>
                    2.4. Qolgan summa <strong>{formatPrice(parseInt(contract.sold_price) - parseInt(contract.paid_amount))}</strong> shartnoma ilovasidagi bo'lib to'lash grafigi asosida amalga oshiriladi.
                  </p>
                )}

                <h4 style={{ fontSize: 13, fontWeight: 700, margin: "16px 0 6px 0", color: "#fff" }}>3. TOMONLARNING IMZOLARI</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginTop: 24, borderTop: "1px dashed rgba(224, 213, 201, 0.2)", paddingTop: 16, fontSize: 12 }}>
                  <div>
                    <strong>SOTUVCHI:</strong>
                    <div style={{ marginTop: 8 }}>«MASKON-QURILISH» MCHJ</div>
                    <div>Manzil: Toshkent sh., Yunusobod 12-uy</div>
                    <div style={{ marginTop: 30 }}>Imzo: _____________________</div>
                    <div style={{ fontSize: 10, opacity: 0.6 }}>(M.O'.)</div>
                  </div>
                  <div>
                    <strong>XARIDOR:</strong>
                    <div style={{ marginTop: 8 }}>Ismi: {contract.lead_name}</div>
                    <div>Tel: {contract.lead_phone}</div>
                    <div style={{ marginTop: 30 }}>Imzo: _____________________</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: INSTALLMENT SCHEDULE */}
          {activeTab === "schedule" && (
            <div style={{
              background: "rgba(35, 27, 21, 0.5)",
              border: "1px solid rgba(224, 213, 201, 0.1)",
              borderRadius: 24,
              padding: 24
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid rgba(224, 213, 201, 0.1)", paddingBottom: 10 }} className="no-print">
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>
                  {contract.payment_plan === "installments" ? "📅 Bo'lib to'lash (12 oylik) shartnoma grafigi" : "📅 To'lov grafigi"}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "rgba(224, 213, 201, 0.6)" }}>
                    Boshlang'ich to'lov: <strong>{formatPrice(contract.initial_payment)}</strong>
                  </span>
                  <button
                    onClick={() => setShowReceipt(true)}
                    style={{
                      background: "rgba(34, 197, 94, 0.15)",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      color: "#22c55e",
                      padding: "6px 12px",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <i className="ti ti-receipt"></i>
                    To'lov Kvitansiyasi (PDF)
                  </button>
                </div>
              </div>

              {contract.payment_plan !== "installments" ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(224, 213, 201, 0.5)", fontStyle: "italic" }}>
                  Ushbu shartnoma 100% to'lov (Naqd) asosida tuzilgan. Oylik to'lov grafiklari mavjud emas.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(224, 213, 201, 0.15)" }}>
                        <th style={{ padding: "12px 8px", color: "rgba(224, 213, 201, 0.5)", fontWeight: 500 }}>To'lov #</th>
                        <th style={{ padding: "12px 8px", color: "rgba(224, 213, 201, 0.5)", fontWeight: 500 }}>Oxirgi muddati</th>
                        <th style={{ padding: "12px 8px", color: "rgba(224, 213, 201, 0.5)", fontWeight: 500 }}>Kutilayotgan summa</th>
                        <th style={{ padding: "12px 8px", color: "rgba(224, 213, 201, 0.5)", fontWeight: 500 }}>Kiritilgan to'lov</th>
                        <th style={{ padding: "12px 8px", color: "rgba(224, 213, 201, 0.5)", fontWeight: 500 }}>Holati</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installmentSchedule.map(row => (
                        <tr key={row.num} style={{ 
                          borderBottom: "1px solid rgba(224, 213, 201, 0.05)",
                          background: row.status === 'overdue' ? "rgba(239, 68, 68, 0.03)" : "none"
                        }}>
                          <td style={{ padding: "14px 8px", fontWeight: 700 }}>{row.num}-to'lov</td>
                          <td style={{ padding: "14px 8px" }}>{row.dueDate}</td>
                          <td style={{ padding: "14px 8px", fontWeight: 600 }}>{formatPrice(row.amount)}</td>
                          <td style={{ padding: "14px 8px", color: "#22c55e" }}>{formatPrice(row.paidForThis)}</td>
                          <td style={{ padding: "14px 8px" }}>
                            <span style={{
                              padding: "4px 10px",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              background: 
                                row.status === 'paid' ? "rgba(34, 197, 94, 0.1)" :
                                row.status === 'partial' ? "rgba(245, 158, 11, 0.1)" :
                                row.status === 'overdue' ? "rgba(239, 68, 68, 0.1)" : "rgba(224, 213, 201, 0.05)",
                              color: 
                                row.status === 'paid' ? "#22c55e" :
                                row.status === 'partial' ? "#f59e0b" :
                                row.status === 'overdue' ? "#ef4444" : "rgba(224, 213, 201, 0.5)"
                            }}>
                              {row.status === 'paid' && "To'langan"}
                              {row.status === 'partial' && "Qisman to'langan"}
                              {row.status === 'overdue' && "Muddati o'tgan"}
                              {row.status === 'pending' && "Kutilmoqda"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONSTRUCTION PROGRESS */}
          {activeTab === "progress" && (
            <div>
              {/* Construction progress overview grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                marginBottom: 24
              }}>
                {[
                  { name: "Kotlovan ishlari", percent: contract.progress_kotlovan || 0, icon: "🚜" },
                  { name: "G'isht quyish ishlari", percent: contract.progress_brick || 0, icon: "🧱" },
                  { name: "Fasad ishlari", percent: contract.progress_facade || 0, icon: "🏢" },
                  { name: "Ichki pardozlash", percent: contract.progress_interior || 0, icon: "🎨" }
                ].map((s, idx) => (
                  <div key={idx} style={{
                    background: "rgba(35, 27, 21, 0.5)",
                    border: "1px solid rgba(224, 213, 201, 0.1)",
                    borderRadius: 20,
                    padding: 20,
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{s.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#E06334", marginBottom: 12 }}>{s.percent}%</div>
                    
                    {/* Progress track */}
                    <div style={{ background: "rgba(224, 213, 201, 0.1)", height: 6, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ 
                        background: "linear-gradient(90deg, #E06334 0%, #B2451E 100%)", 
                        height: "100%", 
                        width: `${s.percent}%`,
                        borderRadius: 3 
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* LIVE CAMERA FEEDS SIMULATOR */}
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
                📹 Jonli Qurilish Kameralari (Live Feeds)
              </h3>
              
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
                flexWrap: "wrap"
              }}>
                {[
                  { id: 1, name: "Kamera #01 — Loyiha Umumiy Ko'rinishi", stage: "Tashqi Fasad", quality: "1080p HD" },
                  { id: 2, name: "Kamera #02 — Xonadonlar Ichki Qismi", stage: "Ichki Qavatlar", quality: "1080p HD" }
                ].map(cam => (
                  <div key={cam.id} style={{
                    background: "rgba(35, 27, 21, 0.5)",
                    border: "1px solid rgba(224, 213, 201, 0.1)",
                    borderRadius: 24,
                    padding: 16,
                    position: "relative",
                    overflow: "hidden"
                  }}>
                    
                    {/* Camera Feed Visual Simulator */}
                    <div style={{
                      aspectRatio: "16/9",
                      background: "#0c0a08",
                      borderRadius: 16,
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(224, 213, 201, 0.05)",
                      overflow: "hidden"
                    }}>
                      
                      {/* Grid overlay */}
                      <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(rgba(18, 16, 15, 0) 95%, rgba(224, 99, 52, 0.04) 95%), linear-gradient(90deg, rgba(18, 16, 15, 0) 95%, rgba(224, 99, 52, 0.04) 95%)",
                        backgroundSize: "20px 20px",
                        pointerEvents: "none"
                      }}></div>
                      
                      {/* Architectural blueprint sketch in SVG for premium look */}
                      <svg width="60%" height="60%" viewBox="0 0 100 100" style={{ opacity: 0.15, stroke: "#E06334", strokeWidth: 0.5, fill: "none" }}>
                        <rect x="10" y="10" width="80" height="80" />
                        <line x1="10" y1="50" x2="90" y2="50" />
                        <line x1="50" y1="10" x2="50" y2="90" />
                        <circle cx="50" cy="50" r="25" />
                        <path d="M 15 15 L 85 85 M 85 15 L 15 85" />
                      </svg>

                      {/* Camera scan line animation effect */}
                      <div style={{
                        position: "absolute",
                        width: "100%",
                        height: 2,
                        background: "rgba(224, 99, 52, 0.3)",
                        top: 0,
                        left: 0,
                        boxShadow: "0 0 8px rgba(224, 99, 52, 0.8)",
                        animation: "scanLine 6s linear infinite"
                      }}></div>

                      {/* Video noise simulation static */}
                      <div style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        opacity: 0.03,
                        background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                        pointerEvents: "none"
                      }}></div>

                      {/* LIVE Badge */}
                      <div style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: "rgba(239, 68, 68, 0.85)",
                        color: "#fff",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)"
                      }}>
                        <span style={{
                          width: 6,
                          height: 6,
                          background: "#fff",
                          borderRadius: "50%",
                          animation: "pulseRed 1.2s infinite"
                        }}></span>
                        LIVE
                      </div>

                      {/* Watermark Timestamp */}
                      <div style={{
                        position: "absolute",
                        bottom: 10,
                        left: 12,
                        fontSize: 9,
                        fontFamily: "monospace",
                        color: "rgba(255,255,255,0.6)",
                        background: "rgba(0,0,0,0.5)",
                        padding: "2px 6px",
                        borderRadius: 4
                      }}>
                        CAM-0{cam.id} // {cam.stage} // {currentTime || "Toshkent vaqti"}
                      </div>
                      
                      {/* Quality label */}
                      <div style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        fontSize: 9,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.7)",
                        background: "rgba(0,0,0,0.4)",
                        padding: "2px 6px",
                        borderRadius: 4
                      }}>
                        {cam.quality}
                      </div>

                      <span style={{ fontSize: 13, color: "rgba(224, 213, 201, 0.4)", position: "absolute", pointerEvents: "none" }}>
                        Kamera translatsiyasi faol
                      </span>

                    </div>

                    <div style={{ marginTop: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>{cam.name}</h4>
                      <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "rgba(224, 213, 201, 0.5)", lineHeight: "1.4" }}>
                        Loyiha qurilishi tasdiqlangan grafik bo'yicha olib borilmoqda. Texnik nazorat tomonidan kamchiliklar aniqlanmagan.
                      </p>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* RECEIPT MODAL */}
          {showReceipt && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20
            }} className="no-print-overlay">
              {/* Modal Container */}
              <div className="printable-area" style={{
                background: "#1c1510",
                border: "1px solid rgba(224, 213, 201, 0.15)",
                borderRadius: 24,
                width: "100%",
                maxWidth: 650,
                padding: 30,
                color: "#eae5df",
                position: "relative",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                animation: "slideUp 0.3s ease"
              }}>
                 {/* Modal Header */}
                 <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                   <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>To'lov Kvitansiyasi</h3>
                   <button 
                     onClick={() => setShowReceipt(false)}
                     style={{
                       background: "rgba(224, 213, 201, 0.05)",
                       border: "none",
                       color: "#eae5df",
                       width: 32,
                       height: 32,
                       borderRadius: "50%",
                       cursor: "pointer",
                       fontSize: 18,
                       display: "flex",
                       alignItems: "center",
                       justifyContent: "center"
                     }}
                   >
                     &times;
                   </button>
                 </div>

                 {/* Printable Receipt Content */}
                 <div className="printable-receipt-content" style={{
                   background: "rgba(255,255,255,0.02)",
                   border: "1.5px solid rgba(224, 213, 201, 0.1)",
                   borderRadius: 16,
                   padding: 24,
                   position: "relative",
                   overflow: "hidden"
                 }}>
                    {/* Watermark PAID */}
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%) rotate(-25deg)",
                      color: "rgba(34, 197, 94, 0.12)",
                      fontSize: 64,
                      fontWeight: 900,
                      border: "8px double rgba(34, 197, 94, 0.12)",
                      padding: "10px 30px",
                      borderRadius: 16,
                      textTransform: "uppercase",
                      letterSpacing: 4,
                      pointerEvents: "none",
                      userSelect: "none"
                    }} className="receipt-watermark">
                      TO'LANDI / PAID
                    </div>

                    {/* Receipt Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1.5px solid rgba(224, 213, 201, 0.1)", paddingBottom: 16, marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }} className="receipt-brand">«MASKON-QURILISH» MCHJ</div>
                        <div style={{ fontSize: 11, color: "rgba(224, 213, 201, 0.5)" }} className="receipt-sub">Yunusobod tumani, 12-daha, Toshkent</div>
                        <div style={{ fontSize: 11, color: "rgba(224, 213, 201, 0.5)" }} className="receipt-sub">Tel: +998 71 200 02 02 | H/R: 20208000600123456001</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#E06334" }} className="receipt-number">KVITANSIYA № {contract.id * 7 + 10924}</div>
                        <div style={{ fontSize: 11, color: "rgba(224, 213, 201, 0.5)" }} className="receipt-sub">Sana: {new Date().toLocaleDateString("uz-UZ")}</div>
                      </div>
                    </div>

                    {/* Receipt Details */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24, fontSize: 12 }}>
                      <div>
                        <span style={{ fontSize: 10, color: "rgba(224, 213, 201, 0.5)" }}>TO'LOVCHI / PAYER:</span>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 2 }} className="receipt-text-white">{contract.lead_name}</div>
                        <div style={{ color: "rgba(224, 213, 201, 0.7)", marginTop: 1 }}>Tel: {contract.lead_phone}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: "rgba(224, 213, 201, 0.5)" }}>LOYIHA VA XONADON:</span>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 2 }} className="receipt-text-white">{contract.project_name}</div>
                        <div style={{ color: "rgba(224, 213, 201, 0.7)", marginTop: 1 }}>{contract.unit_number}-xonadon, {contract.floor}-qavat, {contract.rooms} xona</div>
                      </div>
                    </div>

                    {/* Summary Table */}
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 24 }}>
                      <thead>
                        <tr style={{ borderBottom: "1.5px solid rgba(224, 213, 201, 0.15)", textAlign: "left" }}>
                          <th style={{ padding: "8px 4px", color: "rgba(224, 213, 201, 0.5)", fontWeight: 600 }}>Tavsif / Description</th>
                          <th style={{ padding: "8px 4px", color: "rgba(224, 213, 201, 0.5)", fontWeight: 600, textAlign: "right" }}>Summa / Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid rgba(224, 213, 201, 0.05)" }}>
                          <td style={{ padding: "10px 4px" }}>Shartnoma umumiy qiymati (Contract Price)</td>
                          <td style={{ padding: "10px 4px", textAlign: "right", fontWeight: 600 }}>{formatPrice(contract.sold_price)}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid rgba(224, 213, 201, 0.05)" }}>
                          <td style={{ padding: "10px 4px" }}>Boshlang'ich to'lov (Downpayment)</td>
                          <td style={{ padding: "10px 4px", textAlign: "right" }}>{formatPrice(contract.initial_payment)}</td>
                        </tr>
                        <tr style={{ borderBottom: "1.5px solid rgba(224, 213, 201, 0.15)", background: "rgba(34, 197, 94, 0.03)" }}>
                          <td style={{ padding: "12px 4px", fontWeight: 700, color: "#22c55e" }}>To'langan umumiy summa (Paid Amount)</td>
                          <td style={{ padding: "12px 4px", textAlign: "right", fontWeight: 800, color: "#22c55e", fontSize: 13 }}>{formatPrice(contract.paid_amount)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "12px 4px", fontWeight: 700, color: debtAmount > 0 ? "rgba(224, 213, 201, 0.8)" : "#22c55e" }}>Qolgan qarz balansi (Remaining Debt)</td>
                          <td style={{ padding: "12px 4px", textAlign: "right", fontWeight: 800, color: debtAmount > 0 ? "#ef4444" : "#22c55e", fontSize: 13 }}>{formatPrice(debtAmount)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Footer Signature & Barcode */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20 }}>
                      {/* Mock barcode SVG */}
                      <div>
                        <svg width="120" height="35" viewBox="0 0 120 35" style={{ background: "transparent" }} className="receipt-barcode">
                          <rect width="120" height="35" fill="none" />
                          <rect x="5" y="5" width="2" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="9" y="5" width="1" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="12" y="5" width="3" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="17" y="5" width="1" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="20" y="5" width="2" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="24" y="5" width="4" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="30" y="5" width="1" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="33" y="5" width="2" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="37" y="5" width="3" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="42" y="5" width="1" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="45" y="5" width="2" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="49" y="5" width="1" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="52" y="5" width="4" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="58" y="5" width="2" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="62" y="5" width="1" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="65" y="5" width="3" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="70" y="5" width="2" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="74" y="5" width="1" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="77" y="5" width="4" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="83" y="5" width="2" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="87" y="5" width="1" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="90" y="5" width="3" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="95" y="5" width="1" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="98" y="5" width="2" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="102" y="5" width="4" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="108" y="5" width="1" height="25" fill="#eae5df" className="barcode-line" />
                          <rect x="111" y="5" width="3" height="25" fill="#eae5df" className="barcode-line" />
                          <text x="60" y="34" fontSize="6" fill="rgba(224, 213, 201, 0.4)" textAnchor="middle" fontFamily="monospace" className="barcode-text">
                            {contract.id * 12345}
                          </text>
                        </svg>
                      </div>

                      {/* Signatures */}
                      <div style={{ fontSize: 11, display: "flex", gap: 30 }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ borderBottom: "1px solid rgba(224, 213, 201, 0.3)", width: 100, height: 18 }} className="signature-line"></div>
                          <div style={{ fontSize: 9, color: "rgba(224, 213, 201, 0.5)", marginTop: 4 }}>Kassir (Cashier)</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ borderBottom: "1px solid rgba(224, 213, 201, 0.3)", width: 100, height: 18 }} className="signature-line"></div>
                          <div style={{ fontSize: 9, color: "rgba(224, 213, 201, 0.5)", marginTop: 4 }}>Mijoz (Client)</div>
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* Modal Action Buttons */}
                 <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                   <button
                     onClick={() => setShowReceipt(false)}
                     style={{
                       background: "rgba(224, 213, 201, 0.05)",
                       border: "1px solid rgba(224, 213, 201, 0.15)",
                       color: "#eae5df",
                       padding: "10px 20px",
                       borderRadius: 12,
                       fontSize: 13,
                       fontWeight: 600,
                       cursor: "pointer"
                     }}
                   >
                     Yopish
                   </button>
                   <button
                     onClick={() => window.print()}
                     style={{
                       background: "linear-gradient(135deg, #E06334 0%, #B2451E 100%)",
                       border: "none",
                       color: "#fff",
                       padding: "10px 24px",
                       borderRadius: 12,
                       fontSize: 13,
                       fontWeight: 700,
                       cursor: "pointer",
                       boxShadow: "0 4px 15px rgba(224, 99, 52, 0.3)",
                       display: "flex",
                       alignItems: "center",
                       gap: 8
                     }}
                   >
                     <i className="ti ti-printer"></i>
                     Chop Etish / PDF
                   </button>
                 </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Styled animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scanLine {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes pulseRed {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          .no-print-overlay {
            position: absolute !important;
            background: transparent !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .client-portal-bg {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
          }
          .printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .printable-receipt-content {
            background: #ffffff !important;
            color: #000000 !important;
            border: 1.5px solid #000000 !important;
            padding: 24px !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .printable-contract-content {
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .printable-area *, .printable-receipt-content *, .printable-contract-content * {
            color: #000000 !important;
          }
          .receipt-brand {
            color: #000000 !important;
          }
          .receipt-number {
            color: #000000 !important;
          }
          .receipt-text-white {
            color: #000000 !important;
          }
          .receipt-watermark {
            color: rgba(34, 197, 94, 0.15) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .barcode-line {
            fill: #000000 !important;
          }
          .barcode-text {
            fill: #000000 !important;
          }
          .signature-line {
            border-bottom: 1px solid #000000 !important;
          }
        }
      ` }} />

    </div>
  );
}
