import { useEffect, useRef, useState } from "react";

/**
 * Anima um número de 0 até ao valor final, com desaceleração.
 * Usado nos pontos e estatísticas para dar satisfação visual.
 */
export function useCountUp(target: number, duration = 1100) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  const from = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !Number.isFinite(target)) { setValue(target); return; }

    const start = performance.now();
    const origin = from.current;
    const delta = target - origin;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // easeOutExpo
      setValue(Math.round(origin + delta * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else from.current = target;
    };

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return value;
}
