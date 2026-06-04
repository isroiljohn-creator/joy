"use client";
import { useState, useEffect } from "react";
import { sendMessageAction } from "@/app/actions";

export default function MessageModal({ listingId, receiverOwner }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Cookie-larni tekshirish
    const cookiesList = document.cookie.split(";").reduce((acc, c) => {
      const [key, val] = c.trim().split("=");
      if (key && val) {
        acc[key] = val;
      }
      return acc;
    }, {});

    if (cookiesList.user_id && cookiesList.user_name) {
      setIsLoggedIn(true);
      setSenderName(decodeURIComponent(cookiesList.user_name));
      setSenderPhone(decodeURIComponent(cookiesList.user_phone || ""));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData();
    formData.append("listing_id", listingId);
    formData.append("receiver_owner", receiverOwner);
    formData.append("content", content);
    if (!isLoggedIn) {
      formData.append("sender_name", senderName);
      formData.append("sender_phone", senderPhone);
    }

    try {
      const res = await sendMessageAction(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        setContent("");
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      setError("Xatolik yuz berdi");
      setLoading(false);
    }
  };

  return (
    <>
      <button className="cbtn gh" onClick={() => setIsOpen(true)}>
        <i className="ti ti-message"></i> Xabar yozish
      </button>

      {isOpen && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(26, 19, 14, 0.6)",
            zIndex: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setIsOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            className="modal-box"
            style={{
              background: "#fff",
              borderRadius: 22,
              padding: 28,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              border: "1px solid var(--sand)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="display" style={{ fontSize: 22, marginBottom: 8 }}>
              Egasi bilan bog'lanish
            </h2>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>
              <strong>{receiverOwner}</strong>ga ushbu e'lon bo'yicha xabar yozing:
            </p>

            {success ? (
              <div
                style={{
                  color: "var(--green)",
                  background: "var(--green-tint)",
                  padding: "16px 20px",
                  borderRadius: 14,
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                <i className="ti ti-circle-check" style={{ fontSize: 24, display: "block", marginBottom: 6 }}></i>
                Xabaringiz muvaffaqiyatli yuborildi!
              </div>
            ) : (
              <>
                {error && (
                  <div
                    style={{
                      color: "#b23e12",
                      background: "#fdeae2",
                      padding: "10px 14px",
                      borderRadius: 10,
                      fontSize: 13,
                      marginBottom: 16
                    }}
                  >
                    {error}
                  </div>
                )}

                {!isLoggedIn && (
                  <>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 4 }}>Ismingiz</label>
                      <input
                        placeholder="Aziz Karimov"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        required
                        style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--sand)", outline: "none", fontSize: 14 }}
                      />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 4 }}>Telefon raqamingiz</label>
                      <input
                        placeholder="+998 90 123 45 67"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        required
                        style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--sand)", outline: "none", fontSize: 14 }}
                      />
                    </div>
                  </>
                )}

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 4 }}>Xabar matni</label>
                  <textarea
                    placeholder="Assalomu alaykum, e'lon bo'yicha batafsil ma'lumot bera olasizmi?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    style={{ width: "100%", height: 100, padding: 12, borderRadius: 12, border: "1px solid var(--sand)", outline: "none", fontSize: 14, resize: "none" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    className="cbtn gh"
                    onClick={() => setIsOpen(false)}
                    style={{ flex: 1, padding: 12 }}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="cbtn primary"
                    disabled={loading}
                    style={{ flex: 1, padding: 12, margin: 0 }}
                  >
                    {loading ? "Yuborilmoqda..." : "Yuborish"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </>
  );
}
