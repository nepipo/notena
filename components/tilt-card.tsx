"use client";

import { useEffect } from "react";

const MAX_TILT = 11; // maximaler Neigungswinkel in Grad (kräftiger 3D-Effekt)

/**
 * Aktiviert den 3D-Tilt + Cursor-Lichtreflex für alle `.tilt-card`-Elemente
 * per Event-Delegation. Einmal irgendwo auf der Seite mounten.
 * Nur auf Maus-Zeigern aktiv; Touch & prefers-reduced-motion bleiben ruhig.
 */
export function TiltEffect() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let active: HTMLElement | null = null;
    let raf = 0;

    function reset(card: HTMLElement) {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--tilt", "0");
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(".tilt-card") ?? null;
      if (card !== active) {
        if (active) reset(active);
        active = card;
      }
      if (!card) return;
      const { clientX, clientY } = e;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const px = (clientX - r.left) / r.width; // 0..1
        const py = (clientY - r.top) / r.height; // 0..1
        card.style.setProperty("--ry", `${(px - 0.5) * (MAX_TILT * 2)}deg`);
        card.style.setProperty("--rx", `${(0.5 - py) * (MAX_TILT * 2)}deg`);
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
        card.style.setProperty("--tilt", "1");
      });
    }

    function onWindowLeave() {
      if (active) {
        reset(active);
        active = null;
      }
    }

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onWindowLeave);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onWindowLeave);
    };
  }, []);

  return null;
}
