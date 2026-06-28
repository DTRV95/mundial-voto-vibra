import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { LogOut, Trophy, Target, Percent, Pencil, CheckCircle2, XCircle, Loader2, X, Flame, Star, Calendar, ImageIcon, Bell, BarChart2, Zap, TrendingUp, ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { ShareButton, useRankShare } from "@/components/ShareCard";
import { AvatarPicker, UserAvatar } from "@/components/AvatarPicker";
import { toast } from "sonner";
import { TeamBadge } from "@/lib/teamColors.tsx";
import { formatDate } from "@/lib/format";
import { useNotifications, markChatRead, markRankSeen, markFollowSeen } from "@/lib/useNotifications";
import { FollowButton } from "@/components/FollowButton";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Uma Geração" }] }),
  component: Perfil,
});

type MarketStat = { correct: number; total: number };

function Perfil() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/perfil" } });
  }, [user, loading, navigate]);

  const { data: notifs, refetch: refetchNotifs } = useNotifications();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url,total_points,predictions_made,predictions_correct,vote_streak,max_vote_streak")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) console.error("Profile fetch error:", error);
      return data;
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["history", user?.id], enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("predictions")
        .select("id,points,result_90,btts,total_25,total_35,double_chance,exact_home,exact_away,created_at,match:match_id(id,kickoff_at,phase,status,home_score,away_score,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const { data: myPools = [] } = useQuery({
    queryKey: ["my-pools", user?.id], enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("pool_members")
        .select("pool:pool_id(id,name,code)")
        .eq("user_id", user!.id);
      return (data ?? []).map((d: any) => d.pool).filter(Boolean);
    },
  });

  const { data: phaseResults = [] } = useQuery({
    queryKey: ["phase-results", user?.id], enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("phase_results")
        .select("phase,rank,total_points,predictions_made")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: myGlobalRank } = useQuery({
    queryKey: ["global-rank", user?.id], enabled: !!user?.id && !!profile,
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gt("total_points", profile!.total_points ?? 0);
      return (count ?? 0) + 1;
    },
  });

  const DIVISIONS = [
    { label: "1ª Liga", min: 1, max: 10 },
    { label: "2ª Liga", min: 11, max: 25 },
    { label: "Distrital", min: 26, max: 50 },
    { label: "Liga do Zé Povinho", min: 51, max: Infinity },
  ];
  const myRankDivision = DIVISIONS.find(d => (myGlobalRank ?? 999) >= d.min && (myGlobalRank ?? 999) <= d.max)?.label ?? "Liga do Zé Povinho";

  const { share: shareMyRank, Portal: RankSharePortal } = useRankShare({
    displayName: profile?.display_name ?? "Adepto",
    rank: myGlobalRank ?? 1,
    totalPoints: profile?.total_points ?? 0,
    totalUsers: 0,
    division: myRankDivision,
    phase: "Mata-Mata",
  });

  // Edição de nome
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  async function saveAvatar(url: string) {
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user!.id);
    qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    toast.success("Avatar actualizado!");
  }

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [savingName, setSavingName] = useState(false);
  let nameTimer: ReturnType<typeof setTimeout>;

  function startEdit() {
    setNewName(profile?.display_name ?? "");
    setNameStatus("idle");
    setEditing(true);
  }

  async function checkName(val: string) {
    setNewName(val);
    if (val.trim() === profile?.display_name) { setNameStatus("idle"); return; }
    if (val.trim().length < 2) { setNameStatus("idle"); return; }
    clearTimeout(nameTimer);
    setNameStatus("checking");
    nameTimer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .ilike("display_name", val.trim())
        .neq("id", user!.id)
        .maybeSingle();
      setNameStatus(data ? "taken" : "available");
    }, 500);
  }

  async function saveName() {
    if (nameStatus === "taken") return;
    if (newName.trim().length < 2) { toast.error("Nome demasiado curto."); return; }
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: newName.trim() })
      .eq("id", user!.id);
    setSavingName(false);
    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        toast.error("Este nome já está em uso.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Nome actualizado!");
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["profile", user?.id] });
  }

  if (!user) return null;

  const acc = profile && profile.predictions_made > 0
    ? Math.round((profile.predictions_correct / profile.predictions_made) * 100) : 0;

  const pointsHistory = history.filter((h: any) => h.points != null && h.points > 0);
  const bestGame = pointsHistory.length > 0
    ? pointsHistory.reduce((a: any, b: any) => a.points > b.points ? a : b)
    : null;

  const finishedGames = history.filter((h: any) => h.match?.home_score != null);

  // Compute correctness from actual match result (not from points column which may be null)
  function isCorrectResult(h: any): boolean {
    if (!h.result_90) return false;
    const hs = h.match?.home_score; const as_ = h.match?.away_score;
    if (hs == null || as_ == null) return false;
    const actual = hs > as_ ? "home" : hs < as_ ? "away" : "draw";
    return h.result_90 === actual;
  }

  const exactScores = finishedGames.filter((h: any) =>
    h.exact_home != null && h.exact_away != null &&
    h.exact_home === h.match?.home_score && h.exact_away === h.match?.away_score
  ).length;
  const correctGames = finishedGames.filter(isCorrectResult).length;
  const errorGames = finishedGames.filter((h: any) => !isCorrectResult(h) && h.result_90).length;
  // totalPoints: prefer sum from phase_results (scored by backend), fall back to predictions.points
  const totalPointsFromPhases = phaseResults.reduce((s: number, r: any) => s + (r.total_points ?? 0), 0);
  const totalPointsFromPreds  = finishedGames.reduce((s: number, h: any) => s + (h.points ?? 0), 0);
  const totalPoints = totalPointsFromPhases > 0 ? totalPointsFromPhases : totalPointsFromPreds;
  const avgPoints = correctGames > 0 ? (totalPoints / correctGames).toFixed(1) : "—";
  const currentStreak = (profile as any)?.vote_streak ?? 0;
  const maxStreak = (profile as any)?.max_vote_streak ?? 0;

  // Melhor sequência de acertos consecutivos no resultado final
  const sortedFinished = [...finishedGames].sort((a: any, b: any) =>
    new Date(a.match?.kickoff_at ?? 0).getTime() - new Date(b.match?.kickoff_at ?? 0).getTime()
  );
  let bestCorrectStreak = 0;
  let curCorrectStreak = 0;
  for (const g of sortedFinished) {
    if ((g.points ?? 0) > 0) { curCorrectStreak++; bestCorrectStreak = Math.max(bestCorrectStreak, curCorrectStreak); }
    else curCorrectStreak = 0;
  }

  // Estatísticas por mercado com breakdown por opção
  type OptionStat = { label: string; correct: number; total: number };
  type MarketDetail = { correct: number; total: number; options: OptionStat[] };

  const mkOpt = (label: string): OptionStat => ({ label, correct: 0, total: 0 });
  const mktData: Record<string, MarketDetail> = {
    "Resultado final": { correct: 0, total: 0, options: [mkOpt("Vitória casa"), mkOpt("Empate"), mkOpt("Vitória fora")] },
    "Placar exato":    { correct: 0, total: 0, options: [] },
    "Ambas marcam":    { correct: 0, total: 0, options: [mkOpt("Sim"), mkOpt("Não")] },
    "+/- 2.5 golos":   { correct: 0, total: 0, options: [mkOpt("Mais de 2.5"), mkOpt("Menos de 2.5")] },
    "+/- 3.5 golos":   { correct: 0, total: 0, options: [mkOpt("Mais de 3.5"), mkOpt("Menos de 3.5")] },
  };

  for (const h of finishedGames as any[]) {
    const hs = h.match?.home_score ?? null;
    const as_ = h.match?.away_score ?? null;
    if (hs === null || as_ === null) continue;
    const actualResult = hs > as_ ? "home" : hs < as_ ? "away" : "draw";
    const totalGoals = hs + as_;
    const bttsBool = hs > 0 && as_ > 0;

    if (h.result_90) {
      const mkt = mktData["Resultado final"];
      mkt.total++;
      const correct = h.result_90 === actualResult;
      if (correct) mkt.correct++;
      const optIdx = h.result_90 === "home" ? 0 : h.result_90 === "draw" ? 1 : 2;
      mkt.options[optIdx].total++;
      if (correct) mkt.options[optIdx].correct++;
    }
    if (h.exact_home != null && h.exact_away != null) {
      const mkt = mktData["Placar exato"];
      mkt.total++;
      if (h.exact_home === hs && h.exact_away === as_) mkt.correct++;
    }
    if (h.btts) {
      const mkt = mktData["Ambas marcam"];
      mkt.total++;
      const predictedYes = h.btts === "yes";
      const correct = predictedYes === bttsBool;
      if (correct) mkt.correct++;
      const optIdx = predictedYes ? 0 : 1;
      mkt.options[optIdx].total++;
      if (correct) mkt.options[optIdx].correct++;
    }
    if (h.total_25) {
      const mkt = mktData["+/- 2.5 golos"];
      mkt.total++;
      const predictedOver = h.total_25 === "over";
      const actualOver = totalGoals > 2;
      const correct = predictedOver === actualOver;
      if (correct) mkt.correct++;
      const optIdx = predictedOver ? 0 : 1;
      mkt.options[optIdx].total++;
      if (correct) mkt.options[optIdx].correct++;
    }
    if (h.total_35) {
      const mkt = mktData["+/- 3.5 golos"];
      mkt.total++;
      const predictedOver = h.total_35 === "over";
      const actualOver = totalGoals > 3;
      const correct = predictedOver === actualOver;
      if (correct) mkt.correct++;
      const optIdx = predictedOver ? 0 : 1;
      mkt.options[optIdx].total++;
      if (correct) mkt.options[optIdx].correct++;
    }
  }

  const marketList = Object.entries(mktData)
    .filter(([, m]) => m.total >= 1)
    .map(([name, m]) => ({ name, pct: Math.round((m.correct / m.total) * 100), correct: m.correct, total: m.total, options: m.options.filter(o => o.total > 0) }));

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sessão terminada");
    navigate({ to: "/" });
  }

  return (
    <div className="px-5 pt-6 pb-24 md:pb-10 md:px-8 max-w-2xl mx-auto">
      {RankSharePortal}

      {avatarOpen && (
        <AvatarPicker
          current={profile?.avatar_url}
          onSave={saveAvatar}
          onClose={() => setAvatarOpen(false)}
        />
      )}

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl mb-8"
        style={{ background: "linear-gradient(160deg,#0d2a12 0%,#0a1a2e 60%,#1a1000 100%)" }}>
        {/* WC tricolor stripe */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#E61D25 0%,#3CAC3B 50%,#2A398D 100%)" }} />
        {/* Pitch grid overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.035] select-none"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 28px,white 28px,white 29px),repeating-linear-gradient(90deg,transparent,transparent 28px,white 28px,white 29px)" }} />
        {/* Radial glow behind avatar */}
        <div className="pointer-events-none absolute -top-12 -left-12 h-64 w-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle,#c8960c 0%,transparent 70%)" }} />

        <div className="relative px-5 pt-6 pb-0">
          {/* Action buttons top-right */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={shareMyRank}
              title="Partilhar classificação"
              className="rounded-full border border-white/15 bg-white/8 p-2 text-white/50 hover:text-gold hover:border-gold/40 transition-smooth"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={signOut}
              className="rounded-full border border-white/15 bg-white/8 p-2 text-white/50 hover:text-white/80 transition-smooth">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Avatar + name block */}
          <div className="flex items-end gap-4 mb-4">
            <button
              onClick={() => setAvatarOpen(true)}
              className="relative shrink-0 group"
              title="Alterar avatar"
            >
              {/* Gold ring for top 10 */}
              <div className={`absolute -inset-1 rounded-2xl ${(myGlobalRank ?? 999) <= 10 ? "bg-gradient-to-br from-gold/60 to-gold/20" : "bg-white/10"}`} />
              <div className="relative">
                <UserAvatar avatarUrl={profile?.avatar_url} name={profile?.display_name ?? user.email} size={20} />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
            </button>

            <div className="pb-0.5 min-w-0">
              {editing ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <input
                        autoFocus
                        value={newName}
                        onChange={e => checkName(e.target.value)}
                        maxLength={30}
                        className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white outline-none focus:border-white/50 pr-8 w-40 placeholder:text-white/40"
                        placeholder="Novo nome"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {nameStatus === "checking"  && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/60" />}
                        {nameStatus === "available" && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                        {nameStatus === "taken"     && <XCircle className="h-3.5 w-3.5 text-red-400" />}
                      </div>
                    </div>
                    <button onClick={saveName} disabled={savingName || nameStatus === "taken"}
                      className="rounded-lg bg-gold px-2.5 py-1.5 text-xs font-bold text-background disabled:opacity-50">
                      {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
                    </button>
                    <button onClick={() => setEditing(false)} className="text-white/50 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {nameStatus === "taken" && <p className="text-xs text-red-400">Nome já em uso.</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="font-display text-2xl text-white leading-tight truncate">{profile?.display_name ?? "Adepto"}</h1>
                  <button onClick={startEdit} className="text-white/30 hover:text-gold transition-smooth shrink-0">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Rank + division pills */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {myGlobalRank != null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 border border-gold/35 px-2.5 py-0.5 text-[11px] font-bold text-gold">
                    🏆 #{myGlobalRank}º global
                  </span>
                )}
                <span className="rounded-full bg-white/8 border border-white/12 px-2 py-0.5 text-[11px] text-white/50 font-medium">
                  {myRankDivision}
                </span>
                {currentStreak > 1 && (
                  <span className="rounded-full bg-orange-500/15 border border-orange-500/25 px-2 py-0.5 text-[11px] font-bold text-orange-400">
                    🔥 {currentStreak} seguidos
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 border-t border-white/8 mt-2">
            {[
              { label: "Pontos", value: profile?.total_points ?? 0, color: "text-gold" },
              { label: "Previsões", value: profile?.predictions_made ?? 0, color: "text-white" },
              { label: "Acerto", value: `${acc}%`, color: acc >= 50 ? "text-wc-green" : "text-white/70" },
            ].map((s, i) => (
              <div key={i} className={`py-3.5 text-center ${i > 0 ? "border-l border-white/8" : ""}`}>
                <div className={`font-display text-2xl leading-none ${s.color}`}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/35 mt-1.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges */}
      <BadgesSection
        phaseResults={phaseResults as any[]}
        exactScores={exactScores}
        bestCorrectStreak={bestCorrectStreak}
        maxStreak={maxStreak}
        totalPredictions={profile?.predictions_made ?? 0}
        acc={acc}
      />

      {/* Resultados por fase */}
      {phaseResults.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Trophy className="h-4 w-4" /> Resultados por Fase
          </h2>
          <div className="space-y-3">
            {(phaseResults as any[]).map((r: any) => {
              const maxPts = Math.max(...(phaseResults as any[]).map((x: any) => x.total_points ?? 0), 1);
              const pct = Math.round(((r.total_points ?? 0) / maxPts) * 100);
              const label = ({ grupos: "Fase de Grupos", ronda32: "16 Avos", oitavos: "Oitavos", quartos: "Quartos", meias: "Meias-Finais", final: "Final" } as Record<string,string>)[r.phase as string] ?? r.phase;
              return (
                <div key={r.phase} className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
                      <span className="rounded-full bg-gold/10 border border-gold/25 px-2 py-0.5 text-[10px] font-bold text-gold">#{r.rank}º</span>
                    </div>
                    <span className="font-display text-xl text-gold">{r.total_points} <span className="text-xs font-sans text-muted-foreground">pts</span></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">{r.predictions_made} previsões feitas</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Gráfico de evolução de pontos */}
      <PointsEvolutionChart history={history as any[]} />

      {/* Estatísticas gerais */}
      {finishedGames.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <BarChart2 className="h-4 w-4" /> Estatísticas Gerais
          </h2>
          <div className="rounded-2xl border border-border bg-card/60 overflow-hidden divide-y divide-border/40">
            {/* Acertos row */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-wc-green/10 border border-wc-green/20">
                  <CheckCircle2 className="h-4 w-4 text-wc-green" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">Resultados acertados</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">em {finishedGames.filter((h: any) => h.result_90).length} jogos votados</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-display text-2xl text-wc-green">{correctGames}</span>
                <span className="text-xs text-muted-foreground ml-1">{acc > 0 ? `(${acc}%)` : ""}</span>
              </div>
            </div>
            {/* Erros row */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-wc-red/10 border border-wc-red/20">
                  <XCircle className="h-4 w-4 text-wc-red" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">Resultados errados</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">previsões com resultado final</p>
                </div>
              </div>
              <span className="font-display text-2xl text-wc-red shrink-0">{errorGames}</span>
            </div>
            {/* Placares exatos row */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold/10 border border-gold/25">
                  <Target className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">Placares exatos</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">em {finishedGames.length} jogos terminados</p>
                </div>
              </div>
              <span className="font-display text-2xl text-gold shrink-0">{exactScores}</span>
            </div>
            {/* Melhor série row */}
            {bestCorrectStreak > 0 && (
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <Zap className="h-4 w-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-none">Melhor série de acertos</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">acertos consecutivos</p>
                  </div>
                </div>
                <span className="font-display text-2xl text-orange-400 shrink-0">{bestCorrectStreak}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Estatísticas por mercado */}
      {marketList.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Target className="h-4 w-4" /> Acerto por Mercado
          </h2>
          <div className="rounded-2xl border border-border bg-card/60 overflow-hidden divide-y divide-border/50">
            {marketList.map((m) => (
              <div key={m.name} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold">{m.name}</span>
                  <span className="text-sm font-bold text-gold">{m.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
                  <div className="h-full rounded-full bg-gold/60" style={{ width: `${m.pct}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{m.correct} acertos em {m.total} jogos</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notificações */}
      {notifs && notifs.total > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-wc-red" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Notificações</h2>
            <span className="rounded-full bg-wc-red px-2 py-0.5 text-[10px] font-bold text-white">{notifs.total}</span>
            <button
              onClick={() => {
                notifs.items.forEach(n => {
                  if (n.type === "chat") markChatRead(n.poolCode);
                  else if (n.type === "rank") markRankSeen(n.currentRank);
                  else if (n.type === "follow") markFollowSeen(n.id);
                });
                refetchNotifs();
              }}
              className="ml-auto text-[11px] font-semibold text-muted-foreground hover:text-wc-red transition-smooth"
            >
              Limpar tudo
            </button>
          </div>
          <div className="space-y-2">
            {notifs.items.map((notif, i) => {
              if (notif.type === "chat") return (
                <Link
                  key={`chat-${notif.poolCode}`}
                  to="/liga/$code"
                  params={{ code: notif.poolCode }}
                  onClick={() => { markChatRead(notif.poolCode); refetchNotifs(); }}
                  className="block overflow-hidden rounded-2xl border border-wc-red/30 bg-wc-red/5 hover:bg-wc-red/10 transition-smooth"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-wc-red/20">
                    <div className="flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5 text-wc-red" />
                      <span className="text-sm font-bold">{notif.poolName}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-wc-red">{notif.messages.length} mensagem{notif.messages.length !== 1 ? "s" : ""} nova{notif.messages.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {notif.messages.slice(0, 3).map(msg => (
                      <div key={msg.id} className="px-4 py-2">
                        <p className="text-[11px] font-semibold text-muted-foreground">{msg.sender}</p>
                        <p className="text-sm truncate">{msg.body}</p>
                      </div>
                    ))}
                    {notif.messages.length > 3 && (
                      <div className="px-4 py-2 text-[11px] text-muted-foreground">
                        +{notif.messages.length - 3} mensagens...
                      </div>
                    )}
                  </div>
                </Link>
              );

              if (notif.type === "rank") return (
                <button
                  key={`rank-${i}`}
                  onClick={() => { markRankSeen(notif.currentRank); refetchNotifs(); }}
                  className="w-full text-left overflow-hidden rounded-2xl border border-orange-400/30 bg-orange-400/5 hover:bg-orange-400/10 transition-smooth px-4 py-3 flex items-center gap-3"
                >
                  <Trophy className="h-4 w-4 text-orange-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ranking global</p>
                    <p className="text-sm font-semibold">Desceste do #{notif.previousRank}º para o #{notif.currentRank}º lugar</p>
                  </div>
                </button>
              );

              if (notif.type === "follow") return (
                <div
                  key={`follow-${notif.id}`}
                  className="overflow-hidden rounded-2xl border border-wc-blue/30 bg-wc-blue/5 px-4 py-3 flex items-center gap-3"
                >
                  <UserAvatar avatarUrl={notif.followerAvatar} name={notif.followerName} size={9} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Novo seguidor</p>
                    <p className="text-sm font-semibold truncate">{notif.followerName} começou a seguir-te</p>
                  </div>
                  <FollowButton targetId={notif.followerId} size="sm" />
                  <button onClick={() => { markFollowSeen(notif.id); refetchNotifs(); }}
                    className="text-muted-foreground hover:text-foreground transition-smooth">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );

              if (notif.type === "poll") return (
                <Link
                  key={`poll-${notif.poolCode}`}
                  to="/liga/$code"
                  params={{ code: notif.poolCode }}
                  className="flex items-center gap-3 overflow-hidden rounded-2xl border border-gold/30 bg-gold/5 hover:bg-gold/10 transition-smooth px-4 py-3"
                >
                  <span className="text-xl shrink-0">🗳️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{notif.poolName}</p>
                    <p className="text-sm font-semibold">Votação pendente — querem continuar o torneio?</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-gold">Votar →</span>
                </Link>
              );

              return null;
            })}
          </div>
        </section>
      )}

      {/* Torneios */}
      {myPools.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Star className="h-4 w-4" /> Os meus torneios
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {myPools.map((p: any) => (
              <Link key={p.id} to="/liga/$code" params={{ code: p.code }}
                className="shrink-0 rounded-xl border border-border bg-card/70 px-3 py-2 text-sm font-semibold transition-smooth hover:border-gold/40 hover:text-gold whitespace-nowrap">
                🏆 {p.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Melhor jogo */}
      {bestGame && (bestGame as any).match && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Flame className="h-4 w-4" /> Melhor jogo
          </h2>
          <Link to="/jogo/$id" params={{ id: (bestGame as any).match?.id }}
            className="flex items-center justify-between rounded-2xl border border-gold/30 bg-gold/10 p-4 transition-smooth hover:border-gold/60">
            <div className="flex items-center gap-3">
              <TeamBadge code={(bestGame as any).match?.home?.code} flag={(bestGame as any).match?.home?.flag} name={(bestGame as any).match?.home?.name ?? ""} size="sm" />
              <div>
                <p className="font-semibold text-sm">{(bestGame as any).match?.home?.name} vs {(bestGame as any).match?.away?.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate((bestGame as any).match?.kickoff_at)}</p>
              </div>
              <TeamBadge code={(bestGame as any).match?.away?.code} flag={(bestGame as any).match?.away?.flag} name={(bestGame as any).match?.away?.name ?? ""} size="sm" />
            </div>
            <div className="text-right">
              <p className="font-display text-2xl text-gold">{(bestGame as any).points}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">pts</p>
            </div>
          </Link>
        </section>
      )}

      {/* Histórico */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          <Calendar className="h-4 w-4" /> Histórico de Previsões
        </h2>
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <p className="text-2xl mb-2">⚽</p>
            <p className="text-sm text-muted-foreground mb-4">Ainda não tens previsões.</p>
            <Link to="/jogos" className="inline-block rounded-full bg-gold px-5 py-2 text-xs font-semibold text-background">
              Ver jogos
            </Link>
          </div>
        ) : (() => {
          const visible = (historyExpanded ? history : history.slice(0, 3)).filter((h: any) => h.match);
          return (
            <>
              <ul className="space-y-2">
                {visible.map((h: any) => {
                  const hasResult = h.match?.home_score != null && h.match?.away_score != null;
                  const pts = h.points ?? 0;
                  const hs = h.match?.home_score;
                  const as_ = h.match?.away_score;
                  const actualResult = hs != null && as_ != null ? (hs > as_ ? "home" : hs < as_ ? "away" : "draw") : null;
                  const isCorrect = h.result_90 && actualResult && h.result_90 === actualResult;
                  return (
                    <li key={h.id}>
                      <Link to="/jogo/$id" params={{ id: h.match?.id }}
                        className={`flex items-center gap-3 rounded-2xl border bg-card/60 p-3 transition-smooth hover:border-gold/30 group overflow-hidden relative ${
                          hasResult ? (isCorrect ? "border-wc-green/30" : "border-border") : "border-border/60"
                        }`}>
                        {hasResult && <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCorrect ? "bg-wc-green" : "bg-border/50"}`} />}
                        <div className="pl-1 flex items-center gap-1 shrink-0">
                          <TeamBadge code={h.match?.home?.code} flag={h.match?.home?.flag} name={h.match?.home?.name ?? ""} size="sm" />
                          <span className="text-[10px] text-muted-foreground">vs</span>
                          <TeamBadge code={h.match?.away?.code} flag={h.match?.away?.flag} name={h.match?.away?.name ?? ""} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{h.match?.home?.name} vs {h.match?.away?.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-muted-foreground">{formatDate(h.match?.kickoff_at)}</span>
                            {hasResult && <span className="text-[10px] font-bold text-foreground/60">{hs}–{as_}</span>}
                            {h.result_90 && (
                              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                isCorrect ? "bg-wc-green/15 text-wc-green" : hasResult ? "bg-wc-red/10 text-wc-red/70" : "bg-secondary text-muted-foreground"
                              }`}>
                                {h.result_90 === "home" ? "Casa" : h.result_90 === "draw" ? "Empate" : "Fora"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 w-10">
                          {hasResult ? (
                            pts > 0 ? (
                              <span className="font-display text-lg text-gold">+{pts}</span>
                            ) : (
                              isCorrect ? <span className="font-display text-lg text-wc-green">✓</span> : <span className="text-muted-foreground/40 text-lg">—</span>
                            )
                          ) : <span className="text-[10px] text-muted-foreground/40">—</span>}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {history.length > 3 && (
                <button
                  onClick={() => setHistoryExpanded(e => !e)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border bg-card/40 py-2.5 text-xs font-semibold text-muted-foreground transition-smooth hover:border-gold/30 hover:text-gold"
                >
                  {historyExpanded
                    ? <><ChevronUp className="h-3.5 w-3.5" /> Mostrar menos</>
                    : <><ChevronDown className="h-3.5 w-3.5" /> Ver mais {history.length - 3} previsões</>
                  }
                </button>
              )}
            </>
          );
        })()}
      </section>
    </div>
  );
}

function isCorrectResultLocal(h: any): boolean {
  if (!h.result_90) return false;
  const hs = h.match?.home_score; const as_ = h.match?.away_score;
  if (hs == null || as_ == null) return false;
  const actual = hs > as_ ? "home" : hs < as_ ? "away" : "draw";
  return h.result_90 === actual;
}

function PointsEvolutionChart({ history }: { history: any[] }) {
  // All finished games where the user voted on result_90, ordered by date
  const votedGames = [...history]
    .filter(h => h.match?.home_score != null && h.result_90 && h.match?.kickoff_at)
    .sort((a, b) => new Date(a.match.kickoff_at).getTime() - new Date(b.match.kickoff_at).getTime())
    .slice(-40);

  const totalVoted = votedGames.length;
  const totalCorrect = votedGames.filter(isCorrectResultLocal).length;
  const accPct = totalVoted > 0 ? Math.round((totalCorrect / totalVoted) * 100) : 0;

  if (totalVoted === 0) {
    return (
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          <TrendingUp className="h-4 w-4" /> Historial de Resultados
        </h2>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 text-center">
          <p className="text-sm text-muted-foreground">Ainda sem jogos terminados para mostrar.</p>
        </div>
      </section>
    );
  }

  // Cumulative correct line
  let cum = 0;
  const lineData = votedGames.map(h => {
    if (isCorrectResultLocal(h)) cum++;
    return cum;
  });

  const W = 300; const H = 72; const pad = 6;
  const max = Math.max(...lineData, 1);
  const step = lineData.length > 1 ? (W - pad * 2) / (lineData.length - 1) : 0;
  const svgPts = lineData.map((v, i) => ({
    x: lineData.length > 1 ? pad + i * step : W / 2,
    y: H - pad - ((v / max) * (H - pad * 2)),
  }));
  const pathD = svgPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${svgPts[svgPts.length - 1].x.toFixed(1)} ${H} L ${pad} ${H} Z`;

  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
        <TrendingUp className="h-4 w-4" /> Historial de Resultados
      </h2>
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        {/* Summary row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">{totalCorrect} acertos em {totalVoted} jogos</span>
          <span className={`font-display text-lg leading-none ${accPct >= 50 ? "text-wc-green" : "text-wc-red"}`}>{accPct}%</span>
        </div>

        {/* Cumulative line chart */}
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 72, display: "block" }}>
          <defs>
            <linearGradient id="correctFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3CAC3B" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3CAC3B" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.33, 0.66, 1].map(t => (
            <line key={t} x1={pad} x2={W - pad}
              y1={H - pad - t * (H - pad * 2)} y2={H - pad - t * (H - pad * 2)}
              stroke="white" strokeOpacity="0.05" strokeWidth="1" />
          ))}
          <path d={areaD} fill="url(#correctFill)" />
          <path d={pathD} fill="none" stroke="#3CAC3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={svgPts[svgPts.length - 1].x} cy={svgPts[svgPts.length - 1].y}
            r="3.5" fill="#3CAC3B" stroke="#0d1a0f" strokeWidth="1.5" />
        </svg>

        {/* Per-game dots grid */}
        <div className="flex flex-wrap gap-1 mt-3">
          {votedGames.map((h, i) => {
            const ok = isCorrectResultLocal(h);
            return (
              <div
                key={i}
                title={`${h.match?.home?.name ?? "?"} vs ${h.match?.away?.name ?? "?"} — ${ok ? "Acerto ✓" : "Erro ✗"}`}
                className={`h-3 w-3 rounded-sm transition-opacity ${ok ? "bg-wc-green/70" : "bg-wc-red/50"}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-muted-foreground">Mais antigo</span>
          <span className="text-[9px] text-muted-foreground">Mais recente</span>
        </div>
      </div>
    </section>
  );
}

interface BadgeDef {
  emoji: string;
  label: string;
  desc: string;
  color: string; // tailwind bg class tint
}

function BadgesSection({
  phaseResults, exactScores, bestCorrectStreak, maxStreak, totalPredictions, acc,
}: {
  phaseResults: any[]; exactScores: number; bestCorrectStreak: number;
  maxStreak: number; totalPredictions: number; acc: number;
}) {
  const badges: BadgeDef[] = [];

  const gruposResult = phaseResults.find((r: any) => r.phase === "grupos");
  if (gruposResult) {
    if (gruposResult.rank === 1)  badges.push({ emoji: "🥇", label: "Campeão da Fase de Grupos", desc: "1.º lugar no ranking global", color: "bg-gold/10 border-gold/30" });
    else if (gruposResult.rank <= 3) badges.push({ emoji: "🥈", label: "Pódio da Fase de Grupos", desc: `Top 3 global — ${gruposResult.rank}º lugar`, color: "bg-gold/8 border-gold/20" });
    else if (gruposResult.rank <= 10) badges.push({ emoji: "🏅", label: "Top 10 Fase de Grupos", desc: `${gruposResult.rank}º lugar no ranking global`, color: "bg-wc-blue/10 border-wc-blue/25" });
  }

  if (exactScores >= 1)  badges.push({ emoji: "🎯", label: "Atirador de Elite", desc: `${exactScores} placar${exactScores > 1 ? "es" : ""} exato${exactScores > 1 ? "s" : ""}`, color: "bg-wc-red/10 border-wc-red/25" });
  if (exactScores >= 5)  badges.push({ emoji: "🔥", label: "Francotirador", desc: "5+ placares exatos", color: "bg-wc-red/10 border-wc-red/25" });
  if (bestCorrectStreak >= 5) badges.push({ emoji: "⚡", label: "Série Imparável", desc: `${bestCorrectStreak} previsões certas seguidas`, color: "bg-wc-green/10 border-wc-green/25" });
  if (totalPredictions >= 20) badges.push({ emoji: "📅", label: "Viciado", desc: `${totalPredictions} previsões feitas`, color: "bg-wc-blue/10 border-wc-blue/25" });
  if (totalPredictions >= 50) badges.push({ emoji: "📊", label: "Analista", desc: "50+ previsões feitas", color: "bg-wc-blue/10 border-wc-blue/25" });
  if (acc >= 70 && totalPredictions >= 10) badges.push({ emoji: "🧠", label: "Génio Tático", desc: `${acc}% de acerto geral`, color: "bg-wc-green/10 border-wc-green/25" });

  if (badges.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
        <Star className="h-4 w-4" /> Conquistas
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {badges.map((b, i) => (
          <div key={i} className={`relative overflow-hidden rounded-2xl border ${b.color} p-4`}>
            <div className="text-3xl mb-2">{b.emoji}</div>
            <p className="text-xs font-bold text-foreground leading-snug">{b.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatDetail({ icon, value, label, desc, context, colorClass, borderClass, bgClass }: {
  icon: React.ReactNode; value: React.ReactNode; label: string; desc: string;
  context?: string; colorClass: string; borderClass: string; bgClass: string;
}) {
  return (
    <div className={`rounded-2xl border ${borderClass} ${bgClass} p-4 flex items-start gap-3`}>
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className={`font-display text-2xl leading-none ${colorClass}`}>{value}</p>
        {context && <p className="text-[10px] text-muted-foreground/80 mt-0.5">{context}</p>}
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-tight">{desc}</p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur-sm">
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="font-display text-xl text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
    </div>
  );
}
