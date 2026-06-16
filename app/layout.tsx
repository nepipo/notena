import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Onest, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

type Theme = "dark" | "light" | "system";
type AccentColor = "blue" | "violet" | "pink" | "green" | "orange" | "red" | "teal" | "indigo";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Project X — Dein Schul-Cockpit",
  description:
    "Notenrechner, Klausuren-Tracking und tägliches KI-Briefing für ambitionierte Oberstufen-Schüler.",
  metadataBase: new URL("https://project-x-seven-tawny.vercel.app"),
  openGraph: {
    title: "Project X — Dein Schul-Cockpit",
    description:
      "Notenrechner, Klausuren-Tracking und tägliches KI-Briefing für ambitionierte Oberstufen-Schüler.",
    type: "website",
    locale: "de_DE",
    url: "https://project-x-seven-tawny.vercel.app",
    siteName: "Project X",
  },
  twitter: {
    card: "summary",
    title: "Project X — Dein Schul-Cockpit",
    description:
      "Notenrechner, Klausuren-Tracking und tägliches KI-Briefing für ambitionierte Oberstufen-Schüler.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Project X",
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
  const theme = (store.get("project-x-theme")?.value ?? "dark") as Theme;
  const accent = (store.get("project-x-accent")?.value ?? "blue") as AccentColor;
  // SSR: "system" → "dark" (Script korrigiert das sofort clientseitig)
  const ssrDark = theme !== "light";

  return (
    <html
      lang="de"
      data-accent={accent}
      className={`${ssrDark ? "dark" : ""} ${bricolage.variable} ${onest.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* FOUC-Prävention: Theme + Akzent vor erstem Paint setzen */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var c=document.cookie.match(/project-x-theme=([^;]+)/);var t=c?c[1]:"dark";if(t==="system"){t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";}if(t==="light"){document.documentElement.classList.remove("dark");}else{document.documentElement.classList.add("dark");}var a=document.cookie.match(/project-x-accent=([^;]+)/);document.documentElement.setAttribute("data-accent",a?a[1]:"blue");})();` }} />
      </head>
      <body className="min-h-full">
        {children}
        <Toaster theme={theme === "light" ? "light" : "dark"} position="top-center" richColors />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
