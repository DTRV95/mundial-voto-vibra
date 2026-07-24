import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Clock, TrendingUp, TrendingDown, Minus, Trophy, ArrowRight, Flame,
  Home, CalendarDays, Medal, User, Users, Check, ChevronRight, Star, Crown, Target,
} from "lucide-react";
import { GOLD, COMPETITIONS, type CompetitionTheme } from "@/lib/competitionTheme";
import { useCompetitions, type Competition } from "@/lib/useCompetitions";

export const Route = createFileRoute("/preview")({
  head: () => ({ meta: [{ title: "Preview · Época 2026/27" }] }),
  component: Preview,
});

const FALLBACK: Competition[] = COMPETITIONS.map((c) => ({
  ...c, id: c.slug, format: "liga", status: "upcoming", season: "2026/27",
}));

type Page = "home" | "jogos" | "jogo" | "ranking" | "perfil";
const PAGES: { key: Page; label: string; icon: React.ElementType }[] = [
  { key: "home", label: "Início", icon: Home },
  { key: "jogos", label: "Jogos", icon: CalendarDays },
  { key: "jogo", label: "Votar", icon: Target },
  { key: "ranking", label: "Ranking", icon: Medal },
  { key: "perfil", label: "Perfil", icon: User },
];

function Preview() {
  const { data: dbCompetitions = [] } = useCompetitions();
  const competitions = dbCompetitions.length > 0 ? dbCompetitions : FALLBACK;
  const [comp, setComp] = useState<Competition | null>(null);
  const [page, setPage] = useState<Page>("home");

  useEffect(() => {
    if (!comp && competitions.length > 0) setComp(competitions[0]);
  }, [competitions, comp]);

  if (!comp) {
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
      className="min-h-screen pb-24"
      style={{
        // @ts-expect-error CSS custom properties
        "--accent": comp.accent, "--accent-bright": comp.accentBright, "--accent-glow": comp.glow,
        background: "#0a0b0f",
      }}
    >
      {/* Aviso preview */}
      <div className="border-b border-white/10 bg-white/[0.03] px-5 py-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
          Preview · Nova identidade · Época 2026/27
        </p>
      </div>

      {/* Seletor de competição */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0b0f]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-5 py-3">
          {competitions.map((c) => {
            const active = c.slug === comp.slug;
            return (
              <button key={c.slug} onClick={() => setComp(c)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-300"
                style={{
                  borderColor: active ? c.accent : "rgba(255,255,255,0.12)",
                  background: active ? `color-mix(in oklch, ${c.accent} 18%, transparent)` : "transparent",
                  color: active ? c.accentBright : "rgba(255,255,255,0.5)",
                }}>
                <span>{c.badge}</span>{c.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Página ativa */}
      <div className="mx-auto max-w-2xl px-5">
        {page === "home" && <PageHome comp={comp} />}
        {page === "jogos" && <PageJogos comp={comp} />}
        {page === "jogo" && <PageJogo comp={comp} />}
        {page === "ranking" && <PageRanking comp={comp} />}
        {page === "perfil" && <PagePerfil comp={comp} />}
      </div>

      {/* Barra de navegação inferior (demo) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0a0b0f]/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
          {PAGES.map((p) => {
            const active = p.key === page;
            const Icon = p.icon;
            return (
              <button key={p.key} onClick={() => setPage(p.key)}
                className="flex flex-1 flex-col items-center gap-0.5 py-1 transition-colors"
                style={{ color: active ? comp.accentBright : "rgba(255,255,255,0.4)" }}>
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                <span className="text-[10px] font-semibold">{p.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* ─────────────────────────── Primitivas ─────────────────────────── */

function Brand({ comp }: { comp: CompetitionTheme }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg font-display text-lg" style={{ background: comp.accent, color: "#0a0b0f" }}>7</span>
      <div className="leading-none">
        <p className="font-display text-base tracking-wide text-white">GERAÇÃO</p>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: comp.accentBright }}>{comp.name}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children, accent, right }: { children: React.ReactNode; accent: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="h-4 w-1 rounded-full" style={{ background: accent }} />
        <h2 className="font-display text-xl tracking-wide text-white">{children}</h2>
      </div>
      {right}
    </div>
  );
}

function Chip({ comp, children }: { comp: CompetitionTheme; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
      style={{ borderColor: `color-mix(in oklch, ${comp.accent} 40%, transparent)`, color: comp.accentBright }}>
      {children}
    </span>
  );
}

function Team({ flag, name, size = "md" }: { flag: string; name: string; size?: "sm" | "md" }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <span className={size === "md" ? "text-2xl" : "text-xl"}>{flag}</span>
      <span className="text-center text-xs font-bold text-white">{name}</span>
    </div>
  );
}

/* ─────────────────────────── HOME ─────────────────────────── */

function PageHome({ comp }: { comp: CompetitionTheme }) {
  return (
    <div className="pt-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border transition-all duration-500"
        style={{ borderColor: `color-mix(in oklch, ${comp.accent} 35%, transparent)`, background: comp.heroGradient, boxShadow: `0 20px 60px ${comp.glow}` }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "100% 46px" }} />
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full" style={{ background: comp.glow, filter: "blur(60px)" }} />
        <div className="relative px-6 py-7">
          <Brand comp={comp} />
          <div className="mt-6"><Chip comp={comp}>Jornada 8 · A decorrer</Chip></div>
          <h1 className="mt-3 font-display leading-[0.95] text-white" style={{ fontSize: "clamp(2.4rem, 8vw, 3.6rem)" }}>O TEU PALPITE<br />VALE PONTOS</h1>
          <p className="mt-2 max-w-sm text-sm leading-snug text-white/60">Prevê cada jogo da {comp.name}, cria torneios com os teus amigos e sobe no ranking, jornada após jornada.</p>
          <div className="mt-5 flex items-stretch gap-3">
            <HeroStat value="247" label="Os teus pontos" gold />
            <HeroStat value="#12º" label="no mês" />
            <HeroStat value="1ª" label="Divisão" />
          </div>
          <button className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.03]" style={{ background: comp.accent, color: "#0a0b0f", boxShadow: `0 6px 20px ${comp.glow}` }}>
            Votar na jornada <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Jogos por votar */}
      <div className="mt-8"><SectionTitle accent={comp.accent} right={<span className="text-xs text-white/40">Jornada 8</span>}>Por votar</SectionTitle></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MatchCard comp={comp} home="Benfica" hf="🦅" away="Porto" af="🐉" time="20:30" />
        <MatchCard comp={comp} home="Sporting" hf="🦁" away="Braga" af="🔴" time="18:00" voted />
      </div>

      {/* Ranking snippet */}
      <div className="mt-8"><SectionTitle accent={comp.accent} right={<span className="text-xs" style={{ color: comp.accentBright }}>Ver tudo →</span>}>Ranking do mês</SectionTitle></div>
      <div className="mt-4"><RankingList comp={comp} compact /></div>

      {/* Torneios teaser */}
      <div className="mt-8"><SectionTitle accent={comp.accent}>Os teus torneios</SectionTitle></div>
      <div className="mt-4 space-y-3">
        <TournamentRow comp={comp} name="Os do Costume" members={8} prize="🍺 Grade de cerveja" pos={2} />
        <TournamentRow comp={comp} name="Malta do Trabalho" members={14} prize="🍽️ Jantar" pos={1} />
      </div>
    </div>
  );
}

function HeroStat({ value, label, gold }: { value: string; label: string; gold?: boolean }) {
  return (
    <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="font-display text-2xl leading-none" style={{ color: gold ? GOLD.base : "white" }}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{label}</p>
    </div>
  );
}

/* ─────────────────────────── JOGOS ─────────────────────────── */

function PageJogos({ comp }: { comp: CompetitionTheme }) {
  const [jornada, setJornada] = useState(8);
  return (
    <div className="pt-6">
      <SectionTitle accent={comp.accent}>Jogos</SectionTitle>
      {/* Seletor de jornada */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-2">
        <button onClick={() => setJornada((j) => Math.max(1, j - 1))} className="grid h-9 w-9 place-items-center rounded-xl text-white/60 hover:bg-white/5">‹</button>
        <div className="text-center">
          <p className="font-display text-lg text-white">Jornada {jornada}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40">18–20 Out</p>
        </div>
        <button onClick={() => setJornada((j) => Math.min(34, j + 1))} className="grid h-9 w-9 place-items-center rounded-xl text-white/60 hover:bg-white/5">›</button>
      </div>

      {/* Lista de jogos */}
      <div className="mt-4 space-y-3">
        {[
          { home: "Benfica", hf: "🦅", away: "Porto", af: "🐉", time: "20:30", day: "Sáb", voted: false, big: true },
          { home: "Sporting", hf: "🦁", away: "Braga", af: "🔴", time: "18:00", day: "Sáb", voted: true },
          { home: "V. Guimarães", hf: "⚪", away: "Gil Vicente", af: "🔵", time: "15:30", day: "Dom", voted: false },
          { home: "Famalicão", hf: "🟢", away: "Moreirense", af: "🟡", time: "20:00", day: "Dom", voted: false },
        ].map((m, i) => <MatchRowFull key={i} comp={comp} {...m} />)}
      </div>
    </div>
  );
}

function MatchRowFull({ comp, home, hf, away, af, time, day, voted, big }: any) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white/[0.02] transition-all hover:-translate-y-0.5"
      style={{ borderColor: voted ? `color-mix(in oklch, ${comp.accent} 30%, transparent)` : "rgba(255,255,255,0.08)" }}>
      {big && (
        <div className="px-4 pt-2.5"><Chip comp={comp}>⭐ Jogo grande · pontos a dobrar</Chip></div>
      )}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-12 shrink-0 text-center">
          <p className="text-[10px] uppercase tracking-wide text-white/40">{day}</p>
          <p className="text-sm font-bold text-white">{time}</p>
        </div>
        <div className="flex flex-1 items-center gap-2">
          <Team flag={hf} name={home} size="sm" />
          <span className="font-display text-xs text-white/30">VS</span>
          <Team flag={af} name={away} size="sm" />
        </div>
        <div className="w-16 shrink-0 text-right">
          {voted ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: comp.accentBright }}><Check className="h-3.5 w-3.5" /> Feito</span>
          ) : (
            <span className="text-[11px] font-bold" style={{ color: comp.accentBright }}>Votar →</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── JOGO (votar) ─────────────────────────── */

function PageJogo({ comp }: { comp: CompetitionTheme }) {
  const [result, setResult] = useState<string | null>("home");
  return (
    <div className="pt-6">
      {/* Cabeçalho do jogo */}
      <div className="relative overflow-hidden rounded-3xl border" style={{ borderColor: `color-mix(in oklch, ${comp.accent} 30%, transparent)`, background: comp.heroGradient }}>
        <div className="relative px-5 py-6">
          <div className="flex justify-center"><Chip comp={comp}>Jornada 8 · Sáb 20:30</Chip></div>
          <div className="mt-5 flex items-center justify-between">
            <Team flag="🦅" name="Benfica" />
            <div className="px-3 text-center">
              <p className="font-display text-3xl text-white/40">VS</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">Estádio da Luz</p>
            </div>
            <Team flag="🐉" name="Porto" />
          </div>
        </div>
      </div>

      {/* Mercado: resultado */}
      <div className="mt-6"><SectionTitle accent={comp.accent} right={<span className="text-xs" style={{ color: GOLD.base }}>3 pts</span>}>Quem vence?</SectionTitle></div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[{ k: "home", l: "Benfica" }, { k: "draw", l: "Empate" }, { k: "away", l: "Porto" }].map((o) => {
          const on = result === o.k;
          return (
            <button key={o.k} onClick={() => setResult(o.k)} className="rounded-2xl border px-2 py-4 text-sm font-bold transition-all"
              style={{ borderColor: on ? comp.accent : "rgba(255,255,255,0.1)", background: on ? `color-mix(in oklch, ${comp.accent} 18%, transparent)` : "transparent", color: on ? comp.accentBright : "rgba(255,255,255,0.7)" }}>
              {o.l}
            </button>
          );
        })}
      </div>

      {/* Mercado: resultado exato */}
      <div className="mt-6"><SectionTitle accent={comp.accent} right={<span className="text-xs" style={{ color: GOLD.base }}>10 pts 🔥</span>}>Resultado exato</SectionTitle></div>
      <div className="mt-3 flex items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] py-5">
        <Stepper />
        <span className="font-display text-2xl text-white/30">:</span>
        <Stepper />
      </div>

      {/* Mercado: outros */}
      <div className="mt-6"><SectionTitle accent={comp.accent} right={<span className="text-xs" style={{ color: GOLD.base }}>2 pts</span>}>Ambas marcam?</SectionTitle></div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {["Sim", "Não"].map((l, i) => (
          <button key={l} className="rounded-2xl border px-2 py-3.5 text-sm font-bold transition-all"
            style={{ borderColor: i === 0 ? comp.accent : "rgba(255,255,255,0.1)", background: i === 0 ? `color-mix(in oklch, ${comp.accent} 18%, transparent)` : "transparent", color: i === 0 ? comp.accentBright : "rgba(255,255,255,0.7)" }}>
            {l}
          </button>
        ))}
      </div>

      <button className="mt-7 w-full rounded-2xl py-3.5 text-sm font-bold transition-transform hover:scale-[1.01]" style={{ background: comp.accent, color: "#0a0b0f", boxShadow: `0 8px 24px ${comp.glow}` }}>
        Confirmar previsão
      </button>
    </div>
  );
}

function Stepper() {
  const [n, setN] = useState(2);
  return (
    <div className="flex flex-col items-center gap-1">
      <button onClick={() => setN((v) => v + 1)} className="text-white/40 hover:text-white">▲</button>
      <span className="font-display text-4xl text-white">{n}</span>
      <button onClick={() => setN((v) => Math.max(0, v - 1))} className="text-white/40 hover:text-white">▼</button>
    </div>
  );
}

/* ─────────────────────────── RANKING ─────────────────────────── */

function PageRanking({ comp }: { comp: CompetitionTheme }) {
  const [tab, setTab] = useState<"mes" | "epoca" | "reis">("mes");
  return (
    <div className="pt-6">
      <SectionTitle accent={comp.accent}>Ranking</SectionTitle>

      {/* Tabs */}
      <div className="mt-4 flex gap-1.5 rounded-2xl border border-white/10 bg-white/[0.02] p-1">
        {[{ k: "mes", l: "Do mês" }, { k: "epoca", l: "Da época" }, { k: "reis", l: "Reis" }].map((t) => {
          const on = tab === t.k;
          return (
            <button key={t.k} onClick={() => setTab(t.k as any)} className="flex-1 rounded-xl py-2 text-sm font-bold transition-all"
              style={{ background: on ? comp.accent : "transparent", color: on ? "#0a0b0f" : "rgba(255,255,255,0.55)" }}>
              {t.l}
            </button>
          );
        })}
      </div>

      {tab === "mes" && (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
            <Flame className="h-4 w-4" style={{ color: comp.accentBright }} />
            <p className="text-xs text-white/60">Novembro · <span className="font-bold text-white">11 dias</span> para o fim. Campeão do mês sobe de divisão.</p>
          </div>
          <div className="mt-3"><RankingList comp={comp} /></div>
        </>
      )}

      {tab === "epoca" && (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
            <Trophy className="h-4 w-4" style={{ color: GOLD.base }} />
            <p className="text-xs text-white/60">Pontos por posição mensal (estilo F1). Vence quem for mais <span className="font-bold text-white">consistente</span>.</p>
          </div>
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {[
              { pos: 1, name: "Ana Ferreira", pts: 148, wins: 2 },
              { pos: 2, name: "Miguel Sousa", pts: 141, wins: 3 },
              { pos: 3, name: "Tu", pts: 120, wins: 1, me: true },
              { pos: 4, name: "Rui Tavares", pts: 112, wins: 0 },
            ].map((r) => (
              <div key={r.pos} className="flex items-center gap-3 px-4 py-3" style={r.me ? { background: `color-mix(in oklch, ${comp.accent} 12%, transparent)` } : {}}>
                <span className="w-6 text-center font-display text-lg" style={{ color: r.pos <= 3 ? GOLD.base : "rgba(255,255,255,0.4)" }}>{r.pos}</span>
                <span className={`flex-1 text-sm ${r.me ? "font-bold" : "font-medium"}`} style={{ color: r.me ? comp.accentBright : "white" }}>{r.name}</span>
                {r.wins > 0 && <span className="flex items-center gap-0.5 text-[11px] text-white/50"><Crown className="h-3 w-3" style={{ color: GOLD.base }} />{r.wins}</span>}
                <span className="w-12 text-right font-display text-base" style={{ color: GOLD.base }}>{r.pts}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "reis" && (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
            <Crown className="h-4 w-4" style={{ color: GOLD.base }} />
            <p className="text-xs text-white/60">Os melhores palpiteiros só da <span className="font-bold text-white">{comp.name}</span>, toda a época.</p>
          </div>
          <div className="mt-3"><RankingList comp={comp} /></div>
        </>
      )}
    </div>
  );
}

function RankingList({ comp, compact }: { comp: CompetitionTheme; compact?: boolean }) {
  const rows = [
    { pos: 1, name: "Miguel Sousa", pts: 312, move: "up" },
    { pos: 2, name: "Ana Ferreira", pts: 298, move: "up" },
    { pos: 3, name: "Rui Tavares", pts: 291, move: "down" },
    { pos: 12, name: "Tu", pts: 247, move: "same", me: true },
    { pos: 13, name: "João Dias", pts: 244, move: "down" },
  ];
  const visible = compact ? rows.slice(0, 3).concat(rows.filter((r) => r.me)) : rows;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      {visible.map((r, i, arr) => (
        <div key={r.pos}>
          {i > 0 && arr[i - 1].pos !== r.pos - 1 && (
            <div className="flex items-center gap-2 px-4 py-1"><div className="h-px flex-1 bg-white/5" /><span className="text-[9px] text-white/20">···</span><div className="h-px flex-1 bg-white/5" /></div>
          )}
          <div className="flex items-center gap-3 px-4 py-2.5" style={r.me ? { background: `color-mix(in oklch, ${comp.accent} 12%, transparent)` } : {}}>
            <span className="w-6 text-center font-display text-lg" style={{ color: r.pos <= 3 ? GOLD.base : "rgba(255,255,255,0.4)" }}>{r.pos}</span>
            <span className={`flex-1 truncate text-sm ${r.me ? "font-bold" : "font-medium"}`} style={{ color: r.me ? comp.accentBright : "white" }}>{r.name}</span>
            {r.move === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
            {r.move === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
            {r.move === "same" && <Minus className="h-3.5 w-3.5 text-white/30" />}
            <span className="w-12 text-right font-display text-base" style={{ color: GOLD.base }}>{r.pts}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── PERFIL ─────────────────────────── */

function PagePerfil({ comp }: { comp: CompetitionTheme }) {
  return (
    <div className="pt-6">
      {/* Cabeçalho do perfil */}
      <div className="relative overflow-hidden rounded-3xl border" style={{ borderColor: `color-mix(in oklch, ${comp.accent} 30%, transparent)`, background: comp.heroGradient }}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full" style={{ background: comp.glow, filter: "blur(50px)" }} />
        <div className="relative flex items-center gap-4 px-5 py-6">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-2 font-display text-2xl text-white" style={{ borderColor: GOLD.base, background: "rgba(255,255,255,0.08)", boxShadow: `0 0 30px ${GOLD.glow}` }}>DV</div>
          <div className="min-w-0">
            <p className="font-display text-2xl text-white">David V.</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `color-mix(in oklch, ${comp.accent} 22%, transparent)`, color: comp.accentBright }}>1ª Divisão</span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `color-mix(in oklch, ${GOLD.base} 18%, transparent)`, color: GOLD.base }}>👑 1× Campeão do mês</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas da época */}
      <div className="mt-6"><SectionTitle accent={comp.accent}>A tua época</SectionTitle></div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard value="247" label="Pontos no mês" gold />
        <StatCard value="1 240" label="Pontos na época" gold />
        <StatCard value="68%" label="Taxa de acerto" />
        <StatCard value="34" label="Jogos votados" />
      </div>

      {/* Conquistas */}
      <div className="mt-6"><SectionTitle accent={comp.accent}>Conquistas</SectionTitle></div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { e: "👑", l: "Campeão", on: true },
          { e: "🎯", l: "10 exatos", on: true },
          { e: "🔥", l: "Streak 5", on: true },
          { e: "⭐", l: "Top 10", on: false },
        ].map((b) => (
          <div key={b.l} className="flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center"
            style={{ borderColor: b.on ? `color-mix(in oklch, ${GOLD.base} 30%, transparent)` : "rgba(255,255,255,0.08)", opacity: b.on ? 1 : 0.35 }}>
            <span className="text-2xl">{b.e}</span>
            <span className="text-[9px] font-semibold text-white/60">{b.l}</span>
          </div>
        ))}
      </div>

      {/* Histórico mensal */}
      <div className="mt-6"><SectionTitle accent={comp.accent}>Mês a mês</SectionTitle></div>
      <div className="mt-4 space-y-2">
        {[
          { mes: "Outubro", pos: 1, pts: 340, champ: true },
          { mes: "Setembro", pos: 4, pts: 288 },
          { mes: "Agosto", pos: 7, pts: 210 },
        ].map((m) => (
          <div key={m.mes} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="flex-1 text-sm font-semibold text-white">{m.mes}</span>
            {m.champ && <Crown className="h-4 w-4" style={{ color: GOLD.base }} />}
            <span className="text-sm text-white/50">#{m.pos}º</span>
            <span className="w-14 text-right font-display text-base" style={{ color: GOLD.base }}>{m.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ value, label, gold }: { value: string; label: string; gold?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
      <p className="font-display text-2xl leading-none" style={{ color: gold ? GOLD.base : "white" }}>{value}</p>
      <p className="mt-1.5 text-[10px] uppercase tracking-widest text-white/40">{label}</p>
    </div>
  );
}

/* ─────────────────────────── partilhadas ─────────────────────────── */

function MatchCard({ comp, home, hf, away, af, time, voted }: any) {
  return (
    <div className="group overflow-hidden rounded-2xl border bg-white/[0.02] transition-all hover:-translate-y-0.5"
      style={{ borderColor: voted ? `color-mix(in oklch, ${comp.accent} 30%, transparent)` : "rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: comp.accentBright }}>{comp.short}</span>
        <span className="flex items-center gap-1 text-[11px] text-white/40"><Clock className="h-3 w-3" /> {time}</span>
      </div>
      <div className="flex items-center justify-between px-4 py-4"><Team flag={hf} name={home} /><span className="px-2 font-display text-sm text-white/30">VS</span><Team flag={af} name={away} /></div>
      <div className="flex items-center justify-between px-4 py-2.5 text-xs font-bold" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: voted ? `color-mix(in oklch, ${comp.accent} 8%, transparent)` : "transparent" }}>
        {voted ? (<><span className="flex items-center gap-1.5" style={{ color: comp.accentBright }}><Flame className="h-3.5 w-3.5" /> Previsão feita</span><span className="text-white/40">Comunidade →</span></>)
          : (<><span className="text-white/40">1.240 previsões</span><span style={{ color: comp.accentBright }}>Dar previsão →</span></>)}
      </div>
    </div>
  );
}

function TournamentRow({ comp, name, members, prize, pos }: any) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 transition-all hover:-translate-y-0.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in oklch, ${comp.accent} 18%, transparent)` }}>
        <Users className="h-4 w-4" style={{ color: comp.accentBright }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{name}</p>
        <p className="text-[11px] text-white/40">{members} membros · {prize}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-lg" style={{ color: pos === 1 ? GOLD.base : "white" }}>{pos}º</p>
        <ChevronRight className="ml-auto h-4 w-4 text-white/30" />
      </div>
    </div>
  );
}
