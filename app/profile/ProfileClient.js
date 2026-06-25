"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Nav, ListingCard } from "@/components/ui";
import { updateSettingsAction, deleteListingAction, deleteMessageAction, changePasswordAction } from "@/app/actions";
import { useTranslation } from "@/lib/useTranslation";

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

export default function ProfileClient({ user, myListings, savedListings, messagesCount, initialTab = "Mening e'lonlarim" }) {
  const { t, lang, setLanguage } = useTranslation();
  const [tab, setTab] = useState(initialTab);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDarkMode((localStorage.getItem("maskon-theme") || localStorage.getItem("joy-theme")) === "dark");
    }
  }, []);
  
  // Sozlamalar oynasi state-lari
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone && !user.phone.startsWith("google_") ? user.phone : "");
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
  const [localMyListings, setLocalMyListings] = useState(myListings);

  const memberYear = getUserYear(user?.createdAt);

  const handleLogout = () => {
    document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "user_display_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "user_phone=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "is_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = "/";
  };

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
              {user?.name} {user?.isVerified && <i className="ti ti-rosette-discount-check-filled" style={{ color: "var(--orange)" }} title="Tasdiqlangan foydalanuvchi"></i>}
            </div>
            <div className="hmeta">
              {user?.phone && !user.phone.startsWith("google_") ? (
                <span>
                  <i className="ti ti-phone" style={{ fontSize: 15 }}></i> {user?.phone}
                </span>
              ) : user?.email ? (
                <span>
                  <i className="ti ti-mail" style={{ fontSize: 15 }}></i> {user?.email}
                </span>
              ) : null}
              <span>
                <i className="ti ti-calendar" style={{ fontSize: 15 }}></i> {lang === "en" ? `${t("member_since")} ${memberYear}` : `${memberYear} ${t("member_since")}`}
              </span>
            </div>
          </div>
          <div className="phead-actions">
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
            {["owner", "rop", "seller"].includes(user?.role) && (
              <Link 
                href="/erp" 
                className="editp" 
                style={{ 
                  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                  color: "#e94560",
                  borderColor: "transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600
                }}
              >
                <i className="ti ti-building-skyscraper" style={{ fontSize: 15 }}></i> ERP Panel
              </Link>
            )}
            {!["owner", "rop", "seller"].includes(user?.role) && user?.role !== "admin" && (
              <Link 
                href="/erp" 
                className="editp" 
                style={{ 
                  background: "rgba(233,69,96,0.08)",
                  color: "#e94560",
                  borderColor: "rgba(233,69,96,0.2)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600
                }}
              >
                <i className="ti ti-building-skyscraper" style={{ fontSize: 15 }}></i> ERP ochish
              </Link>
            )}
            {!user?.isVerified && (
              <Link href="/premium" className="editp" style={{ background: "var(--orange-tint)", color: "var(--orange)", borderColor: "transparent" }}>
                <i className="ti ti-star" style={{ fontSize: 15, verticalAlign: -2 }}></i> {t("premium_btn")}
              </Link>
            )}
            <Link href="/agency-dashboard" className="editp" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-building-store" style={{ fontSize: 15 }}></i>{" "}
              {t("agency_dashboard")}
            </Link>
            <button className="editp" onClick={() => setTab("Sozlamalar")}>
              <i
                className="ti ti-settings"
                style={{ fontSize: 15, verticalAlign: -2 }}
              ></i>{" "}
              {t("settings")}
            </button>
          </div>

        </div>

        <div className="pstats">
          <div className="pstat">
            <i className="ti ti-files"></i>
            <div className="n">{localMyListings.length}</div>
            <div className="l">{t("listings_my")}</div>
          </div>
          <div className="pstat">
            <i className="ti ti-heart"></i>
            <div className="n">{savedListings.length}</div>
            <div className="l">{t("favorites")}</div>
          </div>
          <div className="pstat">
            <i className="ti ti-messages"></i>
            <div className="n">{messagesCount}</div>
            <div className="l">{t("inbox_msg")}</div>
          </div>
          <div className="pstat">
            <i className="ti ti-star"></i>
            <div className="n">—</div>
            <div className="l">{t("user_rating")}</div>
          </div>
        </div>

        <div className="ptabs">
          {["Mening e'lonlarim", "Saqlangan", "Sozlamalar"].map(
            (tItem) => {
              const tabLabels = {
                "Mening e'lonlarim": t("listings"),
                "Saqlangan": t("saved"),
                "Sozlamalar": t("settings")
              };
              return (
                <div
                  key={tItem}
                  className={"ptab" + (tab === tItem ? " on" : "")}
                  onClick={() => {
                    setTab(tItem);
                    setError("");
                    setSuccess(false);
                    setPwError("");
                    setPwSuccess(false);
                  }}
                >
                  {tabLabels[tItem] || tItem}
                </div>
              );
            }
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
                      
                      {l.priceStatus && (
                        <div style={{ margin: "4px 0", display: "flex", alignItems: "center" }}>
                          {l.priceStatus === "cheap" && (
                            <span style={{
                              background: "rgba(34, 197, 94, 0.1)",
                              color: "#16a34a",
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "1px 6px",
                              borderRadius: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2
                            }}>
                              <i className="ti ti-trending-down"></i> {Math.abs(l.priceDiffPercent)}% arzonroq
                            </span>
                          )}
                          {l.priceStatus === "expensive" && (
                            <span style={{
                              background: "rgba(239, 68, 68, 0.1)",
                              color: "#dc2626",
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "1px 6px",
                              borderRadius: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2
                            }}>
                              <i className="ti ti-trending-up"></i> {l.priceDiffPercent}% qimmatroq
                            </span>
                          )}
                          {l.priceStatus === "average" && (
                            <span style={{
                              background: "rgba(107, 114, 128, 0.1)",
                              color: "var(--muted)",
                              fontSize: 10,
                              fontWeight: 500,
                              padding: "1px 6px",
                              borderRadius: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2
                            }}>
                              <i className="ti ti-minus"></i> Bozor narxida
                            </span>
                          )}
                        </div>
                      )}

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
                  
                  {!l.top && (
                    <button
                      onClick={() => window.location.href = `/api/payments/create?type=pin_listing&listingId=${l.id}&amount=15000`} // Quick mock redirect logic
                      style={{
                        position: "absolute",
                        top: 50,
                        right: 10,
                        background: "var(--orange-tint)",
                        border: "1px solid var(--orange)",
                        borderRadius: 8,
                        padding: "6px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                        zIndex: 5,
                        color: "var(--orange)",
                        fontSize: 12,
                        fontWeight: 600
                      }}
                      title="Topga chiqarish (15,000 UZS)"
                    >
                      <i className="ti ti-arrow-up"></i> Top
                    </button>
                  )}
                  {l.top && (
                    <div
                      style={{
                        position: "absolute",
                        top: 50,
                        right: 10,
                        background: "var(--orange)",
                        borderRadius: 8,
                        padding: "6px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        zIndex: 5,
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      <i className="ti ti-rosette-discount-check-filled"></i> Topda
                    </div>
                  )}
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

        {/* 4. Sozlamalar (Profile settings) tab */}
        {tab === "Sozlamalar" && (
          <div style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 64 }}>
            {/* Grid layout for settings blocks */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 32,
              marginBottom: 32
            }}>
              {/* Left Column: Sozlamalarni tahrirlash */}
              <form onSubmit={handleUpdateSettings} className="fsection" style={{ margin: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h2 className="display" style={{ fontSize: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-user-cog" style={{ color: "var(--orange)", fontSize: 22 }}></i>
                    {t("edit_profile")}
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
                      <i className="ti ti-circle-check"></i> {t("success_save")}
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
                    <label>{t("user_name")}</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field" style={{ marginBottom: 14 }}>
                    <label>{t("phone_number")}</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field" style={{ marginBottom: 16 }}>
                    <label>{t("language")}</label>
                    <div style={{
                      display: "flex",
                      background: "var(--sand)",
                      padding: 4,
                      borderRadius: 14,
                      gap: 4,
                      marginTop: 6
                    }}>
                      <button
                        type="button"
                        onClick={() => setLanguage("uz")}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: 10,
                          border: "none",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: lang === "uz" ? "var(--orange)" : "transparent",
                          color: lang === "uz" ? "#fff" : "var(--text2)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        O&apos;zbekcha
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage("ru")}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: 10,
                          border: "none",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: lang === "ru" ? "var(--orange)" : "transparent",
                          color: lang === "ru" ? "#fff" : "var(--text2)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        Русский
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage("en")}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: 10,
                          border: "none",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: lang === "en" ? "var(--orange)" : "transparent",
                          color: lang === "en" ? "#fff" : "var(--text2)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  <div className="field" style={{ marginBottom: 20 }}>
                    <label>{t("theme")}</label>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: 14,
                      background: "var(--card-bg)",
                      border: "1px solid var(--sand)",
                      marginTop: 6
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                        {darkMode ? t("dark_mode") : t("light_mode")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextDark = !darkMode;
                          setDarkMode(nextDark);
                          if (nextDark) {
                            document.documentElement.setAttribute("data-theme", "dark");
                            localStorage.setItem("maskon-theme", "dark");
                          } else {
                            document.documentElement.removeAttribute("data-theme");
                            localStorage.setItem("maskon-theme", "light");
                          }
                          window.dispatchEvent(new Event("maskon-theme-change"));
                        }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          border: "1px solid var(--sand)",
                          background: "var(--cream)",
                          color: "var(--orange)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <i className={darkMode ? "ti ti-sun" : "ti ti-moon"}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-pub" disabled={loading} style={{ margin: 0, width: "100%" }}>
                  <i className="ti ti-device-floppy"></i> {loading ? t("saving") : t("save")}
                </button>
              </form>

              {/* Right Column: Parolni o'zgartirish */}
              <form onSubmit={handleChangePassword} className="fsection" style={{ margin: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h2 className="display" style={{ fontSize: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-key" style={{ color: "var(--orange)", fontSize: 22 }}></i>
                    {t("change_password")}
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
                      <i className="ti ti-circle-check"></i> {t("success_pw")}
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
                    <label>{t("old_password")}</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder={t("old_password")}
                      required
                    />
                  </div>

                  <div className="field" style={{ marginBottom: 20 }}>
                    <label>{t("new_password")}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t("password_placeholder")}
                      required
                    />
                    {newPassword.length > 0 && newPassword.length < 6 && (
                      <div style={{ color: "#d9534f", fontSize: 12, marginTop: 4 }}>
                        Kamida 6 ta belgi kerak
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn-pub" disabled={pwLoading} style={{ margin: 0, width: "100%" }}>
                  <i className="ti ti-lock"></i> {pwLoading ? t("saving") : t("change_password")}
                </button>
              </form>
            </div>

            {/* Logout Card */}
            <div className="fsection" style={{
              maxWidth: 440,
              margin: "0 auto",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: "24px 20px",
              borderRadius: 20
            }}>
              <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500 }}>
                {t("logout_confirm")}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-pub"
                style={{
                  background: "#ef4444",
                  borderColor: "#ef4444",
                  color: "#fff",
                  margin: 0,
                  width: "100%",
                  maxWidth: 200,
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
                  transition: "all 0.2s ease"
                }}
              >
                <i className="ti ti-logout-2"></i> {t("logout")}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
