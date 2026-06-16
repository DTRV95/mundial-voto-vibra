import { createFileRoute, Link, useSearch, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, ArrowUp, ArrowDown, Minus, Share2, Shield, Users2 } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/AvatarPicker";
import { useAuth } from "@/lib/useAuth";

function RankTrend({ currentRank, previousRank }: { currentRank: number; previousRank: number | null }) {
  if (!previousRank || previousRank === currentRank) return <Minus className="h-3 w-3 text-muted-foreground/30" />;
  if (currentRank < previousRank) return <ArrowUp className="h-3 w-3 text-green-400" />;
  return <ArrowDown className="h-3 w-3 text-red-400" />;
}

const PHASES = [
  { key: "geral", label: "Ranking Geral" },
  { key: "grupos", label: "Fase de Grupos" },
  { key: "oitavos", label: "Oitavos" },
  { key: "quartos", label: "Quartos" },
  { key: "meias", label: "Meias-Finais" },
] as const;

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Rankings — Uma Geração | Mundial 2026" },
      { name: "description", content: "Ranking dos adeptos por fase do Mundial 2026 — Grupos, Oitavos, Quartos, Meias-finais e Final. Vê quem lidera a classificação." },
      { property: "og:title", content: "Rankings — Uma Geração | Mundial 2026" },
      { property: "og:description", content: "Descobre quem lidera o ranking de previsões do Mundial 2026." },
      { property: "og:url", content: "https://mundial-voto-vibra.davidvilaverde.workers.dev/rankings" },
    ],
    links: [{ rel: "canonical", href: "https://mundial-voto-vibra.davidvilaverde.workers.dev/rankings" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    tab: ["ligas", "jogos"].includes(search.tab as string) ? (search.tab as string) : "individual",
  }),
  component: Rankings,
});

function Rankings() {
  const search = useSearch({ from: "/rankings" });
  const [tab, setTab] = useState<"individual" | "ligas" | "jogos">(search.tab as "individual" | "ligas" | "jogos");
  const [phase, setPhase] = useState<typeof PHASES[number]["key"]>("geral");
  const [showAll, setShowAll] = useState(false);
  const { user } = useAuth();

  const { data: rows = [] } = useQuery({
    queryKey: ["ranking", phase, showAll],
    queryFn: async () => {
      if (phase === "geral") {
        const query = supabase
          .from("profiles")
          .select("id,display_name,avatar_url,total_points,predictions_made,predictions_correct,previous_rank")
          .order("total_points", { ascending: false });
        const { data } = showAll ? await query : await query.limit(5);
        return (data ?? []).map((r, i) => ({
          id: r.id,
          display_name: r.display_name,
          avatar_url: (r as any).avatar_url,
          points: r.total_points,
          predictions_made: r.predictions_made,
          predictions_correct: r.predictions_correct,
          previous_rank: (r as any).previous_rank ?? null,
          current_rank: i + 1,
        }));
      }

      // Ranking por fase: usar !inner para filtrar por fase do jogo
      const { data: preds } = await supabase
        .from("predictions")
        .select("user_id,points,match:match_id!inner(phase)")
        .eq("match.phase", phase);

      if (!preds || preds.length === 0) return [];

      // Agregar por utilizador
      const map: Record<string, { points: number; made: number; correct: number }> = {};
      for (const p of preds) {
        if (!map[p.user_id]) map[p.user_id] = { points: 0, made: 0, correct: 0 };
        map[p.user_id].points += p.points ?? 0;
        map[p.user_id].made += 1;
        if ((p.points ?? 0) > 0) map[p.user_id].correct += 1;
      }

      const userIds = Object.keys(map);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", userIds);

      return (profiles ?? [])
        .map((pr) => ({
          id: pr.id,
          display_name: pr.display_name,
          avatar_url: (pr as any).avatar_url,
          points: map[pr.id]?.points ?? 0,
          predictions_made: map[pr.id]?.made ?? 0,
          predictions_correct: map[pr.id]?.correct ?? 0,
        }))
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const accA = a.predictions_made > 0 ? a.predictions_correct / a.predictions_made : 0;
          const accB = b.predictions_made > 0 ? b.predictions_correct / b.predictions_made : 0;
          if (accB !== accA) return accB - accA;
          return a.predictions_made - b.predictions_made;
        })
        .slice(0, 5);
    },
  });

  // Ranking de ligas
  const { data: leagueRanking = [] } = useQuery({
    queryKey: ["league-ranking"],
    enabled: tab === "ligas",
    queryFn: async () => {
      const { data: pools } = await supabase
        .from("pools")
        .select("id, name, code, emoji");
      if (!pools || pools.length === 0) return [];

      // Busca membros com start_points
      const { data: allMembers } = await supabase
        .from("pool_members")
        .select("pool_id, user_id, start_points");

      if (!allMembers || allMembers.length === 0) return [];

      const userIds = [...new Set(allMembers.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, total_points")
        .in("id", userIds);

      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.total_points ?? 0]));

      const results = pools.map(pool => {
        const members = allMembers.filter(m => m.pool_id === pool.id);
        // Pontos da liga = total_points - start_points (pontos ganhos desde que entrou)
        const total = members.reduce((s, m) => {
          const league_pts = Math.max(0, (profileMap[m.user_id] ?? 0) - (m.start_points ?? 0));
          return s + league_pts;
        }, 0);
        return { ...pool, total_points: total, members: members.length };
      });

      return results
        .filter(l => l.members > 0)
        .sort((a, b) => b.total_points - a.total_points);
    },
  });

  // Ranking por jogo
  const { data: matchRanking = [] } = useQuery({
    queryKey: ["match-ranking"],
    enabled: tab === "jogos",
    queryFn: async () => {
      const { data: matches } = await supabase
        .from("matches")
        .select("id,kickoff_at,phase,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code)")
        .eq("status", "finished")
        .order("kickoff_at", { ascending: false })
        .limit(20);
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

  // Posição do utilizador autenticado — sempre mostrada no fundo
  const myEntry = rows.find(r => r.id === user?.id);
  const myRank  = myEntry ? rows.indexOf(myEntry) + 1 : null;

  const { data: myPosition } = useQuery({
    queryKey: ["my-rank", phase, user?.id],
    enabled: !!user?.id && rows.length > 0,
    queryFn: async () => {
      if (phase === "geral") {
        const { data: me } = await supabase
          .from("profiles")
          .select("id,display_name,avatar_url,total_points,predictions_made,predictions_correct,previous_rank")
          .eq("id", user!.id)
          .maybeSingle();
        if (!me) return null;
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gt("total_points", me.total_points);
        return {
          id: me.id,
          display_name: me.display_name,
          avatar_url: (me as any).avatar_url,
          points: me.total_points,
          predictions_made: me.predictions_made,
          predictions_correct: me.predictions_correct,
          previous_rank: (me as any).previous_rank ?? null,
          rank: (count ?? 0) + 1,
        };
      }
      return null;
    },
  });

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <h1 className="font-display text-3xl">Rankings</h1>
        <p className="text-sm text-muted-foreground">Compete por fase do Mundial e ganha prémios.</p>
      </header>

      {/* Tabs principais */}
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab("individual")}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-smooth ${
            tab === "individual"
              ? "border-wc-red bg-wc-red text-white"
              : "border-border bg-card/60 text-muted-foreground hover:border-wc-red/40"
          }`}
        >
          <Trophy className="h-3.5 w-3.5" /> Individual
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
      </div>

      {/* Sub-tabs de fase (só no individual) */}
      {tab === "individual" && (
        <div className="mb-5 -mx-5 overflow-x-auto px-5">
          <div className="flex gap-2">
            {PHASES.map((p) => (
              <button
                key={p.key}
                onClick={() => setPhase(p.key)}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-smooth ${
                  phase === p.key
                    ? "border-gold bg-gold text-background"
                    : "border-border bg-card/60 text-muted-foreground hover:border-gold/40"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── RANKING INDIVIDUAL ─────────────────────────────── */}
      {/* Partilhar posição */}
      {tab === "individual" && user && (myRank || myPosition) && (
        <div className="mb-4">
          <button
            onClick={() => {
              const rank = myRank ?? myPosition?.rank;
              const pts  = myRank ? rows[myRank - 1]?.points : myPosition?.points;
              const text = `Estou em ${rank}º lugar com ${pts} pontos no ranking do Uma Geração 🏆\nVota no Mundial 2026: ${window.location.origin}/rankings`;
              if (navigator.share) {
                navigator.share({ title: "O meu ranking — Uma Geração", text, url: `${window.location.origin}/rankings` });
              } else {
                navigator.clipboard.writeText(text);
                toast.success("Texto copiado para partilhar!");
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold hover:bg-gold/20 transition-smooth"
          >
            <Share2 className="h-3.5 w-3.5" />
            Partilhar a minha posição
          </button>
        </div>
      )}

      {tab === "individual" && <div className="overflow-hidden rounded-2xl border border-border bg-card/70">
        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <Trophy className="mx-auto mb-2 h-8 w-8 text-gold" />
            <p className="font-display text-lg">Ainda sem ranking</p>
            <p className="text-sm text-muted-foreground">Sê o primeiro a votar para subir ao topo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Adepto</th>
                <th className="px-2 py-2 text-right">Pts</th>
                <th className="px-2 py-2 text-right">Acertos</th>
                <th className="px-2 py-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const acc = r.predictions_made > 0
                  ? Math.round((r.predictions_correct / r.predictions_made) * 100)
                  : 0;
                const isMe = r.id === user?.id;
                return (
                  <tr key={r.id} className={`border-t border-border ${isMe ? "bg-gold/5" : ""}`}>
                    <td className="px-3 py-2.5">
                      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                        i === 0 ? "bg-gold text-background" : i < 3 ? "bg-gold/30 text-gold" : isMe ? "bg-wc-red/20 text-wc-red" : "bg-secondary"
                      }`}>{i + 1}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link to="/adepto/$id" params={{ id: r.id }} className="flex items-center gap-2 hover:opacity-80 transition-smooth">
                        <UserAvatar avatarUrl={(r as any).avatar_url} name={r.display_name} size={7} className="rounded-full" />
                        <span className={`inline-flex items-center gap-0.5 font-medium ${isMe ? "text-wc-red" : ""}`}>
                          {r.display_name ?? "Adepto"}{isMe && " (tu)"}
                          <RankTrend currentRank={i + 1} previousRank={r.previous_rank} />
                        </span>
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 text-right font-display text-gold">{r.points}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">{r.predictions_correct}/{r.predictions_made}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">{acc}%</td>
                  </tr>
                );
              })}

              {/* Posição do utilizador fora do top 5 — só quando não está em modo expandido */}
              {!showAll && myPosition && (
                <>
                  <tr className="border-t border-border">
                    <td colSpan={5} className="px-3 py-1 text-center text-[10px] text-muted-foreground tracking-widest" />
                      · · ·
                    </td>
                  </tr>
                  <tr className="border-t border-wc-red/20 bg-wc-red/5">
                    <td className="px-3 py-2.5">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-wc-red/20 text-xs font-bold text-wc-red">
                        {myPosition.rank}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link to="/adepto/$id" params={{ id: myPosition.id }} className="flex items-center gap-2 hover:opacity-80 transition-smooth">
                        <UserAvatar avatarUrl={myPosition.avatar_url} name={myPosition.display_name} size={7} className="rounded-full" />
                        <span className="inline-flex items-center gap-0.5 font-medium text-wc-red">
                          {myPosition.display_name ?? "Tu"} (tu)
                          {user && <RankTrend currentRank={myPosition.rank} previousRank={myPosition.previous_rank} />}
                        </span>
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 text-right font-display text-gold">{myPosition.points}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">{myPosition.predictions_correct}/{myPosition.predictions_made}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">
                      {myPosition.predictions_made > 0 ? Math.round((myPosition.predictions_correct / myPosition.predictions_made) * 100) : 0}%
                    </td>
                  </tr>
                </>
              )}

              {/* Botão ver todos / ver menos */}
              {phase === "geral" && (
                <tr className="border-t border-border">
                  <td colSpan={6} className="px-4 py-3 text-center">
                    <button
                      onClick={() => setShowAll(v => !v)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:border-gold/40 hover:text-gold transition-smooth"
                    >
                      {showAll ? "Ver menos ↑" : `Ver classificação completa ↓`}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>}

      {/* ── RANKING DE LIGAS ───────────────────────────────── */}
      {tab === "ligas" && (
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
