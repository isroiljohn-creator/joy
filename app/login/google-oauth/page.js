"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function GoogleOAuthMockContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1); // 1: Email input, 2: Name input
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Safe preset test accounts for quick developer testing (not exposing actual database records)
  const quickAccounts = [
    { email: "karim.developer@gmail.com", name: "Karimov Karim" },
    { email: "mijoz.maskon@gmail.com", name: "Test Mijoz" },
    { email: "rieltor.professional@gmail.com", name: "Rieltor maskon" }
  ];

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!email) return;
    // Basic email validation
    if (!email.includes("@")) {
      alert("Iltimos, haqiqiy email manzilini kiriting.");
      return;
    }
    setStep(2);
  };

  const handleSelectQuickAccount = (selectedEmail, selectedName) => {
    setLoading(true);
    const callbackUrl = `/api/auth/google/callback?code=mock_dev_code&email=${encodeURIComponent(selectedEmail)}&name=${encodeURIComponent(selectedName)}`;
    window.location.href = callbackUrl;
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (!email || !name) return;
    setLoading(true);
    const callbackUrl = `/api/auth/google/callback?code=mock_dev_code&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
    window.location.href = callbackUrl;
  };

  return (
    <div style={containerStyle}>
      {/* Developer Environment Alert Banner */}
      <div style={devAlertStyle}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={alertIconStyle}>⚠️</span>
          <div>
            <div style={alertTitleStyle}>Dasturchi uchun eslatma (Developer Notice)</div>
            <div style={alertTextStyle}>
              Hozirda loyiha **simulyatsiya rejimida** ishlamoqda, chunki `.env` faylida `GOOGLE_CLIENT_ID` va `GOOGLE_CLIENT_SECRET` sozlanmagan.
              Haqiqiy Google loginni yoqish uchun ushbu o&apos;zgaruvchilarni kiriting.
              Hozircha istalgan elektron pochta va ismni kiritib yoki quyidagi tayyor test hisoblaridan birini tanlab tizimga kirishingiz mumkin.
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        {/* Google Logo */}
        <div style={logoWrapperStyle}>
          <svg viewBox="0 0 24 24" width="32" height="32" style={{ display: "block" }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep}>
            <h1 style={titleStyle}>Tizimga kirish</h1>
            <p style={subtitleStyle}>Google hisobingizdan foydalaning</p>

            <div style={formGroupStyle}>
              <div style={fieldStyle}>
                <input
                  type="email"
                  placeholder="Elektron pochta manzili"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={buttonGroupStyle}>
              <span style={{ fontSize: 13, color: "var(--orange, #E06334)", fontWeight: 500 }}>
                Haqiqiy simulyatsiya
              </span>
              <button
                type="submit"
                style={submitBtnStyle}
                disabled={loading}
              >
                Keyingisi
              </button>
            </div>

            <div style={dividerStyle}>
              <span style={dividerTextStyle}>yoki test hisoblari</span>
            </div>

            {/* Safe development test accounts */}
            <div style={quickListStyle}>
              {quickAccounts.map((acc, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectQuickAccount(acc.email, acc.name)}
                  style={quickBtnStyle}
                  disabled={loading}
                >
                  <div style={avatarStyle}>
                    {acc.name[0]}
                  </div>
                  <div style={textWrapperStyle}>
                    <div style={nameStyle}>{acc.name}</div>
                    <div style={emailStyle}>{acc.email}</div>
                  </div>
                </button>
              ))}
            </div>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit}>
            <h1 style={titleStyle}>Salom!</h1>
            <p style={subtitleStyle}>{email}</p>

            <div style={formGroupStyle}>
              <div style={fieldStyle}>
                <input
                  type="text"
                  placeholder="Ism familiyangiz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={inputStyle}
                  disabled={loading}
                  autoFocus
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
                {loading ? "Kutilmoqda..." : "Kirishni yakunlash"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function GoogleOAuthMock() {
  return (
    <Suspense fallback={<div>Yuklanmoqda...</div>}>
      <GoogleOAuthMockContent />
    </Suspense>
  );
}

// Styling aligned with Google login aesthetics and dark-mode compatibility
const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  background: "var(--cream, #FBF7F3)",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  padding: "20px"
};

const devAlertStyle = {
  background: "rgba(242, 89, 31, 0.08)",
  border: "1.5px solid var(--orange, #E06334)",
  borderRadius: 12,
  padding: "16px",
  width: "100%",
  maxWidth: 450,
  boxSizing: "border-box",
  marginBottom: 20,
};

const alertIconStyle = {
  fontSize: 20
};

const alertTitleStyle = {
  fontSize: 14,
  fontWeight: 700,
  color: "var(--orange, #E06334)",
  marginBottom: 6
};

const alertTextStyle = {
  fontSize: 12,
  lineHeight: 1.5,
  color: "var(--text2, #5F5E5A)"
};

const cardStyle = {
  background: "var(--card-bg, #ffffff)",
  border: "1.5px solid var(--sand, #ECE3D9)",
  borderRadius: 12,
  padding: "40px",
  width: "100%",
  maxWidth: 450,
  boxSizing: "border-box",
  textAlign: "center",
  boxShadow: "0 8px 24px rgba(0,0,0,0.03)"
};

const logoWrapperStyle = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 20
};

const titleStyle = {
  fontSize: 24,
  fontWeight: 400,
  color: "var(--ink, #1A130E)",
  margin: "0 0 8px 0"
};

const subtitleStyle = {
  fontSize: 15,
  color: "var(--text2, #5F5E5A)",
  margin: "0 0 28px 0",
  wordBreak: "break-all"
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  marginBottom: 28
};

const fieldStyle = {
  width: "100%"
};

const inputStyle = {
  width: "100%",
  padding: "16px",
  border: "1.5px solid var(--sand, #ECE3D9)",
  background: "var(--card-bg, #ffffff)",
  color: "var(--ink, #1A130E)",
  borderRadius: 8,
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
  color: "var(--orange, #E06334)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  padding: "8px 16px"
};

const submitBtnStyle = {
  background: "var(--orange, #E06334)",
  color: "#ffffff",
  border: "none",
  borderRadius: 8,
  padding: "12px 28px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(242,89,31,0.25)",
  transition: "all 0.2s"
};

const dividerStyle = {
  display: "flex",
  alignItems: "center",
  margin: "24px 0 16px",
  color: "var(--muted, #9B9286)"
};

const dividerTextStyle = {
  fontSize: 12,
  padding: "0 10px",
  width: "100%",
  textAlign: "center"
};

const quickListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  borderTop: "1px solid var(--sand, #ECE3D9)",
  paddingTop: 16
};

const quickBtnStyle = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "12px",
  background: "var(--cream, #FBF7F3)",
  border: "1px solid var(--sand, #ECE3D9)",
  borderRadius: 8,
  cursor: "pointer",
  transition: "background 0.2s, transform 0.1s",
  outline: "none",
  textAlign: "left"
};

const avatarStyle = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: "var(--orange-tint, #FDEAE2)",
  color: "var(--orange, #E06334)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  fontSize: 15,
  marginRight: 12
};

const textWrapperStyle = {
  flex: 1
};

const nameStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--ink, #1A130E)"
};

const emailStyle = {
  fontSize: 12,
  color: "var(--muted, #9B9286)"
};
