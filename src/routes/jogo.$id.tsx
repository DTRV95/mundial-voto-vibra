import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { formatDate, formatTime, votingStatus, PHASE_LABEL } from "@/lib/format";
import { toast } from "sonner";
import { Lock, Users2, Info, TrendingUp, ChevronDown, Share2, Check, Trophy, Target, CalendarClock, Wand2, X } from "lucide-react";
import { UserAvatar } from "@/components/AvatarPicker";
import { TeamBadge } from "@/lib/teamColors.tsx";
import { MatchCard, type MatchCardData } from "@/components/MatchCard";

export const Route = createFileRoute("/jogo/$id")({
  head: () => ({
    meta: [
      { title: "Análise & Previsão — Voz do Mundial" },
      { name: "description", content: "Dá a tua previsão e compara com a comunidade." },
      { property: "og:title", content: "Voz do Mundial — Dá a tua previsão!" },
      { property: "og:description", content: "Vota, compara e vibra com a comunidade. Grátis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JogoPage,
});

function JogoPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: match, isLoading } = useQuery({
    queryKey: ["match", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id,kickoff_at,phase,voting_open,home_score,away_score,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code)")
        .eq("id", id).maybeSingle();
      return data;
    },
  });

  const { data: analysis } = useQuery({
    queryKey: ["analysis", id],
    queryFn: async () => {
      const { data } = await supabase.from("match_analysis").select("*").eq("match_id", id).maybeSingle();
      return data;
    },
  });

  const { data: myPrediction } = useQuery({
    queryKey: ["prediction", id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("predictions").select("*").eq("match_id", id).eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: community = [] } = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const { data } = await supabase.from("predictions")
        .select("result_90,btts,total_25,double_chance,combo_15,exact_home,exact_away,qualifier")
        .eq("match_id", id);
      return data ?? [];
    },
  });

  const { data: nextMatches = [] } = useQuery({
    queryKey: ["next-open-matches", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id,kickoff_at,phase,status,voting_open,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code),predictions(count)")
        .eq("voting_open", true)
        .neq("id", id)
        .order("kickoff_at")
        .limit(4);
      return ((data as any) ?? [])
        .filter((m: any) => m.home && m.away)
        .map((m: any) => ({ ...m, votes_count: m.predictions?.[0]?.count ?? 0 }));
    },
  }) as { data: MatchCardData[] };

  const { data: nextVotedIds = new Set<string>() } = useQuery({
    queryKey: ["next-voted-ids", user?.id, id],
    enabled: !!user?.id && nextMatches.length > 0,
    queryFn: async () => {
      const ids = nextMatches.map((m: any) => m.id);
      const { data } = await supabase
        .from("predictions")
        .select("match_id")
        .eq("user_id", user!.id)
        .in("match_id", ids);
      return new Set((data ?? []).map((p: any) => p.match_id));
    },
  });

  const { data: prognostico } = useQuery({
    queryKey: ["prognostico", id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("prognosticos")
        .select("id,suggestion,summary,bullet_points,main_trend,attention_point")
        .eq("match_id", id)
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
  });

  const { data: topScorers = [] } = useQuery({
    queryKey: ["match-top-scorers", id],
    enabled: !!match && (match as any).status === "finished",
    queryFn: async () => {
      const { data: preds } = await supabase
        .from("predictions")
        .select("user_id, points")
        .eq("match_id", id)
        .gt("points", 0)
        .order("points", { ascending: false })
        .limit(10);
      if (!preds || preds.length === 0) return [];
      const userIds = preds.map((p: any) => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
      return preds.map((p: any) => ({ ...profileMap[p.user_id], points: p.points })).filter((p: any) => p.id);
    },
  });

  const [scorelabOpen, setScorelabOpen] = useState(false);
  const [autoFillInfoOpen, setAutoFillInfoOpen] = useState(false);
  const [pred, setPred] = useState<Record<string, any>>({});
  const [shared, setShared] = useState(false);
  const [saved, setSaved] = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const firedWinConfetti = useRef(false);

  async function share() {
    const home = (match?.home as any)?.name ?? "Casa";
    const away = (match?.away as any)?.name ?? "Fora";
    const text = hasVoted
      ? `Já dei a minha previsão em ${home} vs ${away}! E tu? 🏆`
      : `${home} vs ${away} — dá a tua previsão! 🏆`;
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${home} vs ${away} — Voz do Mundial`, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
      toast.success("Link copiado!");
    }
  }

  useEffect(() => { setPred({}); firedWinConfetti.current = false; }, [id]);
  useEffect(() => { setPred(myPrediction ?? {}); }, [myPrediction]);

  // Fire confetti when opening a match you scored on
  useEffect(() => {
    if (!myPrediction || firedWinConfetti.current) return;
    const pts = (myPrediction as any).points ?? 0;
    if (pts > 0) { firedWinConfetti.current = true; setTimeout(fireConfetti, 400); }
  }, [myPrediction]);

  const status = match ? votingStatus(match) : null;
  const closed = !status || status.label === "Fechada";
  const hasVoted = !!myPrediction;
  const showCommunity = hasVoted || closed;

  const [autoFilling, setAutoFilling] = useState(false);

  function set(key: string, value: any) {
    setPred((p) => ({ ...p, [key]: p[key] === value ? null : value }));
  }

  /** Pick the most voted option in the community, or fallback to weighted random */
  function pickFromCommunity<T extends string>(
    votes: (T | null | undefined)[],
    options: T[],
    weights?: number[]  // same order as options, used if no community data
  ): T {
    const counts: Record<string, number> = {};
    for (const v of votes) if (v) counts[v] = (counts[v] ?? 0) + 1;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total >= 3) {
      // pick the most voted option
      return options.reduce((best, opt) =>
        (counts[opt] ?? 0) > (counts[best] ?? 0) ? opt : best
      , options[0]);
    }
    // fallback: weighted random using analysis probs or supplied weights
    const w = weights ?? options.map(() => 1);
    const sum = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < options.length; i++) {
      r -= w[i];
      if (r <= 0) return options[i];
    }
    return options[0];
  }

  // Realistic scores by result, respecting btts
  const SCORES_HOME: [number, number][] = [[1,0],[2,0],[2,1],[3,1],[3,0],[1,0],[2,0]];
  const SCORES_DRAW: [number, number][] = [[1,1],[1,1],[0,0],[2,2],[1,1]];
  const SCORES_AWAY: [number, number][] = [[0,1],[0,2],[1,2],[0,1],[1,3]];
  const SCORES_HOME_BTTS: [number, number][] = [[2,1],[3,1],[3,2],[2,1]];
  const SCORES_AWAY_BTTS: [number, number][] = [[1,2],[1,3],[2,3],[1,2]];
  const SCORES_HOME_NO_BTTS: [number, number][] = [[1,0],[2,0],[3,0],[1,0]];
  const SCORES_AWAY_NO_BTTS: [number, number][] = [[0,1],[0,2],[0,3],[0,1]];

  function pickScore(result: "home" | "draw" | "away", btts: "yes" | "no" | null): [number, number] {
    const pick = (arr: [number, number][]) => arr[Math.floor(Math.random() * arr.length)];
    if (result === "draw") return pick(SCORES_DRAW);
    if (result === "home") {
      if (btts === "yes") return pick(SCORES_HOME_BTTS);
      if (btts === "no")  return pick(SCORES_HOME_NO_BTTS);
      return pick(SCORES_HOME);
    }
    if (btts === "yes") return pick(SCORES_AWAY_BTTS);
    if (btts === "no")  return pick(SCORES_AWAY_NO_BTTS);
    return pick(SCORES_AWAY);
  }

  async function autoFill() {
    if (autoFilling) return;
    setAutoFilling(true);

    const commResult90  = community.map((c: any) => c.result_90);
    const commBtts      = community.map((c: any) => c.btts);
    const commTotal25   = community.map((c: any) => c.total_25);
    const commQualifier = community.map((c: any) => c.qualifier);

    // Weights from ScoreLab or sensible defaults
    const wHome = analysis?.prob_home ?? 42;
    const wDraw = analysis?.prob_draw ?? 26;
    const wAway = analysis?.prob_away ?? 32;
    const wBttsY = analysis?.prob_btts_yes ?? 50;
    const wBttsN = analysis?.prob_btts_no  ?? 50;
    const wO25   = analysis?.prob_over25 ?? 55;
    const wU25   = analysis?.prob_under25 ?? 45;

    const result90  = pickFromCommunity(commResult90,  ["home","draw","away"] as const, [wHome, wDraw, wAway]);
    const btts      = pickFromCommunity(commBtts,      ["yes","no"]           as const, [wBttsY, wBttsN]);
    const total25   = pickFromCommunity(commTotal25,   ["over","under"]       as const, [wO25, wU25]);
    const qualifier = match?.phase !== "grupos"
      ? pickFromCommunity(commQualifier, ["home","away"] as const, result90 === "draw" ? [50,50] : result90 === "home" ? [70,30] : [30,70])
      : null;
    const [exactHome, exactAway] = pickScore(result90 as "home"|"draw"|"away", btts as "yes"|"no");

    // Animate — fill each field sequentially
    const steps: [string, any][] = [
      ["result_90", result90],
      ["btts", btts],
      ["total_25", total25],
      ...(qualifier ? [["qualifier", qualifier] as [string, any]] : []),
      ["exact_home", exactHome],
      ["exact_away", exactAway],
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 0 : 180));
      const [key, val] = steps[i];
      setPred(p => ({ ...p, [key]: val }));
    }

    setAutoFilling(false);
    toast.success("Previsão preenchida! Revê e guarda quando quiseres.", { duration: 3000 });
  }

  function fireConfetti() {
    if (typeof document === "undefined") return;
    const styleId = "__confetti_style__";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(120px) rotate(720deg) scale(0.5); opacity: 0; }
        }
        @keyframes confettiRise {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(-140px) rotate(-540deg) scale(0.4); opacity: 0; }
        }
        .__confetti { position: fixed; pointer-events: none; z-index: 9999; border-radius: 2px; }
      `;
      document.head.appendChild(style);
    }
    const colors = ["#E61D25", "#3CAC3B", "#2A398D", "#D4A843"];
    const btn = document.querySelector("[data-save-btn]");
    const rect = btn?.getBoundingClientRect() ?? { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 30; i++) {
      const el = document.createElement("div");
      el.className = "__confetti";
      const color = colors[i % colors.length];
      const size = 6 + Math.random() * 7;
      const xOff = (Math.random() - 0.5) * 200;
      const rise = Math.random() > 0.4;
      el.style.cssText = `
        left: ${cx + xOff}px; top: ${cy}px;
        width: ${size}px; height: ${size * (0.4 + Math.random() * 0.8)}px;
        background: ${color};
        animation: ${rise ? "confettiRise" : "confettiFall"} ${0.9 + Math.random() * 0.6}s ease-out forwards;
        animation-delay: ${Math.random() * 0.2}s;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1800);
    }
  }

  async function sharePrediction() {
    const homeName = (match?.home as any)?.name ?? "Casa";
    const awayName = (match?.away as any)?.name ?? "Fora";

    const result90Labels: Record<string, string> = {
      home: `Vitória de ${homeName}`,
      draw: "Empate",
      away: `Vitória de ${awayName}`,
    };
    const bttsLabels: Record<string, string> = { yes: "Ambas marcam", no: "Nem ambas marcam" };
    const total25Labels: Record<string, string> = { over: "+2.5 golos", under: "-2.5 golos" };
    const total35Labels: Record<string, string> = { over: "+3.5 golos", under: "-3.5 golos" };

    const lines: string[] = [`🏆 A minha previsão para ${homeName} vs ${awayName}:`];

    if (pred.result_90) lines.push(`⚽ ${result90Labels[pred.result_90] ?? pred.result_90}`);
    if (pred.btts) lines.push(`🎯 ${bttsLabels[pred.btts] ?? pred.btts}`);
    if (pred.total_25) lines.push(`📊 ${total25Labels[pred.total_25] ?? pred.total_25}`);
    if (pred.total_35) lines.push(`📊 ${total35Labels[pred.total_35] ?? pred.total_35}`);
    if (pred.exact_home != null && pred.exact_away != null) {
      lines.push(`🔢 Resultado exato: ${pred.exact_home}-${pred.exact_away}`);
    }
    lines.push("Vota também no Uma Geração: https://mundial-voto-vibra.davidvilaverde.workers.dev/jogos");

    const text = lines.join("\n");

    if (navigator.share) {
      await navigator.share({ title: `${homeName} vs ${awayName} — Previsão`, text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Previsão copiada!");
    }
  }

  async function save() {
    if (!user) { navigate({ to: "/auth", search: { redirect: `/jogo/${id}` } }); return; }
    if (closed) return;
    const payload = {
      user_id: user.id, match_id: id,
      result_90: pred.result_90 ?? null, btts: pred.btts ?? null,
      total_25: pred.total_25 ?? null,
      double_chance: pred.double_chance ?? null,
      exact_home: pred.exact_home ?? null, exact_away: pred.exact_away ?? null,
      combo_15: pred.combo_15 ?? null,
      qualifier: pred.qualifier ?? null,
    } as any;
    const { error } = await supabase.from("predictions").upsert(payload, { onConflict: "user_id,match_id" });
    if (error) { toast.error(error.message); return; }
    toast.success("Previsão guardada!");
    fireConfetti();
    setSaved(true);
    setJustVoted(true);
    setTimeout(() => setSaved(false), 2000);
    qc.invalidateQueries({ queryKey: ["prediction", id] });
    qc.invalidateQueries({ queryKey: ["community", id] });
  }

  if (isLoading) return <div className="px-5 pt-6"><div className="h-40 shimmer rounded-2xl" /></div>;
  if (!match) return <div className="px-5 pt-10 text-center text-muted-foreground">Jogo não encontrado.</div>;

  const home = (match.home as any) ?? { name: "?", flag: "⚽", code: "" };
  const away = (match.away as any) ?? { name: "?", flag: "⚽", code: "" };

  return (
    <div className="px-4 pt-4 pb-10 md:px-8">

      {/* Nav bar */}
      <div className="flex items-center justify-between mb-3">
        <Link to="/jogos" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-smooth">
          ← Jogos
        </Link>
        <button onClick={share} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-gold/40 hover:text-gold transition-smooth">
          {shared ? <Check className="h-3.5 w-3.5 text-wc-green" /> : <Share2 className="h-3.5 w-3.5" />}
          {shared ? "Copiado!" : "Partilhar"}
        </button>
      </div>

      {/* Match header */}
      <header className="mt-3 overflow-hidden rounded-3xl relative">
        {/* tricolor bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#E61D25 0%,#3CAC3B 50%,#2A398D 100%)" }} />
        {/* dark pitch bg */}
        <div className="relative px-5 pt-5 pb-0" style={{ background: "linear-gradient(160deg, oklch(0.22 0.09 155) 0%, oklch(0.16 0.06 165) 100%)" }}>
          {/* subtle pitch grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 29px,rgba(255,255,255,1) 29px,rgba(255,255,255,1) 30px),repeating-linear-gradient(90deg,transparent,transparent 29px,rgba(255,255,255,1) 29px,rgba(255,255,255,1) 30px)" }} />

          {/* Phase + status row */}
          <div className="relative flex items-center justify-between mb-5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">{PHASE_LABEL[match.phase] ?? match.phase}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              status?.tone === "primary" ? "border-wc-green/50 bg-wc-green/15 text-wc-green"
                : status?.tone === "gold" ? "border-gold/50 bg-gold/15 text-gold"
                : "border-red-500/50 bg-red-500/15 text-red-400"
            }`}>{status?.label}</span>
          </div>

          {/* Teams + score */}
          <div className="relative flex items-center justify-between gap-2 pb-6">
            <TeamBlock flag={home.flag} name={home.name} code={home.code} />
            <div className="flex flex-col items-center gap-1 shrink-0">
              {match.home_score != null && match.away_score != null ? (
                <>
                  <div className="font-display text-5xl leading-none text-white tabular-nums">
                    {match.home_score} <span className="text-white/30">:</span> {match.away_score}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.18em] text-gold font-bold mt-1">Resultado Final</div>
                  <div className="text-[9px] uppercase tracking-widest text-white/30 mt-0.5">{formatDate(match.kickoff_at)}</div>
                </>
              ) : (
                <>
                  <div className="font-display text-4xl text-gold leading-none">{formatTime(match.kickoff_at)}</div>
                  <div className="text-[9px] uppercase tracking-widest text-white/40 mt-1">{formatDate(match.kickoff_at)}</div>
                </>
              )}
            </div>
            <TeamBlock flag={away.flag} name={away.name} code={away.code} />
          </div>
        </div>
        {/* bottom info bar */}
        <div className="flex items-center gap-2 bg-muted/40 border-t border-border/50 px-4 py-2 text-[11px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 text-gold shrink-0" />
          Todas as previsões são para o tempo regulamentar (90 minutos).
        </div>
      </header>

      {/* Auth prompt */}
      {!authLoading && !user && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-gold/35 bg-gradient-to-r from-gold/8 to-transparent">
          <div className="h-1 w-full wc-tricolor" />
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-bold text-sm text-foreground">Entra para votar</p>
              <p className="text-xs text-muted-foreground mt-0.5">Desbloqueia a opinião da comunidade.</p>
            </div>
            <Link to="/auth" search={{ redirect: `/jogo/${id}` }} className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-background shrink-0">
              Entrar →
            </Link>
          </div>
        </div>
      )}

      {/* ── Previsão ScoreLab colapsável ── */}
      {analysis && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-gold/30 bg-gold/5">
          <button
            onClick={() => setScorelabOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 transition-smooth hover:bg-gold/10"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold" />
              <span className="font-display text-base text-gold">Previsão ScoreLab</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold/50">Powered by ScoreLab</span>
              <ChevronDown className={`h-4 w-4 text-gold transition-transform duration-200 ${scorelabOpen ? "rotate-180" : ""}`} />
            </div>
          </button>
          {scorelabOpen && (
            <div className="border-t border-gold/20 px-4 py-4 space-y-3">
              <SLRow label="Resultado 90 min" entries={[
                { label: home.name, pct: analysis.prob_home },
                { label: "Empate", pct: analysis.prob_draw },
                { label: away.name, pct: analysis.prob_away },
              ]} />
              <SLRow label="Ambas marcam" entries={[
                { label: "Sim", pct: analysis.prob_btts_yes },
                { label: "Não", pct: analysis.prob_btts_no },
              ]} />
              <SLRow label="Total 2.5" entries={[
                { label: "Mais", pct: analysis.prob_over25 },
                { label: "Menos", pct: analysis.prob_under25 },
              ]} />
              <SLRow label="Total 3.5" entries={[
                { label: "Mais", pct: analysis.prob_over35 },
                { label: "Menos", pct: analysis.prob_under35 },
              ]} />
            </div>
          )}
        </div>
      )}

      {/* ── Prognóstico editorial ── */}
      {prognostico && <PrognosticoCard prog={prognostico} />}

      {/* ── Markets ── */}
      <section className="mt-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-bold text-foreground">A tua previsão</p>
            <p className="text-[10px] text-muted-foreground">Selecciona uma opção em cada mercado</p>
          </div>
          <div className="flex items-center gap-2">
            {!hasVoted && (
              <button
                onClick={autoFill}
                disabled={autoFilling || closed}
                title={closed ? "Votação fechada" : "Preencher automaticamente com base na comunidade"}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                  autoFilling
                    ? "border-gold/30 bg-gold/8 text-gold/50 cursor-wait"
                    : closed
                    ? "border-border/40 bg-secondary/20 text-muted-foreground cursor-not-allowed opacity-50"
                    : "border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/60"
                }`}
              >
                <Wand2 className={`h-3 w-3 ${autoFilling ? "animate-spin" : ""}`} />
                {autoFilling ? "A preencher…" : "Auto-fill"}
              </button>
            )}
            {/* Auto-fill info popup */}
            {autoFillInfoOpen && (
              <div
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setAutoFillInfoOpen(false)}
              >
                <div
                  className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => setAutoFillInfoOpen(false)}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-smooth"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="rounded-full bg-gold/15 border border-gold/30 p-2">
                      <Wand2 className="h-4 w-4 text-gold" />
                    </span>
                    <h2 className="font-display text-lg text-foreground">Auto-fill</h2>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>
                      O <span className="font-semibold text-foreground">Auto-fill</span> preenche automaticamente todos os mercados do jogo com base em dados reais.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-gold">①</span>
                        <p><span className="font-semibold text-foreground">Votos da comunidade</span> — se já existirem 3 ou mais votos, escolhe a opção mais votada.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-gold">②</span>
                        <p><span className="font-semibold text-foreground">Probabilidades ScoreLab</span> — em alternativa, usa as probabilidades reais do jogo como pesos para a escolha.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-gold">③</span>
                        <p><span className="font-semibold text-foreground">Resultado coerente</span> — o placar exato é gerado de forma realista e consistente com o resultado e BTTS selecionados.</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground/60 pt-1">
                      Podes sempre editar qualquer campo depois do preenchimento automático.
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoFillInfoOpen(false)}
                    className="mt-5 w-full rounded-xl bg-gold/15 border border-gold/30 py-2 text-sm font-semibold text-gold hover:bg-gold/25 transition-smooth"
                  >
                    Percebido!
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <MarketCard title="Resultado em 90 minutos" closed={closed} pts="3–4 pts"
          communityCount={community.length} showCommunity={showCommunity}>
          <VoteOptions value={pred.result_90} disabled={closed}
            options={[
              { v: "home", label: home.name, pct: analysis?.prob_home },
              { v: "draw", label: "Empate", pct: analysis?.prob_draw },
              { v: "away", label: away.name, pct: analysis?.prob_away },
            ]}
            onChange={(v) => set("result_90", v)} />
          {showCommunity && <CommunityLine votes={community.map(c => c.result_90)}
            labels={{ home: home.name, draw: "Empate", away: away.name }} total={community.length} animate={justVoted} />}
        </MarketCard>

        <MarketCard title="Ambas as equipas marcam" closed={closed} pts="2 pts"
          communityCount={community.length} showCommunity={showCommunity}>
          <VoteOptions value={pred.btts} disabled={closed}
            options={[
              { v: "yes", label: "Sim", pct: analysis?.prob_btts_yes },
              { v: "no", label: "Não", pct: analysis?.prob_btts_no },
            ]}
            onChange={(v) => set("btts", v)} />
          {showCommunity && <CommunityLine votes={community.map(c => c.btts)}
            labels={{ yes: "Sim", no: "Não" }} total={community.length} animate={justVoted} />}
        </MarketCard>

        <MarketCard title="Total de golos" closed={closed} pts="2 pts"
          communityCount={community.length} showCommunity={showCommunity}>
          <VoteOptions value={pred.total_25} disabled={closed}
            options={[
              { v: "over", label: "Mais de 2.5", pct: analysis?.prob_over25 },
              { v: "under", label: "Menos de 2.5", pct: analysis?.prob_under25 },
            ]}
            onChange={(v) => set("total_25", v)} />
          {showCommunity && <CommunityLine votes={community.map(c => c.total_25)}
            labels={{ over: "Mais de 2.5", under: "Menos de 2.5" }} total={community.length} animate={justVoted} />}
        </MarketCard>

        {match.phase !== "grupos" && (
          <MarketCard title="Quem se apura?" closed={closed} pts="4 pts"
            communityCount={community.length} showCommunity={showCommunity}>
            <VoteOptions value={pred.qualifier} disabled={closed}
              options={[
                { v: "home", label: home.name },
                { v: "away", label: away.name },
              ]}
              onChange={(v) => set("qualifier", v)} />
            {showCommunity && <CommunityLine votes={community.map((c: any) => c.qualifier)}
              labels={{ home: home.name, away: away.name }} total={community.length} animate={justVoted} />}
          </MarketCard>
        )}

        <MarketCard title="Resultado correto" subtitle="Ao fim dos 90 minutos" closed={closed} pts="10 pts 🔥">
          {showCommunity && community.filter(c => c.exact_home != null).length > 0 && (
            <ExactScoreCommunity votes={community} />
          )}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">{home.name}</span>
              <ScoreInput value={pred.exact_home} onChange={(v) => setPred(p => ({ ...p, exact_home: v }))} disabled={closed} />
            </div>
            <span className="font-display text-3xl text-muted-foreground mt-5">:</span>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">{away.name}</span>
              <ScoreInput value={pred.exact_away} onChange={(v) => setPred(p => ({ ...p, exact_away: v }))} disabled={closed} />
            </div>
          </div>
        </MarketCard>

      </section>

      {/* After voting — prediction summary */}
      {hasVoted && justVoted && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-wc-green/30 bg-wc-green/5 animate-scale-in">
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#E61D25,#3CAC3B,#2A398D)" }} />
          <div className="px-4 py-3">
            <p className="text-xs font-bold text-wc-green uppercase tracking-widest mb-2">✓ A tua previsão</p>
            <div className="flex flex-wrap gap-2">
              {pred.result_90 && <span className="rounded-full bg-gold/10 border border-gold/25 px-2.5 py-0.5 text-xs font-semibold text-gold">
                ⚽ {pred.result_90 === "home" ? home.name : pred.result_90 === "away" ? away.name : "Empate"}
              </span>}
              {pred.btts && <span className="rounded-full bg-secondary/60 border border-border/50 px-2.5 py-0.5 text-xs font-semibold text-foreground/70">
                {pred.btts === "yes" ? "Ambas marcam" : "Não ambas marcam"}
              </span>}
              {pred.total_25 && <span className="rounded-full bg-secondary/60 border border-border/50 px-2.5 py-0.5 text-xs font-semibold text-foreground/70">
                {pred.total_25 === "over" ? "+2.5 golos" : "-2.5 golos"}
              </span>}
              {pred.exact_home != null && pred.exact_away != null && <span className="rounded-full bg-wc-red/10 border border-wc-red/25 px-2.5 py-0.5 text-xs font-bold text-wc-red">
                🎯 {pred.exact_home}:{pred.exact_away}
              </span>}
            </div>
          </div>
        </div>
      )}

      {/* Contra a corrente */}
      {(() => {
        if (!myPrediction || !match || match.home_score == null) return null;
        const myPts = (myPrediction as any).points ?? 0;
        if (myPts === 0) return null;
        const myResult = (myPrediction as any).result_90;
        if (!myResult || community.length < 5) return null;
        const votes = community.map((c: any) => c.result_90).filter(Boolean);
        if (votes.length === 0) return null;
        const counts: Record<string, number> = {};
        for (const v of votes) counts[v] = (counts[v] ?? 0) + 1;
        const majorityOption = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
        const majorityPct = Math.round((majorityOption[1] / votes.length) * 100);
        if (majorityOption[0] === myResult || majorityPct < 60) return null;
        return (
          <div className="mt-4 mb-4 animate-scale-in overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-r from-gold/8 via-gold/4 to-transparent">
            <div className="h-1 w-full wc-tricolor rounded-t-2xl" />
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-2xl shrink-0">🦁</span>
              <div>
                <p className="text-xs font-bold text-gold uppercase tracking-widest">Contra a Corrente!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {majorityPct}% da comunidade votou diferente — e tu acertaste. Isso é intuição!
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Top pontuadores do jogo */}
      {topScorers.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold" />
            <h3 className="font-display text-lg">Melhores previsões</h3>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card/70 divide-y divide-border/50">
            {topScorers.map((u: any, i: number) => (
              <Link key={u.id} to="/adepto/$id" params={{ id: u.id }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-smooth"
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  i === 0 ? "bg-gold text-background" : i === 1 ? "bg-gold/40 text-gold" : i === 2 ? "bg-gold/20 text-gold" : "bg-secondary text-muted-foreground"
                }`}>
                  {i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}
                </span>
                <UserAvatar avatarUrl={u.avatar_url} name={u.display_name} size={7} className="rounded-full shrink-0" />
                <span className="flex-1 text-sm font-semibold truncate">{u.display_name}</span>
                <span className="shrink-0 font-display text-lg text-gold">+{u.points} <span className="text-xs font-sans text-muted-foreground">pts</span></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Save */}
      <div className="sticky bottom-20 md:bottom-6 mt-6 px-0">
        <div className="rounded-2xl overflow-hidden shadow-[0_8px_32px_oklch(0_0_0_/0.3)]">
          <button data-save-btn onClick={save} disabled={closed || saved}
            className={`w-full py-4 font-bold text-base transition-all duration-200 ${
              saved
                ? "bg-wc-green text-white"
                : closed
                ? "bg-secondary text-muted-foreground cursor-not-allowed"
                : "bg-gold text-background hover:brightness-110 active:scale-[0.99]"
            }`}>
            {saved ? "✓ Previsão Guardada!" : closed ? "🔒 Votação Fechada" : hasVoted ? "Atualizar Previsão" : "Guardar Previsão →"}
          </button>
        </div>
      </div>

      {hasVoted && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={sharePrediction}
            className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-gold transition-smooth hover:bg-gold/20"
          >
            <Share2 className="h-4 w-4" />
            Partilhar previsão
          </button>
        </div>
      )}

      {!showCommunity && (
        <div className="mt-4 rounded-2xl border border-border/50 bg-secondary/20 p-4 text-center">
          <Lock className="mx-auto mb-1.5 h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Vota para desbloquear a opinião da comunidade.</p>
        </div>
      )}

      {/* Próximos jogos a votar */}
      {nextMatches.length > 0 && (
        <aside className="mt-8 pt-6 border-t border-border">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display text-lg">Próximos jogos</h3>
            </div>
            <Link to="/jogos" className="text-xs font-semibold text-gold hover:text-gold/80 transition-smooth">
              Ver todos →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {nextMatches.map((m: MatchCardData) => (
              <MatchCard key={m.id} match={{ ...m, already_voted: nextVotedIds.has(m.id) }} />
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}

/* ── Prognóstico ─────────────────────────────────────────── */

function PrognosticoCard({ prog }: { prog: any }) {
  const [open, setOpen] = useState(false);
  const bullets: string[] = Array.isArray(prog.bullet_points) ? prog.bullet_points : [];

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card"
      style={{ boxShadow: "0 2px 12px oklch(0 0 0 / 0.18)" }}>
      {/* Header com gradiente escuro */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-3.5 transition-smooth hover:brightness-110"
        style={{ background: "linear-gradient(135deg, oklch(0.22 0.04 250) 0%, oklch(0.18 0.06 270) 100%)" }}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10">
            <Target className="h-4 w-4 text-white/80" />
          </div>
          <div className="text-left">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/40 leading-none mb-1">Prognóstico</p>
            <p className="text-sm font-bold text-white leading-none">{prog.suggestion}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 py-4 space-y-4">
          {/* Resumo */}
          {prog.summary && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resumo</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{prog.summary}</p>
            </div>
          )}

          {/* Pontos Essenciais */}
          {bullets.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pontos Essenciais</p>
              <ul className="space-y-2">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85">
                    <span className="mt-2 h-1 w-4 shrink-0 rounded-full bg-wc-blue/60" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tendência Principal */}
          {prog.main_trend && (
            <div className="rounded-xl border border-wc-green/25 bg-wc-green/5 px-3 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-wc-green">Tendência Principal</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{prog.main_trend}</p>
            </div>
          )}

          {/* Ponto de Atenção */}
          {prog.attention_point && (
            <div className="rounded-xl border border-gold/30 bg-gold/8 px-3 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gold">Ponto de Atenção</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{prog.attention_point}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Components ─────────────────────────────────────────── */

function TeamBlock({ flag, name, code }: { flag: string | null; name: string; code?: string | null }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 min-w-0">
      <TeamBadge code={code ?? null} flag={flag} name={name} size="lg" />
      <span className="text-xs font-bold text-center text-white leading-tight line-clamp-2 px-1">{name}</span>
    </div>
  );
}

function MarketCard({ title, subtitle, closed, pts, children, communityCount = 0, showCommunity = false }: {
  title: string; subtitle?: string; closed: boolean; pts?: string; children: React.ReactNode;
  communityCount?: number; showCommunity?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      {/* header row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-secondary/20">
        <div>
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
          {subtitle && <p className="text-[10px] text-muted-foreground/70 mt-0.5 uppercase tracking-wider">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {pts && <span className="rounded-full bg-gold/15 border border-gold/25 px-2 py-0.5 text-[10px] font-bold text-gold">{pts}</span>}
          {closed && <Lock className="h-3 w-3 text-muted-foreground/60" />}
        </div>
      </div>
      <div className="p-4 space-y-3">
        {children}
        {/* teaser when not yet voted */}
        {!showCommunity && communityCount > 0 && (
          <div className="rounded-xl border border-border/40 bg-secondary/30 px-3 py-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Users2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Comunidade</span>
              </div>
              <span className="text-[10px] font-bold text-gold">{communityCount} votos</span>
            </div>
            <div className="space-y-1.5 blur-sm pointer-events-none select-none">
              <div className="flex items-center gap-2"><div className="w-14 h-1.5 rounded-full bg-border/50 shrink-0" /><div className="flex-1 h-1.5 rounded-full bg-border/50"><div className="h-full w-[58%] rounded-full bg-gold/40" /></div><div className="w-6 h-1.5 rounded-full bg-border/40" /></div>
              <div className="flex items-center gap-2"><div className="w-14 h-1.5 rounded-full bg-border/50 shrink-0" /><div className="flex-1 h-1.5 rounded-full bg-border/50"><div className="h-full w-[28%] rounded-full bg-border/60" /></div><div className="w-6 h-1.5 rounded-full bg-border/40" /></div>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-2">🔒 Vota para revelar</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SLRow({ label, entries }: { label: string; entries: { label: string; pct: number }[] }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {entries.filter(e => e.pct > 0).map((e) => (
          <span key={e.label} className="text-xs">
            <span className="text-foreground/70">{e.label}</span>
            {" "}
            <span className="font-bold text-gold">{e.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function VoteOptions({ value, options, onChange, disabled, grid = 0 }: {
  value: any;
  options: { v: string; label: string; pct?: number }[];
  onChange: (v: string) => void;
  disabled?: boolean;
  grid?: number;
}) {
  const cols = grid === 2 ? "grid-cols-2" : options.length === 3 ? "grid-cols-3" : "grid-cols-2";
  const hasPcts = options.some(o => o.pct != null && o.pct > 0);
  return (
    <div className={`grid gap-2 ${cols}`}>
      {options.map((o) => {
        const active = value === o.v;
        return (
          <button key={o.v} type="button" disabled={disabled} onClick={() => onChange(o.v)}
            className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border py-3.5 px-2 transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              active
                ? "border-gold bg-gold text-background shadow-[0_0_12px_oklch(0.75_0.18_85_/_0.35)]"
                : "border-border/60 bg-secondary/40 hover:border-gold/40 hover:bg-secondary/60"
            }`}>
            {active && <span className="absolute top-1.5 right-1.5 text-[8px]">✓</span>}
            <span className={`text-xs font-bold leading-tight text-center ${active ? "text-background" : "text-foreground"}`}>{o.label}</span>
            {hasPcts && o.pct != null && o.pct > 0 && (
              <span className={`text-[10px] font-semibold ${active ? "text-background/65" : "text-muted-foreground"}`}>
                {o.pct}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function CommunityLine({ votes, labels, total, animate = false }: {
  votes: (string | null)[]; labels: Record<string, string>; total: number; animate?: boolean;
}) {
  const filtered = votes.filter(Boolean) as string[];
  const n = filtered.length || 1;
  const counts: Record<string, number> = {};
  filtered.forEach((v) => (counts[v] = (counts[v] ?? 0) + 1));

  const parts = Object.entries(labels).map(([k, label]) => {
    const pct = Math.round(((counts[k] ?? 0) / n) * 100);
    return { key: k, label, pct };
  });

  const maxPct = Math.max(...parts.map(p => p.pct));
  const [revealed, setRevealed] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(t);
  }, [animate]);

  return (
    <div className={`rounded-xl border px-3 py-2.5 transition-all duration-300 ${animate ? "border-gold/30 bg-gold/5" : "border-border/50 bg-secondary/20"}`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Users2 className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Opinião da Comunidade
          </span>
        </div>
        <span className="text-[11px] font-bold text-gold">{total} {total === 1 ? "voto" : "votos"}</span>
      </div>
      <div className="space-y-2">
        {parts.map(({ label, pct }, i) => {
          const isTop = pct === maxPct && pct > 0;
          return (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground w-20 shrink-0 truncate">
                {isTop && <span className="mr-0.5">🏆</span>}{label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-border/50 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isTop ? "bg-gold" : "bg-muted-foreground/40"}`}
                  style={{
                    width: revealed ? `${pct}%` : "0%",
                    transition: `width ${500 + i * 120}ms cubic-bezier(0.16,1,0.3,1)`,
                  }}
                />
              </div>
              <span className={`text-xs font-bold w-9 text-right tabular-nums ${isTop ? "text-gold" : "text-muted-foreground"}`}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreInput({ value, onChange, disabled }: { value: any; onChange: (v: number | null) => void; disabled?: boolean }) {
  const hasValue = value != null;
  const num = value ?? 0;
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" disabled={disabled || !hasValue}
        onClick={() => num <= 0 ? onChange(null) : onChange(num - 1)}
        className="h-9 w-9 rounded-xl border border-border bg-secondary/50 text-base font-bold text-muted-foreground hover:border-gold/40 hover:text-gold active:scale-90 disabled:opacity-25 transition-smooth">
        −
      </button>
      <div className="h-14 w-12 rounded-xl border border-border bg-input/60 flex items-center justify-center font-display text-2xl">
        {hasValue ? num : <span className="text-muted-foreground/30 text-lg">—</span>}
      </div>
      <button type="button" disabled={disabled || num >= 20}
        onClick={() => onChange(num + 1)}
        className="h-9 w-9 rounded-xl border border-border bg-secondary/50 text-base font-bold text-muted-foreground hover:border-gold/40 hover:text-gold active:scale-90 disabled:opacity-25 transition-smooth">
        +
      </button>
    </div>
  );
}

function ExactScoreCommunity({ votes }: { votes: any[] }) {
  const counts: Record<string, number> = {};
  votes.forEach((v) => {
    if (v.exact_home != null && v.exact_away != null) {
      const key = `${v.exact_home}-${v.exact_away}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {sorted.map(([score, n], i) => {
        const isTop = i === 0;
        return (
          <span key={score} className={`rounded-full border px-3 py-1 text-xs font-bold ${
            isTop
              ? "border-gold/40 bg-gold/10 text-gold"
              : "border-border/50 bg-secondary/40 text-muted-foreground"
          }`}>
            {score.replace("-", " : ")}
            <span className={`ml-1 text-[10px] font-semibold ${isTop ? "text-gold/70" : "text-muted-foreground/60"}`}>
              {Math.round((n / total) * 100)}%
            </span>
          </span>
        );
      })}
    </div>
  );
}
