import "./globals.css";
import MobileNav from "@/components/MobileNav";
import AlertProvider from "@/components/AlertProvider";

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
    <html lang="uz">
      <head>
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
              })();
            `
          }}
        />
      </head>
      <body>
        <AlertProvider>
          <div className="page-wrap">
            {children}
          </div>
          <MobileNav />
        </AlertProvider>
      </body>
    </html>
  );
}
