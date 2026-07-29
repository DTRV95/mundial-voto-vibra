import type { Competition } from "@/lib/useCompetitions";

/**
 * O fundo da página veste-se da competição activa.
 *
 * Nasceu na homepage e estava lá preso. Agora é partilhado, para que
 * trocar de competição mude o mundo em todo o site — e não só num sítio.
 */
export function CompetitionAtmosphere({ comp }: { comp: Competition | null | undefined }) {
  if (!comp) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden
      style={{ transition: "opacity 500ms ease" }}>
      {/* Manto de cor descendo do topo */}
      <div className="absolute inset-x-0 top-0 h-[70vh]"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${comp.accent} 26%, transparent) 0%, color-mix(in srgb, ${comp.accent} 10%, transparent) 38%, transparent 100%)`,
          transition: "background 500ms ease",
        }} />

      {/* Halos laterais profundos */}
      <div className="absolute -left-[15%] top-[6%] h-[46vh] w-[65vw] rounded-full"
        style={{ background: comp.glow, filter: "blur(90px)", opacity: 0.55, transition: "background 500ms ease" }} />
      <div className="absolute -right-[18%] top-[26%] h-[40vh] w-[55vw] rounded-full"
        style={{ background: `color-mix(in srgb, ${comp.electric} 22%, transparent)`, filter: "blur(100px)", opacity: 0.5, transition: "background 500ms ease" }} />

      {/* Textura característica da competição */}
      {comp.motif === "stars"
        ? <div className="motif-stars absolute inset-x-0 top-0 h-[75vh] opacity-60" />
        : <div className="motif-speed absolute inset-x-0 top-0 h-[60vh] opacity-40" />}

      {/* Brilho de base */}
      <div className="absolute inset-x-0 bottom-0 h-[35vh]"
        style={{ background: `linear-gradient(0deg, color-mix(in srgb, ${comp.deep} 12%, transparent) 0%, transparent 100%)`, transition: "background 500ms ease" }} />
    </div>
  );
}

/**
 * Cabeçalho de página que assume a cor da competição.
 * O fio por baixo do título é o que dá o toque de identidade sem gritar.
 */
export function PageHeader({ eyebrow, title, subtitle, comp, acao }: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  comp?: Competition | null;
  acao?: React.ReactNode;
}) {
  const cor = comp?.accent ?? "var(--gold)";

  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: cor, transition: "color 400ms ease" }}>
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl leading-none md:text-4xl">{title}</h1>
        <div className="mt-2 h-[3px] w-14 rounded-full"
          style={{
            background: comp
              ? `linear-gradient(90deg, ${comp.accent}, ${comp.electric})`
              : "linear-gradient(90deg, var(--gold), transparent)",
            transition: "background 500ms ease",
          }} />
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </header>
  );
}

/**
 * Selectores de competição, com a cor de cada uma.
 * Estava copiado em quatro páginas, cada uma ligeiramente diferente.
 */
export function CompetitionPicker({ competitions, activeId, onPick, extra }: {
  competitions: Competition[];
  activeId: string | null | undefined;
  onPick: (slug: string) => void;
  /** Botão adicional à esquerda, ex.: "Total" nos rankings */
  extra?: { label: string; active: boolean; onClick: () => void };
}) {
  if (competitions.length === 0) return null;

  return (
    <div className="-mx-4 mb-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="flex w-max gap-2">
        {extra && (
          <button onClick={extra.onClick}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition-smooth ${
              extra.active
                ? "border-gold bg-gold text-background shadow-gold"
                : "border-border text-muted-foreground hover:border-gold/40"
            }`}>
            {extra.label}
          </button>
        )}
        {competitions.map(c => {
          const on = c.id === activeId;
          return (
            <button key={c.id} onClick={() => onPick(c.slug)}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition-smooth"
              style={on
                ? { borderColor: c.accent, background: c.accent, color: "#fff", boxShadow: `0 4px 18px ${c.glow}` }
                : { borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              <span>{c.emoji}</span>{c.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
