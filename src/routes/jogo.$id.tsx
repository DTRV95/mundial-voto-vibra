import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { formatDate, formatTime, votingStatus, PHASE_LABEL } from "@/lib/format";
import { toast } from "sonner";
import { Lock, Users2, Info, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/jogo/$id")({
  head: () => ({ meta: [{ title: "Análise & Previsão — Voz do Mundial" }] }),
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
        .select("id,kickoff_at,phase,voting_open,home_score,away_score,home:home_team_id(name,flag),away:away_team_id(name,flag)")
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

  const [pred, setPred] = useState<Record<string, any>>({});
  useEffect(() => { if (myPrediction) setPred(myPrediction); }, [myPrediction]);

  const status = match ? votingStatus(match) : null;
  const closed = !status || status.label === "Fechada";
  const hasVoted = !!myPrediction;
  const showCommunity = hasVoted || closed;

  function set(key: string, value: any) {
    setPred((p) => ({ ...p, [key]: p[key] === value ? null : value }));
  }

  async function save() {
    if (!user) { navigate({ to: "/auth", search: { redirect: `/jogo/${id}` } }); return; }
    if (closed) return;
    const payload = {
      user_id: user.id, match_id: id,
      result_90: pred.result_90 ?? null,
      btts: pred.btts ?? null,
      total_25: pred.total_25 ?? null,
      total_35: pred.total_35 ?? null,
      double_chance: pred.double_chance ?? null,
      exact_home: pred.exact_home ?? null,
      exact_away: pred.exact_away ?? null,
      combo_15: pred.combo_15 ?? null,
      combo_35: pred.combo_35 ?? null,
    };
    const { error } = await supabase.from("predictions").upsert(payload, { onConflict: "user_id,match_id" });
    if (error) { toast.error(error.message); return; }
    toast.success("Previsão guardada!");
    qc.invalidateQueries({ queryKey: ["prediction", id] });
    qc.invalidateQueries({ queryKey: ["community", id] });
  }

  if (isLoading) return <div className="px-5 pt-6"><div className="h-40 animate-pulse rounded-2xl bg-card/50" /></div>;
  if (!match) return <div className="px-5 pt-10 text-center text-muted-foreground">Jogo não encontrado.</div>;

  const home = match.home as any;
  const away = match.away as any;

  return (
    <div className="px-4 pt-4 pb-10 md:px-8">
      <Link to="/jogos" className="text-xs text-muted-foreground">← Jogos</Link>

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
            <TeamBlock flag={home.flag} name={home.name} />
            <div className="flex flex-col items-center gap-1">
              <div className="font-display text-3xl text-gold">{formatTime(match.kickoff_at)}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{formatDate(match.kickoff_at)}</div>
            </div>
            <TeamBlock flag={away.flag} name={away.name} />
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

      {/* Markets */}
      <section className="mt-5 space-y-3">

        <MarketCard title="Resultado em 90 minutos" closed={closed}>
          {analysis && <ScoreLabBars entries={[
            { label: `Vitória ${home.name}`, pct: analysis.prob_home },
            { label: "Empate", pct: analysis.prob_draw },
            { label: `Vitória ${away.name}`, pct: analysis.prob_away },
          ]} />}
          {showCommunity && <CommunityBars total={community.length} entries={[
            { label: `Vitória ${home.name}`, value: "home" },
            { label: "Empate", value: "draw" },
            { label: `Vitória ${away.name}`, value: "away" },
          ]} votes={community.map((c) => c.result_90)} />}
          <VoteOptions value={pred.result_90} disabled={closed}
            options={[{ v: "home", label: home.name }, { v: "draw", label: "Empate" }, { v: "away", label: away.name }]}
            onChange={(v) => set("result_90", v)} />
        </MarketCard>

        <MarketCard title="Ambas as equipas marcam" closed={closed}>
          {analysis && <ScoreLabBars entries={[
            { label: "Sim", pct: analysis.prob_btts_yes },
            { label: "Não", pct: analysis.prob_btts_no },
          ]} />}
          {showCommunity && <CommunityBars total={community.length} entries={[
            { label: "Sim", value: "yes" }, { label: "Não", value: "no" },
          ]} votes={community.map((c) => c.btts)} />}
          <VoteOptions value={pred.btts} disabled={closed}
            options={[{ v: "yes", label: "Sim" }, { v: "no", label: "Não" }]}
            onChange={(v) => set("btts", v)} />
        </MarketCard>

        <MarketCard title="Total de golos — 2.5" closed={closed}>
          {analysis && <ScoreLabBars entries={[
            { label: "Mais de 2.5", pct: analysis.prob_over25 },
            { label: "Menos de 2.5", pct: analysis.prob_under25 },
          ]} />}
          {showCommunity && <CommunityBars total={community.length} entries={[
            { label: "Mais de 2.5", value: "over" }, { label: "Menos de 2.5", value: "under" },
          ]} votes={community.map((c) => c.total_25)} />}
          <VoteOptions value={pred.total_25} disabled={closed}
            options={[{ v: "over", label: "Mais de 2.5" }, { v: "under", label: "Menos de 2.5" }]}
            onChange={(v) => set("total_25", v)} />
        </MarketCard>

        <MarketCard title="Total de golos — 3.5" closed={closed}>
          {analysis && <ScoreLabBars entries={[
            { label: "Mais de 3.5", pct: analysis.prob_over35 },
            { label: "Menos de 3.5", pct: analysis.prob_under35 },
          ]} />}
          {showCommunity && <CommunityBars total={community.length} entries={[
            { label: "Mais de 3.5", value: "over" }, { label: "Menos de 3.5", value: "under" },
          ]} votes={community.map((c) => c.total_35)} />}
          <VoteOptions value={pred.total_35} disabled={closed}
            options={[{ v: "over", label: "Mais de 3.5" }, { v: "under", label: "Menos de 3.5" }]}
            onChange={(v) => set("total_35", v)} />
        </MarketCard>

        <MarketCard title="Dupla hipótese" closed={closed}>
          {analysis && <ScoreLabBars entries={[
            { label: "1X (Casa ou Empate)", pct: analysis.prob_1x },
            { label: "X2 (Empate ou Fora)", pct: analysis.prob_x2 },
          ]} />}
          {showCommunity && <CommunityBars total={community.length} entries={[
            { label: "1X", value: "1x" }, { label: "X2", value: "x2" },
          ]} votes={community.map((c) => c.double_chance)} />}
          <VoteOptions value={pred.double_chance} disabled={closed}
            options={[{ v: "1x", label: "1X" }, { v: "x2", label: "X2" }]}
            onChange={(v) => set("double_chance", v)} />
        </MarketCard>

        {/* Resultado exacto — sem ScoreLab */}
        <MarketCard title="Resultado exacto" closed={closed} noScorelab>
          {showCommunity && community.filter((c) => c.exact_home != null).length > 0 && (
            <div className="rounded-xl border border-border bg-secondary/30 p-3 mb-2">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Users2 className="h-3.5 w-3.5" /> Resultados mais votados
              </p>
              <ExactScoreCommunity votes={community} />
            </div>
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

        <MarketCard title="Combinação · 1X/X2 + 1.5 golos" closed={closed}>
          {analysis && <ScoreLabBars entries={[
            { label: "1X + Mais 1.5", pct: analysis.prob_combo15_1x_over },
            { label: "1X + Menos 1.5", pct: analysis.prob_combo15_1x_under },
            { label: "X2 + Mais 1.5", pct: analysis.prob_combo15_x2_over },
            { label: "X2 + Menos 1.5", pct: analysis.prob_combo15_x2_under },
          ]} />}
          {showCommunity && <CommunityBars total={community.length} entries={[
            { label: "1X + Mais 1.5", value: "1x_over" }, { label: "1X + Menos 1.5", value: "1x_under" },
            { label: "X2 + Mais 1.5", value: "x2_over" }, { label: "X2 + Menos 1.5", value: "x2_under" },
          ]} votes={community.map((c) => c.combo_15)} />}
          <VoteOptions value={pred.combo_15} disabled={closed} grid={2}
            options={[
              { v: "1x_over", label: "1X · Mais 1.5" }, { v: "1x_under", label: "1X · Menos 1.5" },
              { v: "x2_over", label: "X2 · Mais 1.5" }, { v: "x2_under", label: "X2 · Menos 1.5" },
            ]}
            onChange={(v) => set("combo_15", v)} />
        </MarketCard>

        <MarketCard title="Combinação · 1X/X2 + 3.5 golos" closed={closed}>
          {analysis && <ScoreLabBars entries={[
            { label: "1X + Mais 3.5", pct: analysis.prob_combo35_1x_over },
            { label: "1X + Menos 3.5", pct: analysis.prob_combo35_1x_under },
            { label: "X2 + Mais 3.5", pct: analysis.prob_combo35_x2_over },
            { label: "X2 + Menos 3.5", pct: analysis.prob_combo35_x2_under },
          ]} />}
          {showCommunity && <CommunityBars total={community.length} entries={[
            { label: "1X + Mais 3.5", value: "1x_over" }, { label: "1X + Menos 3.5", value: "1x_under" },
            { label: "X2 + Mais 3.5", value: "x2_over" }, { label: "X2 + Menos 3.5", value: "x2_under" },
          ]} votes={community.map((c) => c.combo_35)} />}
          <VoteOptions value={pred.combo_35} disabled={closed} grid={2}
            options={[
              { v: "1x_over", label: "1X · Mais 3.5" }, { v: "1x_under", label: "1X · Menos 3.5" },
              { v: "x2_over", label: "X2 · Mais 3.5" }, { v: "x2_under", label: "X2 · Menos 3.5" },
            ]}
            onChange={(v) => set("combo_35", v)} />
        </MarketCard>

      </section>

      {/* Save */}
      <div className="sticky bottom-20 md:bottom-6 mt-6">
        <button onClick={save} disabled={closed}
          className="w-full rounded-2xl bg-gold py-4 font-bold text-background shadow-gold transition-smooth hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50">
          {closed ? "Votação fechada" : hasVoted ? "Atualizar Previsão" : "Guardar Previsão"}
        </button>
      </div>

      {/* Community lock hint */}
      {!showCommunity && (
        <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/5 p-5 text-center">
          <Lock className="mx-auto mb-2 h-5 w-5 text-gold" />
          <p className="text-sm font-medium">Vota para desbloquear a opinião da comunidade</p>
          <p className="text-xs text-muted-foreground mt-1">As percentagens ficam visíveis depois de submeteres a tua previsão.</p>
        </div>
      )}
    </div>
  );
}

/* ── Components ─────────────────────────────────────────── */

function TeamBlock({ flag, name }: { flag: string | null; name: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-4xl">{flag ?? "⚽"}</div>
      <span className="text-sm font-bold text-center leading-tight">{name}</span>
    </div>
  );
}

function MarketCard({ title, closed, noScorelab, children }: {
  title: string; closed: boolean; noScorelab?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-background/20">
        <h3 className="font-display text-base">{title}</h3>
        <div className="flex items-center gap-2">
          {!noScorelab && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gold/80">
              <TrendingUp className="h-3 w-3" /> ScoreLab
            </span>
          )}
          {closed && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function ScoreLabBars({ entries }: { entries: { label: string; pct: number }[] }) {
  if (entries.every((e) => e.pct === 0)) return null;
  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 p-3">
      <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold">
        <TrendingUp className="h-3.5 w-3.5" /> Análise ScoreLab
      </p>
      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-foreground/80">{e.label}</span>
              <span className="font-bold text-gold">{e.pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gold/15">
              <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${e.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityBars({ total, entries, votes }: {
  total: number; entries: { label: string; value: string }[]; votes: (string | null)[];
}) {
  const filtered = votes.filter(Boolean) as string[];
  const n = filtered.length || 1;
  const counts: Record<string, number> = {};
  filtered.forEach((v) => (counts[v] = (counts[v] ?? 0) + 1));
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3">
      <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Users2 className="h-3.5 w-3.5" /> Comunidade · {total} votos
      </p>
      <div className="space-y-2">
        {entries.map((e) => {
          const pct = Math.round(((counts[e.value] ?? 0) / n) * 100);
          return (
            <div key={e.value}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-foreground/70">{e.label}</span>
                <span className="font-semibold">{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-primary/70 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VoteOptions({ value, options, onChange, disabled, grid = 0 }: {
  value: any; options: { v: string; label: string }[]; onChange: (v: string) => void; disabled?: boolean; grid?: number;
}) {
  const cols = grid === 2 ? "grid-cols-2" : options.length === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={`grid gap-2 ${cols}`}>
      {options.map((o) => {
        const active = value === o.v;
        return (
          <button key={o.v} type="button" disabled={disabled} onClick={() => onChange(o.v)}
            className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-smooth disabled:opacity-50 ${
              active ? "border-gold bg-gold text-background shadow-gold" : "border-border bg-secondary/50 hover:border-gold/40"
            }`}>
            {o.label}
          </button>
        );
      })}
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
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="space-y-1.5">
      {sorted.map(([score, n]) => (
        <div key={score} className="flex items-center justify-between text-xs">
          <span className="font-display text-base">{score.replace("-", " : ")}</span>
          <span className="text-muted-foreground">{Math.round((n / total) * 100)}% · {n} votos</span>
        </div>
      ))}
    </div>
  );
}
