import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1da1ff 0%, #6366f1 100%)",
      }}
    >
      <span
        style={{
          fontSize: 280,
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "-0.05em",
          lineHeight: 1,
        }}
      >
        X
      </span>
    </div>,
    { width: 512, height: 512 },
  );
}
