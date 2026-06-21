import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { formatDate, formatTime, votingStatus, PHASE_LABEL } from "@/lib/format";
import { toast } from "sonner";
import { Lock, Users2, Info, TrendingUp, ChevronDown, Share2, Check, Trophy, Target } from "lucide-react";
import { UserAvatar } from "@/components/AvatarPicker";
import { TeamBadge } from "@/lib/teamColors.tsx";

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
        .select("result_90,btts,total_25,total_35,double_chance,combo_15,combo_35,exact_home,exact_away")
        .eq("match_id", id);
      return data ?? [];
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
  const [pred, setPred] = useState<Record<string, any>>({});

  const [shared, setShared] = useState(false);
  const [saved, setSaved] = useState(false);

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

  useEffect(() => { if (myPrediction) setPred(myPrediction); }, [myPrediction]);

  const status = match ? votingStatus(match) : null;
  const closed = !status || status.label === "Fechada";
  const hasVoted = !!myPrediction;
  const showCommunity = hasVoted || closed;

  function set(key: string, value: any) {
    setPred((p) => ({ ...p, [key]: p[key] === value ? null : value }));
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
      total_25: pred.total_25 ?? null, total_35: pred.total_35 ?? null,
      double_chance: pred.double_chance ?? null,
      exact_home: pred.exact_home ?? null, exact_away: pred.exact_away ?? null,
      combo_15: pred.combo_15 ?? null, combo_35: pred.combo_35 ?? null,
    };
    const { error } = await supabase.from("predictions").upsert(payload, { onConflict: "user_id,match_id" });
    if (error) { toast.error(error.message); return; }
    toast.success("Previsão guardada!");
    fireConfetti();
    setSaved(true);
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
      <div className="flex items-center justify-between">
        <Link to="/jogos" className="text-xs text-muted-foreground">← Jogos</Link>
        <button
          onClick={share}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-smooth hover:border-gold/40 hover:text-gold"
        >
          {shared ? <Check className="h-3.5 w-3.5 text-primary" /> : <Share2 className="h-3.5 w-3.5" />}
          {shared ? "Copiado!" : "Partilhar"}
        </button>
      </div>

      {/* Match header */}
      <header className="mt-3 overflow-hidden rounded-2xl border border-border bg-card/70 pitch-lines">
        <div className="bg-gradient-to-b from-[oklch(0.30_0.10_155/0.4)] to-transparent p-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-gold">{PHASE_LABEL[match.phase] ?? match.phase}</span>
            <span className={`rounded-full border px-2.5 py-0.5 font-semibold uppercase tracking-wider text-xs ${
              status?.tone === "primary" ? "border-primary/40 bg-primary/15 text-primary"
                : status?.tone === "gold" ? "border-gold/40 bg-gold/15 text-gold"
                : "border-destructive/40 bg-destructive/15 text-destructive"
            }`}>{status?.label}</span>
          </div>
          <div className="mt-5 flex items-center justify-around text-center">
            <TeamBlock flag={home.flag} name={home.name} code={home.code} />
            <div className="flex flex-col items-center gap-1">
              {match.home_score != null && match.away_score != null ? (
                <>
                  <div className="font-display text-5xl leading-none text-foreground">
                    {match.home_score} <span className="text-muted-foreground">:</span> {match.away_score}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-gold font-semibold">Resultado Final</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{formatDate(match.kickoff_at)}</div>
                </>
              ) : (
                <>
                  <div className="font-display text-3xl text-gold">{formatTime(match.kickoff_at)}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{formatDate(match.kickoff_at)}</div>
                </>
              )}
            </div>
            <TeamBlock flag={away.flag} name={away.name} code={away.code} />
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-border bg-background/30 px-4 py-2 text-[11px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 text-gold shrink-0" />
          Todas as previsões são consideradas no tempo regulamentar (90 minutos).
        </div>
      </header>

      {/* Auth prompt */}
      {!authLoading && !user && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <div>
            <p className="font-display text-base text-gold">Cria conta para votar</p>
            <p className="text-xs text-muted-foreground">Desbloqueia a opinião da comunidade.</p>
          </div>
          <Link to="/auth" search={{ redirect: `/jogo/${id}` }} className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-background">Entrar</Link>
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
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Os teus votos</p>
          <Link to="/como-funciona" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-gold transition-smooth">
            <Info className="h-3.5 w-3.5" /> Como funciona?
          </Link>
        </div>

        <MarketCard title="Resultado em 90 minutos" closed={closed} pts="3–4 pts">
          <VoteOptions value={pred.result_90} disabled={closed}
            options={[
              { v: "home", label: home.name, pct: analysis?.prob_home },
              { v: "draw", label: "Empate", pct: analysis?.prob_draw },
              { v: "away", label: away.name, pct: analysis?.prob_away },
            ]}
            onChange={(v) => set("result_90", v)} />
          {showCommunity && <CommunityLine votes={community.map(c => c.result_90)}
            labels={{ home: home.name, draw: "Empate", away: away.name }} total={community.length} />}
        </MarketCard>

        <MarketCard title="Ambas as equipas marcam" closed={closed} pts="2 pts">
          <VoteOptions value={pred.btts} disabled={closed}
            options={[
              { v: "yes", label: "Sim", pct: analysis?.prob_btts_yes },
              { v: "no", label: "Não", pct: analysis?.prob_btts_no },
            ]}
            onChange={(v) => set("btts", v)} />
          {showCommunity && <CommunityLine votes={community.map(c => c.btts)}
            labels={{ yes: "Sim", no: "Não" }} total={community.length} />}
        </MarketCard>

        <MarketCard title="Total de golos" closed={closed} pts="2–3 pts">
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">2.5 golos <span className="text-gold font-semibold">2 pts</span></p>
              <VoteOptions value={pred.total_25} disabled={closed}
                options={[
                  { v: "over", label: "Mais de 2.5", pct: analysis?.prob_over25 },
                  { v: "under", label: "Menos de 2.5", pct: analysis?.prob_under25 },
                ]}
                onChange={(v) => set("total_25", v)} />
              {showCommunity && <CommunityLine votes={community.map(c => c.total_25)}
                labels={{ over: "Mais", under: "Menos" }} total={community.length} />}
            </div>
            <div className="border-t border-border/50 pt-3">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">3.5 golos <span className="text-gold font-semibold">3 pts</span></p>
              <VoteOptions value={pred.total_35} disabled={closed}
                options={[
                  { v: "over", label: "Mais de 3.5", pct: analysis?.prob_over35 },
                  { v: "under", label: "Menos de 3.5", pct: analysis?.prob_under35 },
                ]}
                onChange={(v) => set("total_35", v)} />
              {showCommunity && <CommunityLine votes={community.map(c => c.total_35)}
                labels={{ over: "Mais", under: "Menos" }} total={community.length} />}
            </div>
          </div>
        </MarketCard>

        <MarketCard title="Resultado correto" closed={closed} pts="10 pts 🔥">
          {showCommunity && community.filter(c => c.exact_home != null).length > 0 && (
            <ExactScoreCommunity votes={community} />
          )}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-semibold text-muted-foreground">{home.name}</span>
              <ScoreInput value={pred.exact_home} onChange={(v) => set("exact_home", v)} disabled={closed} />
            </div>
            <span className="font-display text-3xl text-muted-foreground mt-4">:</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-semibold text-muted-foreground">{away.name}</span>
              <ScoreInput value={pred.exact_away} onChange={(v) => set("exact_away", v)} disabled={closed} />
            </div>
          </div>
        </MarketCard>

      </section>

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
      <div className="sticky bottom-20 md:bottom-6 mt-6">
        <button data-save-btn onClick={save} disabled={closed || saved}
          className={`w-full rounded-2xl py-4 font-bold shadow-gold transition-smooth hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 ${
            saved ? "bg-green-500 text-white" : "bg-gold text-background"
          }`}>
          {saved ? "✓ Guardado!" : closed ? "Votação fechada" : hasVoted ? "Atualizar Previsão" : "Guardar Previsão"}
        </button>
      </div>

      {hasVoted && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={sharePrediction}
            className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition-smooth hover:bg-primary/20"
          >
            <Share2 className="h-4 w-4" />
            Partilhar previsão
          </button>
        </div>
      )}

      {!showCommunity && (
        <div className="mt-4 rounded-2xl border border-border bg-card/40 p-4 text-center">
          <Lock className="mx-auto mb-1.5 h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Vota para desbloquear a opinião da comunidade.</p>
        </div>
      )}
    </div>
  );
}

/* ── Prognóstico ─────────────────────────────────────────── */

function PrognosticoCard({ prog }: { prog: any }) {
  const [open, setOpen] = useState(false);
  const bullets: string[] = Array.isArray(prog.bullet_points) ? prog.bullet_points : [];

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-wc-red/30 bg-wc-red/5">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-wc-red/8 transition-smooth"
      >
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-wc-red" />
          <span className="font-display text-base text-wc-red">Prognóstico</span>
          <span className="rounded-full border border-wc-red/30 bg-wc-red/10 px-2.5 py-0.5 text-xs font-bold text-wc-red">
            {prog.suggestion}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-wc-red transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-wc-red/20 px-4 py-4 space-y-4">
          {/* Resumo */}
          {prog.summary && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resumo</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{prog.summary}</p>
            </div>
          )}

          {/* Pontos Essenciais */}
          {bullets.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pontos Essenciais</p>
              <ul className="space-y-1.5">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-wc-red" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tendência Principal */}
          {prog.main_trend && (
            <div className="rounded-xl border border-wc-red/20 bg-wc-red/5 px-3 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-wc-red">Tendência Principal</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{prog.main_trend}</p>
            </div>
          )}

          {/* Ponto de Atenção */}
          {prog.attention_point && (
            <div className="rounded-xl border border-gold/25 bg-gold/8 px-3 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gold">Ponto de Atenção</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{prog.attention_point}</p>
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
    <div className="flex flex-1 flex-col items-center gap-2">
      <TeamBadge code={code ?? null} flag={flag} name={name} size="lg" />
      <span className="text-sm font-bold text-center leading-tight">{name}</span>
    </div>
  );
}

function MarketCard({ title, closed, pts, children }: { title: string; closed: boolean; pts?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="font-display text-base">{title}</h3>
        <div className="flex items-center gap-2">
          {pts && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">{pts}</span>}
          {closed && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </div>
      <div className="p-4 space-y-3">{children}</div>
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
  return (
    <div className={`grid gap-2 ${cols}`}>
      {options.map((o) => {
        const active = value === o.v;
        return (
          <button key={o.v} type="button" disabled={disabled} onClick={() => onChange(o.v)}
            className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-smooth active:scale-95 disabled:opacity-50 ${
              active ? "border-gold bg-gold text-background shadow-gold" : "border-border bg-secondary/50 hover:border-gold/40"
            }`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function CommunityLine({ votes, labels, total }: { votes: (string | null)[]; labels: Record<string, string>; total: number }) {
  const filtered = votes.filter(Boolean) as string[];
  const n = filtered.length || 1;
  const counts: Record<string, number> = {};
  filtered.forEach((v) => (counts[v] = (counts[v] ?? 0) + 1));

  const parts = Object.entries(labels).map(([k, label]) => {
    const pct = Math.round(((counts[k] ?? 0) / n) * 100);
    return { key: k, label, pct };
  });

  const maxPct = Math.max(...parts.map(p => p.pct));

  return (
    <div className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2.5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Users2 className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Opinião da Comunidade
          </span>
        </div>
        <span className="text-[11px] font-bold text-gold">{total} {total === 1 ? "voto" : "votos"}</span>
      </div>
      <div className="space-y-1.5">
        {parts.map(({ label, pct }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-16 shrink-0 truncate">{label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-border/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pct === maxPct && pct > 0 ? "bg-gold" : "bg-muted-foreground/40"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-xs font-bold w-8 text-right ${pct === maxPct && pct > 0 ? "text-gold" : "text-muted-foreground"}`}>
              {pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreInput({ value, onChange, disabled }: { value: any; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <input type="number" min={0} max={20} disabled={disabled}
      value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))}
      className="h-16 w-20 rounded-xl border border-border bg-input text-center font-display text-3xl outline-none focus:border-gold/60 disabled:opacity-50"
    />
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
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="flex flex-wrap gap-3 pb-2">
      {sorted.map(([score, n]) => (
        <span key={score} className="text-xs text-muted-foreground">
          <span className="font-display text-sm text-foreground">{score.replace("-", " : ")}</span>
          {" "}{Math.round((n / total) * 100)}%
        </span>
      ))}
    </div>
  );
}
