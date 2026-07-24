import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Clock, TrendingUp, TrendingDown, Minus, Trophy, ArrowRight, Flame } from "lucide-react";
import { GOLD, type CompetitionTheme } from "@/lib/competitionTheme";
import { useCompetitions, type Competition } from "@/lib/useCompetitions";

export const Route = createFileRoute("/preview")({
  head: () => ({ meta: [{ title: "Preview · Época 2026/27" }] }),
  component: Preview,
});

function Preview() {
  const { data: competitions = [], isLoading } = useCompetitions();
  const [comp, setComp] = useState<Competition | null>(null);

  // Escolhe a primeira competição assim que os dados chegam da BD
  useEffect(() => {
    if (!comp && competitions.length > 0) setComp(competitions[0]);
  }, [competitions, comp]);

  if (isLoading || !comp) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] px-5 pt-10">
        <div className="mx-auto max-w-2xl space-y-3">
          <div className="h-8 w-48 shimmer rounded-lg" />
          <div className="h-64 shimmer rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20"
      style={{
        // @ts-expect-error CSS custom properties
        "--accent": comp.accent,
        "--accent-bright": comp.accentBright,
        "--accent-glow": comp.glow,
        background: "#0a0b0f",
      }}
    >
      {/* Aviso de preview */}
      <div className="border-b border-white/10 bg-white/[0.03] px-5 py-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
          Preview · Nova identidade · Época 2026/27
        </p>
      </div>

      {/* Seletor de competição */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0b0f]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-5 py-3">
          {competitions.map((c) => {
            const active = c.slug === comp.slug;
            return (
              <button
                key={c.slug}
                onClick={() => setComp(c)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-300"
                style={{
                  borderColor: active ? c.accent : "rgba(255,255,255,0.12)",
                  background: active ? `color-mix(in oklch, ${c.accent} 18%, transparent)` : "transparent",
                  color: active ? c.accentBright : "rgba(255,255,255,0.5)",
                }}
              >
                <span>{c.badge}</span>
                {c.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* HERO */}
      <section className="relative mx-auto max-w-2xl px-5 pt-6">
        <div
          className="relative overflow-hidden rounded-3xl border transition-all duration-500"
          style={{
            borderColor: `color-mix(in oklch, ${comp.accent} 35%, transparent)`,
            background: comp.heroGradient,
            boxShadow: `0 20px 60px ${comp.glow}`,
          }}
        >
          {/* Textura de linhas de campo */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "100% 46px",
            }}
          />
          {/* Halo */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
            style={{ background: comp.glow, filter: "blur(60px)" }}
          />

          <div className="relative px-6 py-7">
            {/* Marca — o "7" mantém-se */}
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg font-display text-lg"
                style={{ background: comp.accent, color: "#0a0b0f" }}
              >
                7
              </span>
              <div className="leading-none">
                <p className="font-display text-base tracking-wide text-white">GERAÇÃO</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: comp.accentBright }}>
                  {comp.name}
                </p>
              </div>
            </div>

            {/* Chip de jornada */}
            <div className="mt-6">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{
                  borderColor: `color-mix(in oklch, ${comp.accent} 40%, transparent)`,
                  color: comp.accentBright,
                }}
              >
                Jornada 8 · A decorrer
              </span>
            </div>

            <h1 className="mt-3 font-display leading-[0.95] text-white" style={{ fontSize: "clamp(2.4rem, 8vw, 3.6rem)" }}>
              O TEU PALPITE<br />VALE PONTOS
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-snug text-white/60">
              Prevê cada jogo da {comp.name}, cria torneios com os teus amigos e sobe no ranking, jornada após jornada.
            </p>

            {/* Stats — só o troféu/pontos em dourado */}
            <div className="mt-5 flex items-stretch gap-3">
              <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="font-display text-2xl leading-none" style={{ color: GOLD.base }}>247</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">Os teus pontos</p>
              </div>
              <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="font-display text-2xl leading-none text-white">#12º</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">no mês</p>
              </div>
              <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="font-display text-2xl leading-none text-white">1ª</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">Divisão</p>
              </div>
            </div>

            <button
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.03]"
              style={{ background: comp.accent, color: "#0a0b0f", boxShadow: `0 6px 20px ${comp.glow}` }}
            >
              Votar na jornada <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* JOGOS */}
      <section className="mx-auto mt-8 max-w-2xl px-5">
        <SectionTitle accent={comp.accent}>Jornada 8</SectionTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MatchCardNew comp={comp} home="Benfica" homeFlag="🦅" away="Porto" awayFlag="🐉" time="20:30" voted />
          <MatchCardNew comp={comp} home="Sporting" homeFlag="🦁" away="Braga" awayFlag="🔴" time="18:00" />
        </div>
      </section>

      {/* RANKING */}
      <section className="mx-auto mt-8 max-w-2xl px-5">
        <SectionTitle accent={comp.accent}>Ranking do mês</SectionTitle>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: `color-mix(in oklch, ${comp.accent} 10%, transparent)` }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: comp.accentBright }}>
              🔥 Novembro · 11 dias restantes
            </p>
            <span className="text-[11px] text-white/40">1ª Divisão</span>
          </div>
          {[
            { pos: 1, name: "Miguel Sousa", pts: 312, move: "up", div: true },
            { pos: 2, name: "Ana Ferreira", pts: 298, move: "up" },
            { pos: 3, name: "Rui Tavares", pts: 291, move: "down" },
            { pos: 12, name: "Tu", pts: 247, move: "same", me: true },
            { pos: 13, name: "João Dias", pts: 244, move: "down" },
          ].map((r, i, arr) => (
            <div key={r.pos}>
              {i > 0 && arr[i - 1].pos !== r.pos - 1 && (
                <div className="flex items-center gap-2 px-4 py-1">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[9px] text-white/20">···</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
              )}
              <div
                className="flex items-center gap-3 px-4 py-2.5"
                style={r.me ? { background: `color-mix(in oklch, ${comp.accent} 12%, transparent)` } : {}}
              >
                <span className="w-6 text-center font-display text-lg" style={{ color: r.pos <= 3 ? GOLD.base : "rgba(255,255,255,0.4)" }}>
                  {r.pos}
                </span>
                <span className={`flex-1 truncate text-sm ${r.me ? "font-bold" : "font-medium"}`}
                  style={{ color: r.me ? comp.accentBright : "white" }}>
                  {r.name}
                </span>
                {r.move === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
                {r.move === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                {r.move === "same" && <Minus className="h-3.5 w-3.5 text-white/30" />}
                <span className="w-12 text-right font-display text-base" style={{ color: GOLD.base }}>{r.pts}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Nota do sistema */}
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
          <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: GOLD.base }} />
          <p className="text-[11px] leading-relaxed text-white/50">
            Todos os meses, nova corrida. O <span style={{ color: GOLD.base }}>campeão do mês</span> ganha o seu lugar na história — e sobe de divisão.
          </p>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-4 w-1 rounded-full" style={{ background: accent }} />
      <h2 className="font-display text-xl tracking-wide text-white">{children}</h2>
    </div>
  );
}

function MatchCardNew({
  comp, home, homeFlag, away, awayFlag, time, voted,
}: {
  comp: CompetitionTheme; home: string; homeFlag: string; away: string; awayFlag: string; time: string; voted?: boolean;
}) {
  return (
    <div
      className="group overflow-hidden rounded-2xl border bg-white/[0.02] transition-all duration-300 hover:-translate-y-0.5"
      style={{ borderColor: voted ? `color-mix(in oklch, ${comp.accent} 30%, transparent)` : "rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: comp.accentBright }}>
          {comp.short}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-white/40">
          <Clock className="h-3 w-3" /> {time}
        </span>
      </div>
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-2xl">{homeFlag}</span>
          <span className="text-xs font-bold text-white">{home}</span>
        </div>
        <span className="px-2 font-display text-sm text-white/30">VS</span>
        <div className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-2xl">{awayFlag}</span>
          <span className="text-xs font-bold text-white">{away}</span>
        </div>
      </div>
      <div
        className="flex items-center justify-between px-4 py-2.5 text-xs font-bold"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: voted ? `color-mix(in oklch, ${comp.accent} 8%, transparent)` : "transparent",
        }}
      >
        {voted ? (
          <>
            <span className="flex items-center gap-1.5" style={{ color: comp.accentBright }}>
              <Flame className="h-3.5 w-3.5" /> Previsão feita
            </span>
            <span className="text-white/40">Ver comunidade →</span>
          </>
        ) : (
          <>
            <span className="text-white/40">1.240 previsões</span>
            <span style={{ color: comp.accentBright }}>Dar previsão →</span>
          </>
        )}
      </div>
    </div>
  );
}
