import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Project X — Dein Schul-Cockpit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CARDS = [
  { fach: "Mathe LK", punkte: "13", color: "#1da1ff" },
  { fach: "Englisch", punkte: "11", color: "#e5e5e5" },
  { fach: "Physik", punkte: "12", color: "#6366f1" },
];

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      },
    ).then((r) => r.text());
    const url = css.match(/url\(([^)]+)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OgImage() {
  const fontData = await loadFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#090909",
          display: "flex",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow blob oben-links */}
        <div
          style={{
            position: "absolute",
            top: "-180px",
            left: "-80px",
            width: "680px",
            height: "680px",
            borderRadius: "50%",
            background: "rgba(29,161,255,0.13)",
            display: "flex",
          }}
        />

        {/* Glow blob unten-rechts */}
        <div
          style={{
            position: "absolute",
            bottom: "-200px",
            right: "200px",
            width: "450px",
            height: "450px",
            borderRadius: "50%",
            background: "rgba(99,102,241,0.09)",
            display: "flex",
          }}
        />

        {/* Linke Spalte: Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "72px 60px 72px 80px",
            flex: 1,
            zIndex: 1,
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#22c55e",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "13px",
                color: "#1da1ff",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              PROJECT X · GESCHLOSSENE BETA
            </span>
          </div>

          {/* Große Zahl */}
          <div
            style={{
              fontSize: "160px",
              fontWeight: 800,
              color: "#1da1ff",
              lineHeight: 1,
              letterSpacing: "-8px",
              fontFamily: fontData ? "Bricolage" : "sans-serif",
              marginBottom: "6px",
            }}
          >
            12.4
          </div>

          {/* Sub-Label */}
          <div
            style={{
              fontSize: "12px",
              color: "#555",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: "36px",
            }}
          >
            DEIN SCHNITT · LIVE
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#d4d4d4",
              lineHeight: 1.45,
              maxWidth: "500px",
              fontFamily: fontData ? "Bricolage" : "sans-serif",
            }}
          >
            Notenrechner, Klausuren-Tracking und KI-Briefing für ambitionierte
            Oberstufen-Schüler.
          </div>
        </div>

        {/* Rechte Spalte: Karten-Stack */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "14px",
            padding: "72px 80px 72px 0",
            zIndex: 1,
          }}
        >
          {CARDS.map(({ fach, punkte, color }) => (
            <div
              key={fach}
              style={{
                background: "#141414",
                border: "1px solid rgba(29,161,255,0.2)",
                borderRadius: "20px",
                padding: "22px 30px",
                display: "flex",
                flexDirection: "column",
                width: "172px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  color: "#555",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                {fach}
              </span>
              <span
                style={{
                  fontSize: "52px",
                  fontWeight: 800,
                  color,
                  lineHeight: 1,
                  marginTop: "6px",
                  fontFamily: fontData ? "Bricolage" : "sans-serif",
                }}
              >
                {punkte}
              </span>
              <span style={{ fontSize: "10px", color: "#444", marginTop: "4px" }}>
                Punkte
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Bricolage", data: fontData, style: "normal", weight: 800 }]
        : [],
    },
  );
}
