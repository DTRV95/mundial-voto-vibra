/**
 * Atmosfera da Liga Portugal Betclic.
 * Base azul-marinho, setas angulares vermelhas à esquerda e verdes à direita,
 * riscos de luz azul na diagonal — como a identidade oficial da competição.
 */
export function LigaAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base azul-marinho */}
      <div className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, #0a1c3a 0%, #0d2247 38%, #0a1a38 62%, #071228 100%)",
        }} />

      {/* Trama diagonal muito subtil */}
      <div className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-52deg, transparent 0 26px, rgba(255,255,255,0.018) 26px 27px)",
        }} />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="lp-red" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF1B2D" />
            <stop offset="55%" stopColor="#E10014" />
            <stop offset="100%" stopColor="#82000A" />
          </linearGradient>
          <linearGradient id="lp-red-2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#BE000F" />
            <stop offset="100%" stopColor="#6d0009" />
          </linearGradient>
          <linearGradient id="lp-green" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4CE33F" />
            <stop offset="55%" stopColor="#19C24A" />
            <stop offset="100%" stopColor="#0c7a33" />
          </linearGradient>
          <linearGradient id="lp-green-2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2FA83B" />
            <stop offset="100%" stopColor="#0a5c28" />
          </linearGradient>
          <linearGradient id="lp-streak" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4aa8ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#7cc6ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#4aa8ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ── Setas vermelhas (esquerda) ── */}
        <g>
          <path d="M-40,-40 L210,-40 L60,180 L150,180 L-40,420 Z" fill="url(#lp-red)" />
          <path d="M150,-40 L300,-40 L150,175 L235,175 L60,420 Z" fill="url(#lp-red-2)" opacity="0.75" />
          <path d="M280,-40 L340,-40 L196,168 L262,168 L120,420 Z" fill="url(#lp-red-2)" opacity="0.35" />
        </g>

        {/* ── Setas verdes (direita) ── */}
        <g>
          <path d="M1240,440 L990,440 L1140,220 L1050,220 L1240,-20 Z" fill="url(#lp-green)" />
          <path d="M1050,440 L900,440 L1050,225 L965,225 L1140,-20 Z" fill="url(#lp-green-2)" opacity="0.72" />
          <path d="M920,440 L860,440 L1004,232 L938,232 L1080,-20 Z" fill="url(#lp-green-2)" opacity="0.32" />
        </g>

        {/* ── Riscos de luz azul ── */}
        <path d="M250,150 L620,-20" stroke="url(#lp-streak)" strokeWidth="2.4" fill="none" opacity="0.85" />
        <path d="M300,205 L470,120" stroke="url(#lp-streak)" strokeWidth="1.2" fill="none" opacity="0.6" />
        <path d="M700,330 L1010,180" stroke="url(#lp-streak)" strokeWidth="2.4" fill="none" opacity="0.8" />
        <path d="M760,362 L900,292" stroke="url(#lp-streak)" strokeWidth="1.1" fill="none" opacity="0.55" />
      </svg>

      {/* Brilho quente do lado vermelho */}
      <div className="absolute -left-16 top-1/3 h-64 w-64 rounded-full"
        style={{ background: "rgba(225,0,20,0.30)", filter: "blur(70px)" }} />
      {/* Brilho frio do lado verde */}
      <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full"
        style={{ background: "rgba(25,255,145,0.16)", filter: "blur(75px)" }} />

      {/* Vinheta */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 120% 100% at 50% 45%, transparent 45%, rgba(3,8,20,0.5) 100%)" }} />
    </div>
  );
}
