/**
 * Atmosfera da UEFA Champions League — "Kick of Light".
 * Estrela de cristal facetada, luzes de estádio, reflexos e partículas.
 * Tudo em SVG/CSS: nítido em qualquer ecrã e leve.
 */
export function ChampionsAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Fundo: noite profunda com halo central */}
      <div className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 90% at 50% 62%, #16305c 0%, #0d1c38 42%, #060d1e 78%, #04091a 100%)",
        }} />

      {/* Arco de luzes do estádio */}
      <div className="absolute inset-x-0 bottom-0 h-[62%]">
        <svg viewBox="0 0 1200 400" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="ucl-stand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d3a6b" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#060d1e" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="ucl-lamp">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="35%" stopColor="#bcd8ff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#7fb0ff" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Bancada curva */}
          <path d="M0,300 Q600,120 1200,300 L1200,400 L0,400 Z" fill="url(#ucl-stand)" />
          {/* Fila de lâmpadas ao longo da curva */}
          {Array.from({ length: 26 }).map((_, i) => {
            const t = i / 25;
            const x = t * 1200;
            const y = 300 - Math.sin(Math.PI * t) * 180;
            return <circle key={i} cx={x} cy={y} r="11" fill="url(#ucl-lamp)" opacity={0.22 + 0.38 * Math.sin(Math.PI * t)} />;
          })}
        </svg>
      </div>

      {/* Estrela de cristal facetada */}
      <svg
        className="absolute right-[-6%] top-1/2 h-[190%] w-[86%] -translate-y-1/2 opacity-[0.42] sm:right-[2%] sm:w-[52%] md:right-[6%] md:w-[38%]"
        viewBox="0 0 200 200" fill="none">
        <defs>
          <linearGradient id="facet-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dceaff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#5f9be0" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="facet-b" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9fc6ff" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#12274a" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="facet-c" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#2b4d84" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Metades de cada ponta — cria o efeito facetado de vidro */}
        <g>
          {/* pontas: cima, direita, baixo-dir, baixo-esq, esquerda */}
          <path d="M100 18 L118 78 L100 92 Z" fill="url(#facet-a)" />
          <path d="M100 18 L82 78 L100 92 Z" fill="url(#facet-b)" />

          <path d="M180 76 L124 88 L114 106 Z" fill="url(#facet-a)" />
          <path d="M180 76 L128 118 L114 106 Z" fill="url(#facet-c)" />

          <path d="M149 170 L112 122 L96 128 Z" fill="url(#facet-b)" />
          <path d="M149 170 L104 140 L96 128 Z" fill="url(#facet-a)" />

          <path d="M51 170 L88 122 L104 128 Z" fill="url(#facet-c)" />
          <path d="M51 170 L96 140 L104 128 Z" fill="url(#facet-b)" />

          <path d="M20 76 L76 88 L86 106 Z" fill="url(#facet-b)" />
          <path d="M20 76 L72 118 L86 106 Z" fill="url(#facet-a)" />

          {/* núcleo pentagonal */}
          <path d="M100 92 L114 106 L104 128 L96 128 L86 106 Z" fill="url(#facet-c)" opacity="0.8" />
        </g>
        {/* Arestas iluminadas */}
        <path
          d="M100 18 L118 78 L180 76 L128 118 L149 170 L100 140 L51 170 L72 118 L20 76 L82 78 Z"
          stroke="#cfe4ff" strokeOpacity="0.55" strokeWidth="0.7" fill="none" strokeLinejoin="round" />
      </svg>

      {/* Reflexo em estrela no topo da ponta */}
      <div className="absolute right-[22%] top-[8%] h-24 w-24 -translate-y-1/2 sm:right-[24%] md:right-[22%]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(190,220,255,0.35) 18%, transparent 60%)",
        }} />
      <div className="absolute right-[13%] top-[8%] h-[2px] w-52 -translate-y-1/2 sm:right-[15%] md:right-[13%]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(220,238,255,0.85), transparent)" }} />
      <div className="absolute right-[26%] top-[8%] h-28 w-[2px] -translate-y-1/2 sm:right-[28%] md:right-[26%]"
        style={{ background: "linear-gradient(180deg, transparent, rgba(220,238,255,0.7), transparent)" }} />

      {/* Partículas de luz suspensas */}
      {[
        { l: "12%", t: "22%", s: 7, o: 0.22 }, { l: "78%", t: "16%", s: 5, o: 0.28 },
        { l: "88%", t: "44%", s: 9, o: 0.16 }, { l: "22%", t: "58%", s: 6, o: 0.2 },
        { l: "64%", t: "70%", s: 4, o: 0.3 }, { l: "36%", t: "12%", s: 4, o: 0.24 },
        { l: "6%",  t: "70%", s: 8, o: 0.14 }, { l: "94%", t: "66%", s: 5, o: 0.2 },
      ].map((p, i) => (
        <span key={i} className="absolute rounded-full"
          style={{
            left: p.l, top: p.t, width: p.s, height: p.s,
            background: "radial-gradient(circle, #eaf4ff, rgba(160,200,255,0))",
            opacity: p.o,
            animation: `twinkle ${5 + (i % 4)}s ease-in-out ${i * 0.6}s infinite`,
          }} />
      ))}

      {/* Vinheta final */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 120% 95% at 50% 45%, transparent 40%, rgba(2,6,16,0.55) 100%)" }} />
    </div>
  );
}
