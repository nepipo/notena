import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Project X — Dein Schul-Cockpit",
    short_name: "Project X",
    description:
      "Notenrechner, Klausuren-Tracking und KI-Briefing für ambitionierte Oberstufen-Schüler.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#1da1ff",
    orientation: "portrait",
    icons: [
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
