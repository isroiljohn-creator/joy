"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getGoogleAccountsAction } from "@/app/actions";

export default function GoogleOAuthMock() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1); // 1: Choose account, 2: Use another account
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Custom account inputs
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  useEffect(() => {
    // Fetch some database accounts to show in selector
    async function loadAccounts() {
      try {
        const res = await getGoogleAccountsAction();
        setAccounts(res || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadAccounts();
  }, []);

  const handleSelectAccount = (email, name) => {
    setLoading(true);
    const callbackUrl = `/api/auth/google/callback?code=mock_dev_code&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
    window.location.href = callbackUrl;
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customName) return;
    setLoading(true);
    const callbackUrl = `/api/auth/google/callback?code=mock_dev_code&email=${encodeURIComponent(customEmail)}&name=${encodeURIComponent(customName)}`;
    window.location.href = callbackUrl;
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Google Logo */}
        <div style={logoWrapperStyle}>
          <svg viewBox="0 0 24 24" width="28" height="28" style={{ display: "block" }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        </div>

        {step === 1 ? (
          <div>
            <h1 style={titleStyle}>Hisobni tanlang</h1>
            <p style={subtitleStyle}>Joy.uz platformasiga o&apos;tish uchun</p>

            <div style={listStyle}>
              {accounts.map((acc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAccount(acc.email, acc.name)}
                  style={btnStyle}
                  disabled={loading}
                >
                  <div style={avatarStyle}>
                    {acc.name ? acc.name[0].toUpperCase() : "U"}
                  </div>
                  <div style={textWrapperStyle}>
                    <div style={nameStyle}>{acc.name}</div>
                    <div style={emailStyle}>{acc.email}</div>
                  </div>
                </button>
              ))}

              {/* Default Mock Accounts if DB is empty */}
              {accounts.length === 0 && (
                <>
                  <button
                    onClick={() => handleSelectAccount("dilnoza.y@gmail.com", "Dilnoza Yusupova")}
                    style={btnStyle}
                    disabled={loading}
                  >
                    <div style={avatarStyle}>D</div>
                    <div style={textWrapperStyle}>
                      <div style={nameStyle}>Dilnoza Yusupova</div>
                      <div style={emailStyle}>dilnoza.y@gmail.com</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleSelectAccount("aziz.karimov@gmail.com", "Aziz Karimov")}
                    style={btnStyle}
                    disabled={loading}
                  >
                    <div style={avatarStyle}>A</div>
                    <div style={textWrapperStyle}>
                      <div style={nameStyle}>Aziz Karimov</div>
                      <div style={emailStyle}>aziz.karimov@gmail.com</div>
                    </div>
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              style={useAnotherBtnStyle}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Boshqa hisobdan foydalanish
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit}>
            <h1 style={titleStyle}>Tizimga kirish</h1>
            <p style={subtitleStyle}>Google hisobingizdan foydalaning</p>

            <div style={formGroupStyle}>
              <div style={fieldStyle}>
                <input
                  type="text"
                  placeholder="Ism familiyangiz"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                  style={inputStyle}
                  disabled={loading}
                />
              </div>
              <div style={fieldStyle}>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  required
                  style={inputStyle}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={buttonGroupStyle}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={backBtnStyle}
                disabled={loading}
              >
                Ortga
              </button>
              <button
                type="submit"
                style={submitBtnStyle}
                disabled={loading}
              >
                {loading ? "Kutilmoqda..." : "Keyingisi"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Styling aligned with official Google login aesthetics and dark-mode compatibility
const containerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  background: "var(--cream, #FBF7F3)",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
};

const cardStyle = {
  background: "var(--card-bg, #ffffff)",
  border: "1.5px solid var(--sand, #ECE3D9)",
  borderRadius: 8,
  padding: "40px",
  width: "100%",
  maxWidth: 450,
  boxSizing: "border-box",
  textAlign: "center",
  boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
};

const logoWrapperStyle = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 16
};

const titleStyle = {
  fontSize: 24,
  fontWeight: 400,
  color: "var(--ink, #1A130E)",
  margin: "0 0 8px 0"
};

const subtitleStyle = {
  fontSize: 16,
  color: "var(--text2, #5F5E5A)",
  margin: "0 0 28px 0"
};

const listStyle = {
  display: "flex",
  flexDirection: "column",
  borderTop: "1px solid var(--sand, #ECE3D9)",
  marginBottom: 20
};

const btnStyle = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "16px 12px",
  background: "none",
  border: "none",
  borderBottom: "1px solid var(--sand, #ECE3D9)",
  cursor: "pointer",
  transition: "background 0.2s",
  outline: "none",
  textAlign: "left"
};

const avatarStyle = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "var(--orange-tint, #FDEAE2)",
  color: "var(--orange, #F2591F)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  fontSize: 14,
  marginRight: 12
};

const textWrapperStyle = {
  flex: 1
};

const nameStyle = {
  fontSize: 14,
  fontWeight: 500,
  color: "var(--ink, #1A130E)"
};

const emailStyle = {
  fontSize: 12,
  color: "var(--muted, #9B9286)"
};

const useAnotherBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "12px",
  background: "none",
  border: "none",
  borderRadius: 4,
  color: "var(--orange, #F2591F)",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  outline: "none"
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  marginBottom: 24
};

const fieldStyle = {
  width: "100%"
};

const inputStyle = {
  width: "100%",
  padding: "14px",
  border: "1.5px solid var(--sand, #ECE3D9)",
  background: "var(--card-bg, #ffffff)",
  color: "var(--ink, #1A130E)",
  borderRadius: 4,
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s"
};

const buttonGroupStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const backBtnStyle = {
  background: "none",
  border: "none",
  color: "var(--orange, #F2591F)",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  padding: "8px 16px"
};

const submitBtnStyle = {
  background: "var(--orange, #F2591F)",
  color: "#ffffff",
  border: "none",
  borderRadius: 4,
  padding: "10px 24px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(242,89,31,0.2)"
};
