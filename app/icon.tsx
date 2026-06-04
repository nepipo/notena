import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        borderRadius: 48,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 128,
          height: 128,
          borderRadius: 32,
          background: "linear-gradient(135deg, #1da1ff 0%, #6366f1 100%)",
        }}
      >
        <span
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          X
        </span>
      </div>
    </div>,
    { ...size },
  );
}
