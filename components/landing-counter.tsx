"use client";

import { useEffect, useRef, useState } from "react";

export function LandingCounter({ to }: { to: number }) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const duration = 1600;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * to).toFixed(1)));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [to]);

  const [int, dec] = value.toFixed(1).split(".");
  return (
    <span>
      {int}
      <span style={{ color: "var(--brand)" }}>.</span>
      {dec}
    </span>
  );
}
