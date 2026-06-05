"use client";
import { useState } from "react";
import Link from "next/link";
import { Nav, ListingCard } from "@/components/ui";
import { updateSettingsAction, deleteListingAction, deleteMessageAction, changePasswordAction } from "@/app/actions";

function formatDate(dateVal) {
  try {
    if (!dateVal) return "";
    return new Date(dateVal).toLocaleDateString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return String(dateVal || "");
  }
}

function getUserYear(createdAt) {
  try {
    if (!createdAt) return new Date().getFullYear();
    return new Date(createdAt).getFullYear();
  } catch {
    return new Date().getFullYear();
  }
}

export default function ProfileClient({ user, myListings, savedListings, messages, initialTab = "Mening e'lonlarim" }) {
  const [tab, setTab] = useState(initialTab);
  
  // Sozlamalar oynasi state-lari
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Parolni o'zgartirish state-lari
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  // E'lonlarni o'chirish loading state-lari
  const [deletingListing, setDeletingListing] = useState(null);
  const [deletingMessage, setDeletingMessage] = useState(null);

  // Xabar javob berish state-lari
  const [replyingTo, setReplyingTo] = useState(null);

  // Lokal xabarlar ro'yxati (o'chirish uchun)
  const [localMessages, setLocalMessages] = useState(messages);
  const [localMyListings, setLocalMyListings] = useState(myListings);

  const memberYear = getUserYear(user?.createdAt);

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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError("");
    setPwSuccess(false);

    const formData = new FormData();
    formData.append("oldPassword", oldPassword);
    formData.append("newPassword", newPassword);

    try {
      const res = await changePasswordAction(formData);
      if (res?.error) {
        setPwError(res.error);
      } else {
        setPwSuccess(true);
        setOldPassword("");
        setNewPassword("");
      }
    } catch (err) {
      setPwError("Xatolik yuz berdi");
    }
    setPwLoading(false);
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm("Haqiqatan ham bu e'lonni o'chirmoqchimisiz?")) return;
    setDeletingListing(listingId);
    try {
      const res = await deleteListingAction(listingId);
      if (res?.error) {
        alert(res.error);
      } else {
        setLocalMyListings(prev => prev.filter(l => l.id !== listingId));
      }
    } catch (err) {
      alert("Xatolik yuz berdi");
    }
    setDeletingListing(null);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Xabarni o'chirmoqchimisiz?")) return;
    setDeletingMessage(messageId);
    try {
      const res = await deleteMessageAction(messageId);
      if (res?.error) {
        alert(res.error);
      } else {
        setLocalMessages(prev => prev.filter(m => m.id !== messageId));
      }
    } catch (err) {
      alert("Xatolik yuz berdi");
    }
    setDeletingMessage(null);
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
                <i className="ti ti-calendar" style={{ fontSize: 15 }}></i> {memberYear}
                {" "}yildan beri
              </span>
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {user?.role === "admin" && (
              <Link 
                href="/admin" 
                className="editp" 
                style={{ 
                  background: "var(--purple-tint)", 
                  color: "var(--purple)", 
                  borderColor: "transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <i className="ti ti-shield" style={{ fontSize: 15 }}></i> Admin Panel
              </Link>
            )}
            <button className="editp" onClick={() => setTab("Sozlamalar")}>
              <i
                className="ti ti-settings"
                style={{ fontSize: 15, verticalAlign: -2 }}
              ></i>{" "}
              Sozlamalar
            </button>
          </div>
        </div>

        <div className="pstats">
          <div className="pstat">
            <i className="ti ti-files"></i>
            <div className="n">{localMyListings.length}</div>
            <div className="l">Mening e&apos;lonlarim</div>
          </div>
          <div className="pstat">
            <i className="ti ti-heart"></i>
            <div className="n">{savedListings.length}</div>
            <div className="l">Saqlanganlar</div>
          </div>
          <div className="pstat">
            <i className="ti ti-messages"></i>
            <div className="n">{localMessages.length}</div>
            <div className="l">Kelgan xabarlar</div>
          </div>
          <div className="pstat">
            <i className="ti ti-star"></i>
            <div className="n">—</div>
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
                  setPwError("");
                  setPwSuccess(false);
                }}
              >
                {t}
              </div>
            )
          )}
        </div>

        {/* 1. Mening e'lonlarim tab */}
        {tab === "Mening e'lonlarim" && (
          localMyListings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)" }}>
              <i className="ti ti-files" style={{ fontSize: 40, display: "block", marginBottom: 12 }}></i>
              Siz hali e&apos;lon qo&apos;shmadingiz.
            </div>
          ) : (
            <div className="grid" style={{ paddingBottom: 64 }}>
              {localMyListings.map((l) => (
                <div key={l.id} style={{ position: "relative" }}>
                  <Link className="card" href={`/property/${l.id}`}>
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
                  <button
                    onClick={() => handleDeleteListing(l.id)}
                    disabled={deletingListing === l.id}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      background: "rgba(255,255,255,0.9)",
                      border: "1px solid #eee",
                      borderRadius: 8,
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      zIndex: 5,
                      color: "#d9534f",
                      fontSize: 16
                    }}
                    title="O'chirish"
                  >
                    <i className={deletingListing === l.id ? "ti ti-loader" : "ti ti-trash"}></i>
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* 2. Saqlangan (Favorites) tab */}
        {tab === "Saqlangan" && (
          savedListings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)" }}>
              <i className="ti ti-heart-broken" style={{ fontSize: 40, display: "block", marginBottom: 12 }}></i>
              Hozircha saqlangan e&apos;lonlar yo&apos;q.
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
          localMessages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)" }}>
              <i className="ti ti-message-circle-off" style={{ fontSize: 40, display: "block", marginBottom: 12 }}></i>
              Kelgan xabarlar mavjud emas.
            </div>
          ) : (
            <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 64 }}>
              {localMessages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: "#fff",
                    border: m.isRead ? "1px solid var(--sand)" : "1.5px solid var(--orange)",
                    borderRadius: 18,
                    padding: 20,
                    marginBottom: 16,
                    boxShadow: m.isRead ? "0 6px 12px rgba(26,19,14,0.02)" : "0 6px 16px rgba(255,140,0,0.08)"
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
                      <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                        {m.senderName}
                        {m.isRead ? (
                          <span style={{ fontSize: 10, background: "#eee", color: "var(--muted)", padding: "2px 6px", borderRadius: 6, fontWeight: 500 }}>O&apos;qilgan</span>
                        ) : (
                          <span style={{ fontSize: 10, background: "var(--orange)", color: "#fff", padding: "2px 6px", borderRadius: 6, fontWeight: 600 }}>Yangi</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        <i className="ti ti-phone" style={{ fontSize: 13 }}></i> {m.senderPhone}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--orange)" }}>
                        {m.listingType}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {formatDate(m.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.5 }}>
                    {m.content}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => setReplyingTo(replyingTo === m.id ? null : m.id)}
                      style={{
                        background: "none",
                        border: "1px solid var(--sand)",
                        borderRadius: 8,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: "var(--text2)"
                      }}
                    >
                      <i className="ti ti-message-reply" style={{ fontSize: 14 }}></i> Javob berish
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(m.id)}
                      disabled={deletingMessage === m.id}
                      style={{
                        background: "none",
                        border: "1px solid #f5d0c5",
                        borderRadius: 8,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: "#d9534f"
                      }}
                    >
                      <i className={deletingMessage === m.id ? "ti ti-loader" : "ti ti-trash"} style={{ fontSize: 14 }}></i> O&apos;chirish
                    </button>
                  </div>
                  {replyingTo === m.id && (
                    <div style={{ marginTop: 12, padding: 12, background: "var(--orange-tint)", borderRadius: 12 }}>
                      <textarea
                        placeholder="Javob yozing..."
                        style={{
                          width: "100%",
                          minHeight: 60,
                          border: "1px solid var(--sand)",
                          borderRadius: 8,
                          padding: 10,
                          fontSize: 13,
                          outline: "none",
                          resize: "vertical",
                          boxSizing: "border-box"
                        }}
                      ></textarea>
                      <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          style={{
                            background: "none",
                            border: "1px solid var(--sand)",
                            borderRadius: 8,
                            padding: "6px 14px",
                            fontSize: 12,
                            cursor: "pointer"
                          }}
                        >
                          Bekor qilish
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            alert("Xabar yuborish tez kunda ishga tushadi");
                            setReplyingTo(null);
                          }}
                          style={{
                            background: "var(--orange)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "6px 14px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          <i className="ti ti-send" style={{ fontSize: 13 }}></i> Yuborish
                        </button>
                      </div>
                    </div>
                  )}
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

            {/* Parolni o'zgartirish */}
            <form onSubmit={handleChangePassword} className="fsection" style={{ marginTop: 32, borderTop: "1px solid var(--sand)", paddingTop: 24 }}>
              <h2 className="display" style={{ fontSize: 20, marginBottom: 16 }}>
                Parolni o&apos;zgartirish
              </h2>

              {pwSuccess && (
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
                  <i className="ti ti-circle-check"></i> Parol muvaffaqiyatli o&apos;zgartirildi!
                </div>
              )}

              {pwError && (
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
                  <i className="ti ti-alert-circle"></i> {pwError}
                </div>
              )}

              <div className="field" style={{ marginBottom: 14 }}>
                <label>Eski parol</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Joriy parolingiz"
                  required
                />
              </div>

              <div className="field" style={{ marginBottom: 20 }}>
                <label>Yangi parol</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                  required
                />
                {newPassword.length > 0 && newPassword.length < 6 && (
                  <div style={{ color: "#d9534f", fontSize: 12, marginTop: 4 }}>
                    Kamida 6 ta belgi kerak
                  </div>
                )}
              </div>

              <button type="submit" className="btn-pub" disabled={pwLoading} style={{ margin: 0 }}>
                <i className="ti ti-lock"></i> {pwLoading ? "O'zgartirilmoqda..." : "Parolni o'zgartirish"}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
