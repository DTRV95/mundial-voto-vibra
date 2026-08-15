import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Revela um bloco quando ele entra no ecrã.
 *
 * A página de lançamento vive do scroll: cada funcionalidade deve
 * aparecer quando chega a vez dela, não estar toda desenhada à espera.
 * Quem tiver o sistema configurado para menos movimento vê tudo logo.
 */
export function Revelar({ children, atraso = 0, className = "" }: {
  children: ReactNode;
  /** Milissegundos a somar, para escalonar irmãos. */
  atraso?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const no = ref.current;
    if (!no) return;

    const menosMovimento =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (menosMovimento || typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return;
    }

    const observador = new IntersectionObserver(
      entradas => {
        for (const e of entradas) {
          // Só numa direção: uma vez revelado, fica revelado. Blocos a
          // desaparecerem quando se faz scroll para cima é irritante.
          if (e.isIntersecting) {
            setVisivel(true);
            observador.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    observador.observe(no);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className} ${
        visivel ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ transitionDelay: visivel ? `${atraso}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
