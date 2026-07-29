import { createFileRoute, Link, useSearch, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, ArrowUp, ArrowDown, Minus, Shield, Users2, Crown, Star } from "lucide-react";
import { UserAvatar } from "@/components/AvatarPicker";
import { useAuth } from "@/lib/useAuth";
import { FollowButton } from "@/components/FollowButton";
import { useCompetitions } from "@/lib/useCompetitions";
import {
  useRanking, useRankingMes, useMeses, mesAtual, useTendencia, escopoDe,
  type LinhaRanking,
} from "@/lib/usePontos";

const HOF_PHASE_LABEL: Record<string, string> = {
  grupos: "Fase de Grupos", ronda32: "16 Avos", oitavos: "Oitavos",
  quartos: "Quartos", meias: "Meias-Finais", final: "Final",
};
const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_STYLES = [
  "border-gold/40 bg-gold/10",
  "border-slate-300/40 bg-slate-300/10",
  "border-amber-700/40 bg-amber-700/10",
];

/** Classificação geral final do Mundial 2026, congelada para sempre. */
function PodioMundial() {
  const { data: podio = [] } = useQuery({
    queryKey: ["mundial-2026-podio"],
    staleTime: 600_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("mundial_2026_classificacao")
        .select("user_id,rank,total_points")
        .lte("rank", 10)
        .order("rank");
      if (!data || data.length === 0) return [];
      const ids = data.map((r: any) => r.user_id) as string[];
      const { data: perfis } = await supabase
        .from("profiles").select("id,display_name,avatar_url").in("id", ids);
      const mapa = Object.fromEntries((perfis ?? []).map((p: any) => [p.id, p]));
      return data.map((r: any) => ({ ...r, profile: mapa[r.user_id] }));
    },
  });

  if (podio.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-gold" />
        <h3 className="font-display text-lg">Classificação Final · Mundial 2026</h3>
      </div>
      <div className="space-y-2">
        {podio.map((e: any) => (
          <Link key={e.user_id} to="/adepto/$id" params={{ id: e.user_id }}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-smooth hover:brightness-110 ${MEDAL_STYLES[e.rank - 1] ?? "border-border bg-card/60"}`}>
            <span className="w-8 text-center text-2xl">{MEDALS[e.rank - 1] ?? `${e.rank}º`}</span>
            <UserAvatar avatarUrl={e.profile?.avatar_url} name={e.profile?.display_name} size={8} className="shrink-0 rounded-full" />
            <span className="flex-1 truncate font-semibold">{e.profile?.display_name ?? "—"}</span>
            <div className="text-right">
              <p className="font-display text-xl leading-none text-gold">{e.total_points}</p>
              <p className="text-[10px] text-muted-foreground">pontos</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function HallOfFame({ data }: { data: any[] }) {
  if (data.length === 0) return (
    <div className="rounded-2xl border border-border bg-card/70 p-10 text-center">
      <Star className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
      <p className="font-display text-lg">Ainda sem dados</p>
      <p className="text-sm text-muted-foreground">O Hall of Fame será preenchido no final de cada fase.</p>
    </div>
  );

  const phases = [...new Set(data.map((h: any) => h.phase as string))];

  return (
    <div className="space-y-6">
      {phases.map(phase => {
        const entries = data.filter((h: any) => h.phase === phase).sort((a: any, b: any) => a.rank - b.rank);
        return (
          <div key={phase}>
            <div className="mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-gold" />
              <h3 className="font-display text-lg">{HOF_PHASE_LABEL[phase] ?? phase}</h3>
            </div>
            <div className="space-y-2">
              {entries.map((e: any) => (
                <Link key={e.user_id} to="/adepto/$id" params={{ id: e.user_id }}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 hover:brightness-110 transition-smooth ${MEDAL_STYLES[e.rank - 1] ?? "border-border bg-card/60"}`}>
                  <span className="text-2xl">{MEDALS[e.rank - 1] ?? `#${e.rank}`}</span>
                  <UserAvatar avatarUrl={e.profile?.avatar_url} name={e.profile?.display_name} size={8} className="rounded-full shrink-0" />
                  <span className="flex-1 font-semibold truncate">{e.profile?.display_name ?? "—"}</span>
                  <div className="text-right">
                    <p className="font-display text-xl text-gold leading-none">{e.total_points}</p>
                    <p className="text-[10px] text-muted-foreground">pontos</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankTrend({ currentRank, previousRank }: { currentRank: number; previousRank: number | null }) {
  if (!previousRank || previousRank === currentRank) return <Minus className="h-3 w-3 text-muted-foreground/30" />;
  const diff = previousRank - currentRank; // positive = moved up
  if (diff > 0) return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-wc-green/15 px-1.5 py-0.5 text-[9px] font-bold text-wc-green">
      <ArrowUp className="h-2.5 w-2.5" />+{diff}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-wc-red/15 px-1.5 py-0.5 text-[9px] font-bold text-wc-red">
      <ArrowDown className="h-2.5 w-2.5" />{diff}
    </span>
  );
}


export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Rankings — Uma Geração" },
      { name: "description", content: "Ranking dos adeptos da Liga Portugal e da Champions League — por competição, por mês e no total da época." },
      { property: "og:title", content: "Rankings — Uma Geração" },
      { property: "og:description", content: "Descobre quem lidera o ranking de previsões da época." },
      { property: "og:url", content: "https://geracao2026.com/rankings" },
    ],
    links: [{ rel: "canonical", href: "https://geracao2026.com/rankings" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    tab: ["ligas", "jogos", "divisoes", "hof"].includes(search.tab as string) ? (search.tab as string) : "divisoes",
  }),
  component: Rankings,
});

const DIVISIONS = [
  { key: "primeira", label: "1ª Liga",   emoji: "🏆", min: 1,  max: 10,  color: "from-cyan-400 to-blue-500",    border: "border-cyan-400/40",   bg: "bg-cyan-400/10",   text: "text-cyan-400" },
  { key: "segunda",  label: "2ª Liga",   emoji: "⚽", min: 11, max: 25,  color: "from-yellow-400 to-amber-500", border: "border-gold/40",       bg: "bg-gold/10",       text: "text-gold" },
  { key: "distrital",label: "Distrital", emoji: "🟡", min: 26, max: 50,  color: "from-slate-300 to-slate-500",  border: "border-slate-400/40",  bg: "bg-slate-400/10",  text: "text-slate-400" },
  { key: "regional", label: "Liga do Zé Povinho", emoji: "🟢", min: 51, max: Infinity, color: "from-green-700 to-emerald-800", border: "border-green-700/40", bg: "bg-green-700/10", text: "text-green-600" },
] as const;

function getDivision(rank: number) {
  return DIVISIONS.find(d => rank >= d.min && rank <= d.max) ?? DIVISIONS[3];
}

function Rankings() {
  const search = useSearch({ from: "/rankings" });
  const [tab, setTab] = useState<"ligas" | "jogos" | "divisoes" | "hof">(search.tab as any ?? "divisoes");
  const [expandedDivs, setExpandedDivs] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

  // Seletor de competição — "total" soma todas as competições da época
  const { data: competitions = [] } = useCompetitions();
  const [compSlug, setCompSlug] = useState<string>("total");
  const activeComp = competitions.find(c => c.slug === compSlug) ?? null;

  // Período: a época toda ou só o mês competitivo em curso
  const [periodo, setPeriodo] = useState<"epoca" | "mes">("epoca");
  const { data: meses = [] } = useMeses(activeComp?.id);
  const mes = mesAtual(meses);

  // Ranking de ligas
  const { data: leagueRanking = [] } = useQuery({
    queryKey: ["league-ranking"],
    staleTime: 60_000,
    enabled: tab === "ligas",
    queryFn: async () => {
      const { data: pools } = await supabase
        .from("pools")
        .select("id, name, code, emoji");
      if (!pools || pools.length === 0) return [];

      // Pontuação já calculada com as regras de cada liga (top 3 membros)
      const { data: totais } = await (supabase as any)
        .from("ranking_ligas")
        .select("pool_id,pontos,membros");
      const mapa = new Map(((totais ?? []) as any[]).map(t => [t.pool_id, t]));

      return pools
        .map(pool => ({
          ...pool,
          total_points: mapa.get(pool.id)?.pontos ?? 0,
          members: mapa.get(pool.id)?.membros ?? 0,
        }))
        .filter(l => l.members > 0)
        .sort((a, b) => b.total_points - a.total_points);
    },
  });

  // Ranking por jogo
  const { data: matchRanking = [] } = useQuery({
    queryKey: ["match-ranking", activeComp?.id ?? "todas"],
    staleTime: 60_000,
    enabled: tab === "jogos",
    queryFn: async () => {
      let q = (supabase as any)
        .from("matches")
        .select("id,kickoff_at,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code)")
        .eq("status", "finished")
        .eq("is_official", true);
      if (activeComp?.id) q = q.eq("competition_id", activeComp.id);
      const { data: matches } = await q.order("kickoff_at", { ascending: false }).limit(20);
      if (!matches || matches.length === 0) return [];

      const results = await Promise.all(matches.map(async (m: any) => {
        const { data: preds } = await supabase
          .from("predictions")
          .select("user_id, points")
          .eq("match_id", m.id)
          .gt("points", 0)
          .order("points", { ascending: false })
          .limit(5);
        if (!preds || preds.length === 0) return { match: m, topScorers: [] };
        const userIds = preds.map((p: any) => p.user_id);
        const { data: profiles } = await supabase
          .from("profiles").select("id,display_name,avatar_url").in("id", userIds);
        const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
        return {
          match: m,
          topScorers: preds.map((p: any) => ({ ...profileMap[p.user_id], points: p.points })).filter((p: any) => p.id),
        };
      }));
      return results.filter(r => r.topScorers.length > 0);
    },
  });

  // Hall of Fame
  const { data: hofData = [] } = useQuery({
    queryKey: ["hall-of-fame"],
    staleTime: 60_000,
    enabled: tab === "hof",
    queryFn: async () => {
      const { data: hof } = await (supabase as any)
        .from("hall_of_fame")
        .select("phase,rank,total_points,user_id")
        .order("phase").order("rank");
      if (!hof || hof.length === 0) return [];
      const userIds = [...new Set(hof.map((h: any) => h.user_id))] as string[];
      const { data: profiles } = await supabase
        .from("profiles").select("id,display_name,avatar_url").in("id", userIds);
      const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
      return hof.map((h: any) => ({ ...h, profile: profileMap[h.user_id] }));
    },
  });

  // Divisões — pontos calculados das vistas (nunca guardados)
  // Se a competição escolhida não tiver meses (ex.: Champions antes do
  // sorteio), volta à época em vez de mostrar uma lista vazia.
  const porMesDisponivel = periodo === "mes" && !!mes;
  const porEpoca = useRanking(activeComp?.id ?? null);
  const porMes = useRankingMes(porMesDisponivel ? mes!.id : null);
  const fonte = porMesDisponivel ? porMes : porEpoca;

  const allUsers = useMemo(
    () => (fonte.data ?? []).map((r: LinhaRanking) => ({ ...r, division: getDivision(r.rank) })),
    [fonte.data],
  );
  const loadingUsers = fonte.isLoading;

  // Posição de ontem no mesmo ranking — alimenta a seta de tendência
  const escopo = escopoDe(
    porMesDisponivel
      ? { monthId: mes!.id }
      : { competitionId: activeComp?.id },
  );
  const { data: anteriores } = useTendencia(escopo);

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <h1 className="font-display text-3xl">Rankings</h1>
        <p className="text-sm text-muted-foreground">
          Pontos dos jogos oficiais de cada jornada — por competição ou no total.
        </p>
      </header>

      {/* Seletor de competição — época 2026/27 */}
      {competitions.length > 0 && (
        <div className="mb-3 -mx-5 flex gap-2 overflow-x-auto px-5">
          <button onClick={() => { setCompSlug("total"); setPeriodo("epoca"); }}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-smooth ${
              compSlug === "total"
                ? "border-gold bg-gold text-background"
                : "border-border text-muted-foreground hover:border-gold/40"
            }`}>
            🎯 Total
          </button>
          {competitions.map(c => {
            const on = c.slug === compSlug;
            return (
              <button key={c.slug} onClick={() => setCompSlug(c.slug)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-smooth"
                style={on
                  ? { borderColor: c.accent, background: c.accent, color: "#fff" }
                  : { borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                <span>{c.emoji}</span>{c.short}
              </button>
            );
          })}
        </div>
      )}

      {/* Período — só faz sentido dentro de uma competição */}
      {activeComp && mes && (
        <div className="mb-4 flex gap-1.5">
          {([["epoca", "Época"], ["mes", mes.label]] as const).map(([k, rotulo]) => (
            <button key={k} onClick={() => setPeriodo(k)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-smooth ${
                periodo === k
                  ? "border-foreground/30 bg-foreground/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}>
              {rotulo}
            </button>
          ))}
        </div>
      )}

      {/* Tabs principais */}
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab("divisoes")}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-smooth ${
            tab === "divisoes"
              ? "border-wc-red bg-wc-red text-white"
              : "border-border bg-card/60 text-muted-foreground hover:border-wc-red/40"
          }`}
        >
          🏆 Divisões
        </button>
        <button
          onClick={() => setTab("ligas")}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-smooth ${
            tab === "ligas"
              ? "border-wc-red bg-wc-red text-white"
              : "border-border bg-card/60 text-muted-foreground hover:border-wc-red/40"
          }`}
        >
          <Shield className="h-3.5 w-3.5" /> Ligas
        </button>
        <button
          onClick={() => setTab("jogos")}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-smooth ${
            tab === "jogos"
              ? "border-wc-red bg-wc-red text-white"
              : "border-border bg-card/60 text-muted-foreground hover:border-wc-red/40"
          }`}
        >
          <Trophy className="h-3.5 w-3.5" /> Por Jogo
        </button>
        <button
          onClick={() => setTab("hof")}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-smooth ${
            tab === "hof"
              ? "border-gold bg-gold text-background"
              : "border-border bg-card/60 text-muted-foreground hover:border-gold/40"
          }`}
        >
          <Star className="h-3.5 w-3.5" /> Hall of Fame
        </button>
      </div>


      {/* ── RANKING DE LIGAS ───────────────────────────────── */}
      {tab === "ligas" && (
        <>
        <p className="mb-3 text-[11px] text-muted-foreground text-center">
          Pontuação calculada com base nos <span className="font-semibold text-foreground">top 3 membros</span> de cada torneio — justo para grupos de qualquer tamanho.
        </p>
        <div className="overflow-hidden rounded-2xl border border-border bg-card/70">
          {leagueRanking.length === 0 ? (
            <div className="p-10 text-center">
              <Shield className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="font-display text-lg">Ainda sem ligas</p>
              <p className="text-sm text-muted-foreground">Cria um torneio para aparecer aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leagueRanking.map((league, i) => (
                <Link key={league.id} to="/liga/$code" params={{ code: league.code }} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-smooth">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    i === 0 ? "bg-gold text-background" : i < 3 ? "bg-gold/30 text-gold" : "bg-secondary text-muted-foreground"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                      {(league as any).emoji && <span>{(league as any).emoji}</span>}
                      {league.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Users2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{league.members} membro{league.members !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg text-gold leading-none">{league.total_points}</p>
                    <p className="text-[10px] text-muted-foreground">pts totais</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        </>
      )}

      {/* ── RANKING POR JOGO ───────────────────────────────── */}
      {tab === "jogos" && (
        <div className="space-y-4">
          {matchRanking.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card/70 p-10 text-center">
              <Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="font-display text-lg">Ainda sem jogos terminados</p>
            </div>
          ) : matchRanking.map(({ match, topScorers }: any) => (
            <div key={match.id} className="overflow-hidden rounded-2xl border border-border bg-card/70">
              {/* Cabeçalho do jogo */}
              <Link to="/jogo/$id" params={{ id: match.id }}
                className="flex items-center justify-between px-4 py-3 border-b border-border/50 hover:bg-accent/50 transition-smooth"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold truncate">{(match.home as any)?.name}</span>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <span className="text-xs font-semibold truncate">{(match.away as any)?.name}</span>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground ml-2">Ver jogo →</span>
              </Link>
              {/* Top 5 pontuadores */}
              <div className="divide-y divide-border/50">
                {topScorers.map((u: any, i: number) => (
                  <Link key={u.id} to="/adepto/$id" params={{ id: u.id }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-smooth"
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                      i === 0 ? "bg-gold text-background" : i === 1 ? "bg-gold/30 text-gold" : i === 2 ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"
                    }`}>
                      {i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}
                    </span>
                    <UserAvatar avatarUrl={u.avatar_url} name={u.display_name} size={6} className="rounded-full shrink-0" />
                    <span className="flex-1 text-sm font-semibold truncate">{u.display_name}</span>
                    <span className="shrink-0 font-display text-base text-gold">+{u.points} <span className="text-[10px] font-sans text-muted-foreground">pts</span></span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DIVISÕES ────────────────────────────────────────── */}
      {tab === "divisoes" && loadingUsers && (
        <div className="space-y-3">
          <div className="h-24 shimmer rounded-2xl" />
          {[0,1,2].map(i => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border">
              <div className="h-14 shimmer" />
              <div className="divide-y divide-border/50">
                {[0,1,2,3,4].map(j => <div key={j} className="h-12 shimmer" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "divisoes" && !loadingUsers && (
        <div className="space-y-6">
          {/* Época ainda por começar — evita parecer que está avariado */}
          {allUsers.length > 0 && allUsers.every(u => u.pontos === 0) && (
            <div className="rounded-2xl border border-gold/30 bg-gold/5 px-4 py-3">
              <p className="text-sm font-bold">A época ainda não começou</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Estão todos a zero até haver resultados dos jogos oficiais. As divisões
                organizam-se sozinhas assim que a primeira jornada for apurada.
              </p>
            </div>
          )}
          {/* Cartão da divisão do utilizador */}
          {user && (() => {
            const me = allUsers.find(u => u.user_id === user.id);
            if (!me) return null;
            const div = me.division;
            return (
              <div className={`rounded-2xl border ${div.border} ${div.bg} p-4`}>
                <p className="text-xs text-muted-foreground mb-1">
                  A tua divisão · {compSlug === "total" ? "Total" : activeComp?.short}
                  {porMesDisponivel ? ` · ${mes!.label}` : ""}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{div.emoji}</span>
                  <div>
                    <p className={`font-display text-2xl ${div.text}`}>{div.label}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      #{me.rank}º · {me.pontos} pts · {me.acertos}/{me.previsoes} acertos
                      <RankTrend currentRank={me.rank} previousRank={anteriores?.get(me.user_id) ?? null} />
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Todas as divisões */}
          {DIVISIONS.map(div => {
            const members = allUsers.filter(u => u.rank >= div.min && u.rank <= div.max);
            if (members.length === 0) return null;
            return (
              <div key={div.key} className={`overflow-hidden rounded-2xl border ${div.border}`}>
                {/* Header da divisão */}
                <div className={`flex items-center gap-3 px-4 py-3`}
                  style={{ background: div.key === "primeira" ? "linear-gradient(90deg,#0d1a2e,#0a1f3a)" : div.key === "segunda" ? "linear-gradient(90deg,#1a1500,#2a1f00)" : div.key === "distrital" ? "linear-gradient(90deg,#111,#1a1a1a)" : "linear-gradient(90deg,#0a1a0d,#0d1f10)" }}>
                  <span className="text-2xl">{div.emoji}</span>
                  <div className="flex-1">
                    <p className={`font-display text-lg ${div.text}`}>{div.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {div.max === Infinity ? `${div.min}º em diante` : `${div.min}º ao ${div.max}º`} · {members.length} adepto{members.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {/* Membros */}
                <div className="divide-y divide-border/50">
                  {(expandedDivs[div.key] ? members : members.slice(0, 25)).map((u, i) => {
                    const isMe = u.user_id === user?.id;
                    const isTop3 = i < 3;
                    const isBottom3 = i >= members.length - 3 && members.length > 3;
                    return (
                      <div key={u.user_id} className={`flex items-center gap-3 px-4 py-2.5 ${
                        isMe ? div.bg : isTop3 ? "bg-wc-green/5" : isBottom3 ? "bg-wc-red/5" : ""
                      }`}>
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          i === 0 ? `bg-gradient-to-b ${div.color} text-white` :
                          isTop3 ? "bg-wc-green/20 text-wc-green" :
                          isBottom3 ? "bg-wc-red/20 text-wc-red" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {i === 0 ? <Crown className="h-3.5 w-3.5" /> : i + 1}
                        </span>
                        <Link to="/adepto/$id" params={{ id: u.user_id }} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-smooth">
                          <UserAvatar avatarUrl={u.avatar_url} name={u.display_name ?? "—"} size={7} className="rounded-full shrink-0" />
                          <span className={`flex-1 text-sm font-semibold truncate ${isMe ? div.text : ""}`}>
                            {u.display_name ?? "—"}{isMe && " (tu)"}
                          </span>
                        </Link>
                        <div className="flex items-center gap-2 shrink-0">
                          <RankTrend currentRank={u.rank} previousRank={anteriores?.get(u.user_id) ?? null} />
                          <span className="hidden text-[10px] text-muted-foreground sm:inline">
                            {u.acertos}/{u.previsoes}
                          </span>
                          <span className="font-display text-base text-gold">{u.pontos}</span>
                          {!isMe && <FollowButton targetId={u.user_id} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {members.length > 25 && (
                  <button
                    onClick={() => setExpandedDivs(prev => ({ ...prev, [div.key]: !prev[div.key] }))}
                    className="w-full py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-smooth bg-card/40 hover:bg-card/70"
                  >
                    {expandedDivs[div.key]
                      ? "Mostrar menos"
                      : `Ver mais ${members.length - 25} adepto${members.length - 25 === 1 ? "" : "s"}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── HALL OF FAME ─────────────────────────────────── */}
      {tab === "hof" && <><PodioMundial /><HallOfFame data={hofData} /></>}

      <div className="mt-6 rounded-2xl border border-border bg-card/50 p-5 text-xs text-muted-foreground">
        <h3 className="mb-2 font-display text-base text-foreground">Critérios de desempate</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Maior pontuação total.</li>
          <li>Maior percentagem de acerto.</li>
          <li>Menor número de previsões feitas.</li>
          <li>Quem submeteu primeiro a previsão.</li>
        </ol>
      </div>
    </div>
  );
}
