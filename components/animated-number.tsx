"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  decimals?: number;
  durationMs?: number;
  delayMs?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Zählt beim ersten Sichtbarwerden von 0 auf `value` hoch.
 * Deutsche Formatierung (Komma als Dezimaltrenner, Punkt als Tausender).
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  durationMs = 1600,
  delayMs = 200,
  className,
  style,
}: Props) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const run = () => {
      if (started.current) return;
      started.current = true;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        setDisplay(value);
        return;
      }

      const start = performance.now() + delayMs;
      const tick = (now: number) => {
        const t = Math.min(Math.max((now - start) / durationMs, 0), 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(value * eased);
        if (t < 1) requestAnimationFrame(tick);
        else setDisplay(value);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, durationMs, delayMs]);

  const formatted = display.toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className} style={style}>
      {formatted}
    </span>
  );
}
