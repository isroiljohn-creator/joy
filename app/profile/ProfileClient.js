"use client";
import { useState } from "react";
import Link from "next/link";
import { Nav, ListingCard } from "@/components/ui";
import { updateSettingsAction } from "@/app/actions";

export default function ProfileClient({ user, myListings, savedListings, messages }) {
  const [tab, setTab] = useState("Mening e'lonlarim");
  
  // Sozlamalar oynasi state-lari
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);

    try {
      const res = await updateSettingsAction(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        // Cookie-lar yangilangani uchun sahifani yangilashimiz kerak
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      setError("Xatolik yuz berdi");
      setLoading(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="phead">
          <div className="bigav">
            {user?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="hname display">
              {user?.name} <i className="ti ti-rosette-discount-check"></i>
            </div>
            <div className="hmeta">
              <span>
                <i className="ti ti-phone" style={{ fontSize: 15 }}></i> {user?.phone}
              </span>
              <span>
                <i className="ti ti-calendar" style={{ fontSize: 15 }}></i> 2024
                yildan beri
              </span>
              <span>
                <i className="ti ti-star" style={{ fontSize: 15 }}></i> 4.9
                reyting
              </span>
            </div>
          </div>
          <button className="editp" onClick={() => setTab("Sozlamalar")}>
            <i
              className="ti ti-settings"
              style={{ fontSize: 15, verticalAlign: -2 }}
            ></i>{" "}
            Sozlamalar
          </button>
        </div>

        <div className="pstats">
          <div className="pstat">
            <i className="ti ti-files"></i>
            <div className="n">{myListings.length}</div>
            <div className="l">Mening e'lonlarim</div>
          </div>
          <div className="pstat">
            <i className="ti ti-heart"></i>
            <div className="n">{savedListings.length}</div>
            <div className="l">Saqlanganlar</div>
          </div>
          <div className="pstat">
            <i className="ti ti-messages"></i>
            <div className="n">{messages.length}</div>
            <div className="l">Kelgan xabarlar</div>
          </div>
          <div className="pstat">
            <i className="ti ti-star"></i>
            <div className="n">4.9</div>
            <div className="l">Foydalanuvchi reytingi</div>
          </div>
        </div>

        <div className="ptabs">
          {["Mening e'lonlarim", "Saqlangan", "Xabarlar", "Sozlamalar"].map(
            (t) => (
              <div
                key={t}
                className={"ptab" + (tab === t ? " on" : "")}
                onClick={() => {
                  setTab(t);
                  setError("");
                  setSuccess(false);
                }}
              >
                {t}
              </div>
            )
          )}
        </div>

        {/* 1. Mening e'lonlarim tab */}
        {tab === "Mening e'lonlarim" && (
          myListings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)" }}>
              <i className="ti ti-files" style={{ fontSize: 40, display: "block", marginBottom: 12 }}></i>
              Siz hali e'lon qo'shmadingiz.
            </div>
          ) : (
            <div className="grid" style={{ paddingBottom: 64 }}>
              {myListings.map((l) => (
                <Link className="card" href={`/property/${l.id}`} key={l.id}>
                  <div
                    className="photo"
                    style={{
                      height: 150,
                      backgroundImage: `url('${l.photo}')`,
                      backgroundColor: "#C9BDA8",
                    }}
                  >
                    <span
                      className={
                        "status " + (l.status === "active" ? "active" : "pending")
                      }
                    >
                      {l.status === "active" ? "Faol" : "Moderatsiyada"}
                    </span>
                  </div>
                  <div className="cb">
                    <div className="price" style={{ fontSize: 19 }}>
                      {l.price}
                    </div>
                    <div className="ptype" style={{ fontSize: 14 }}>
                      {l.type}
                    </div>
                    <div className="addr">
                      <i className="ti ti-map-pin"></i> {l.addr}
                    </div>
                    <div className="pviews">
                      <span>
                        <i className="ti ti-eye"></i> {l.views.toLocaleString()}
                      </span>
                      <span>
                        <i className="ti ti-heart"></i> {l.saves}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* 2. Saqlangan (Favorites) tab */}
        {tab === "Saqlangan" && (
          savedListings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)" }}>
              <i className="ti ti-heart-broken" style={{ fontSize: 40, display: "block", marginBottom: 12 }}></i>
              Hozircha saqlangan e'lonlar yo'q.
            </div>
          ) : (
            <div className="grid" style={{ paddingBottom: 64 }}>
              {savedListings.map((l) => (
                <ListingCard l={l} key={l.id} isFavorite={true} />
              ))}
            </div>
          )
        )}

        {/* 3. Xabarlar (Inbox Messaging) tab */}
        {tab === "Xabarlar" && (
          messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)" }}>
              <i className="ti ti-message-circle-off" style={{ fontSize: 40, display: "block", marginBottom: 12 }}></i>
              Kelgan xabarlar mavjud emas.
            </div>
          ) : (
            <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 64 }}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--sand)",
                    borderRadius: 18,
                    padding: 20,
                    marginBottom: 16,
                    boxShadow: "0 6px 12px rgba(26,19,14,0.02)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                      borderBottom: "1px solid var(--sand)",
                      paddingBottom: 10
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{m.senderName}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        <i className="ti ti-phone" style={{ fontSize: 13 }}></i> {m.senderPhone}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--orange)" }}>
                        {m.listingType}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {new Date(m.createdAt).toLocaleDateString("uz-UZ", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.5 }}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* 4. Sozlamalar (Profile settings) tab */}
        {tab === "Sozlamalar" && (
          <div style={{ maxWidth: 440, margin: "0 auto", paddingBottom: 64 }}>
            <form onSubmit={handleUpdateSettings} className="fsection">
              <h2 className="display" style={{ fontSize: 20, marginBottom: 16 }}>
                Sozlamalarni tahrirlash
              </h2>

              {success && (
                <div
                  style={{
                    color: "var(--green)",
                    background: "var(--green-tint)",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16
                  }}
                >
                  <i className="ti ti-circle-check"></i> Sozlamalar muvaffaqiyatli saqlandi! Sahifa yangilanmoqda...
                </div>
              )}

              {error && (
                <div
                  style={{
                    color: "#b23e12",
                    background: "#fdeae2",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16
                  }}
                >
                  <i className="ti ti-alert-circle"></i> {error}
                </div>
              )}

              <div className="field" style={{ marginBottom: 14 }}>
                <label>Foydalanuvchi ismi</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="field" style={{ marginBottom: 20 }}>
                <label>Telefon raqami</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-pub" disabled={loading} style={{ margin: 0 }}>
                <i className="ti ti-device-floppy"></i> {loading ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
