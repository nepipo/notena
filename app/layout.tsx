import type { Metadata, Viewport } from "next";
import { Manrope, Inter, Oswald } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

type Theme = "dark" | "light";
type AccentColor = "blue" | "violet" | "pink" | "green" | "mint" | "orange" | "red" | "teal" | "indigo" | "mono";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Notena — Dein Schul-Cockpit",
  description:
    "Notenrechner, Klausuren-Tracking und tägliches KI-Briefing für ambitionierte Oberstufen-Schüler.",
  metadataBase: new URL("https://notena.app"),
  openGraph: {
    title: "Notena — Dein Schul-Cockpit",
    description:
      "Notenrechner, Klausuren-Tracking und tägliches KI-Briefing für ambitionierte Oberstufen-Schüler.",
    type: "website",
    locale: "de_DE",
    url: "https://notena.app",
    siteName: "Notena",
  },
  twitter: {
    card: "summary",
    title: "Notena — Dein Schul-Cockpit",
    description:
      "Notenrechner, Klausuren-Tracking und tägliches KI-Briefing für ambitionierte Oberstufen-Schüler.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Notena",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1da1ff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await cookies();
  const theme = (store.get("notena-theme")?.value ?? "dark") as Theme;
  const accent = (store.get("notena-accent")?.value ?? "mono") as AccentColor;
  const ssrDark = theme !== "light";

  return (
    <html
      lang="de"
      data-accent={accent}
      className={`${ssrDark ? "dark" : ""} ${manrope.variable} ${inter.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* FOUC-Prävention: Theme + Akzent vor erstem Paint setzen */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: `(function(){var d=document.documentElement;var c=document.cookie.match(/notena-theme=([^;]+)/);var t=c?c[1]:"dark";if(t==="light"){d.classList.remove("dark");}else{d.classList.add("dark");}var a=document.cookie.match(/notena-accent=([^;]+)/);d.setAttribute("data-accent",a?a[1]:"mono");})();` }}
        />
        {children}
        <Toaster theme={theme === "light" ? "light" : "dark"} position="top-center" richColors />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
