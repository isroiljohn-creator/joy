import "./globals.css";
import "leaflet/dist/leaflet.css";
import MobileNav from "@/components/MobileNav";
import AlertProvider from "@/components/AlertProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import FloatingChat from "@/components/FloatingChat";
import Script from "next/script";

export const metadata = {
  title: "Joy — Ko'chmas mulk platformasi",
  description: "Joyingizni Joydan toping. O'zbekiston bo'ylab uylar, kvartiralar, ofislar — sotib oling, ijaraga oling yoki soting.",
  keywords: ["ko'chmas mulk", "uy sotish", "kvartira", "ijara", "Toshkent", "Joy", "O'zbekiston"],
  authors: [{ name: "Joy.uz" }],
  openGraph: {
    title: "Joy — Ko'chmas mulk platformasi",
    description: "Joyingizni Joydan toping. O'zbekiston bo'ylab 12 000+ e'lon.",
    url: "https://joy.uz",
    siteName: "Joy",
    locale: "uz_UZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Joy — Ko'chmas mulk platformasi",
    description: "Joyingizni Joydan toping. O'zbekiston bo'ylab 12 000+ e'lon.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function logError(details) {
                  details.ua = navigator.userAgent;
                  try {
                    fetch("/api/log-error", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(details),
                      keepalive: true
                    });
                  } catch (e) {}
                }

                window.onerror = function(message, url, line, col, error) {
                  logError({
                    message: message,
                    url: url,
                    line: line,
                    col: col,
                    stack: error ? error.stack : ""
                  });
                  return false;
                };

                window.onunhandledrejection = function(e) {
                  logError({
                    message: e.reason ? (e.reason.message || String(e.reason)) : "Unhandled rejection",
                    url: window.location.href,
                    line: 0,
                    col: 0,
                    stack: e.reason ? (e.reason.stack || "") : ""
                  });
                };

                // Catch script load errors
                window.addEventListener("error", function(e) {
                  if (e.target && (e.target.tagName === "SCRIPT" || e.target.tagName === "LINK")) {
                    logError({
                      message: "Failed to load resource: " + (e.target.src || e.target.href),
                      url: window.location.href,
                      line: 0,
                      col: 0,
                      stack: ""
                    });
                  }
                }, true);
              })();
            `
          }}
        />
        <meta name="theme-color" content="#F2591F" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.7.0/dist/tabler-icons.min.css"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem("joy-theme");
                  if (saved === "dark") {
                    document.documentElement.setAttribute("data-theme", "dark");
                  } else {
                    document.documentElement.removeAttribute("data-theme");
                  }
                } catch (e) {}

                // Premium haptic feedback click listener
                try {
                  document.addEventListener("click", function(e) {
                    const target = e.target.closest("button, .btn, .cbtn, [role='button'], .dashboard-tab, .star-btn, .mobile-nav-item, .theme-toggle, .floating-chat-btn, .avatar, .editp, .mdbtn");
                    if (target && navigator && navigator.vibrate) {
                      navigator.vibrate(10);
                    }
                  }, { passive: true });
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body>
        <ErrorBoundary>
          <AlertProvider>
            <div className="page-wrap">
              {children}
            </div>
            <FloatingChat />
            <MobileNav />
          </AlertProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
