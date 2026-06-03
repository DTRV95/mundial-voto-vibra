import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { formatDate, formatTime, votingStatus, PHASE_LABEL } from "@/lib/format";
import { toast } from "sonner";
import { Lock, Users2, Info } from "lucide-react";

export const Route = createFileRoute("/jogo/$id")({
  head: () => ({ meta: [{ title: "Previsão — Voz do Mundial" }] }),
  component: JogoPage,
});

type Market =
  | "result_90" | "btts" | "total_25" | "total_35"
  | "double_chance" | "exact" | "combo_15" | "combo_35";

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
      const { data } = await supabase.from("predictions").select("result_90,btts,total_25,total_35,double_chance,combo_15,combo_35").eq("match_id", id);
      return data ?? [];
    },
  });

  const [pred, setPred] = useState<Record<string, any>>({});
  useEffect(() => { if (myPrediction) setPred(myPrediction); }, [myPrediction]);

  const status = match ? votingStatus(match) : null;
  const closed = !status || status.label === "Fechada";
  const hasVoted = !!myPrediction;

  function set(key: Market | "exact_home" | "exact_away", value: any) {
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

  const showCommunity = hasVoted || closed;

  return (
    <div className="px-5 pt-4 pb-10">
      <Link to="/jogos" className="text-xs text-muted-foreground">← Jogos</Link>

      {/* Match header */}
      <header className="mt-3 overflow-hidden rounded-2xl border border-border bg-card/70 pitch-lines">
        <div className="bg-gradient-to-b from-[oklch(0.30_0.10_155/0.4)] to-transparent p-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-gold">{PHASE_LABEL[match.phase] ?? match.phase}</span>
            <span className={`rounded-full border px-2.5 py-0.5 font-semibold uppercase tracking-wider ${
              status?.tone === "primary" ? "border-primary/40 bg-primary/15 text-primary"
                : status?.tone === "gold" ? "border-gold/40 bg-gold/15 text-gold"
                : "border-destructive/40 bg-destructive/15 text-destructive"
            }`}>{status?.label}</span>
          </div>
          <div className="mt-4 flex items-center justify-around text-center">
            <Team flag={(match.home as any).flag} name={(match.home as any).name} />
            <div>
              <div className="font-display text-2xl text-gold">{formatTime(match.kickoff_at)}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{formatDate(match.kickoff_at)}</div>
            </div>
            <Team flag={(match.away as any).flag} name={(match.away as any).name} />
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-border bg-background/30 px-5 py-2 text-[11px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 text-gold" />
          Todas as previsões são consideradas no tempo regulamentar (90 minutos).
        </div>
      </header>

      {/* Auth prompt */}
      {!authLoading && !user && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <div className="text-sm">
            <p className="font-display text-base text-gold">Cria conta para votar</p>
            <p className="text-xs text-muted-foreground">Desbloqueia a opinião da comunidade.</p>
          </div>
          <Link to="/auth" search={{ redirect: `/jogo/${id}` }} className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-background">Entrar</Link>
        </div>
      )}

      {/* Markets */}
      <section className="mt-5 space-y-4">
        <Market title="Resultado em 90 minutos" closed={closed}>
          <Options
            value={pred.result_90}
            options={[
              { v: "home", label: `Vitória ${(match.home as any).name}` },
              { v: "draw", label: "Empate" },
              { v: "away", label: `Vitória ${(match.away as any).name}` },
            ]}
            onChange={(v) => set("result_90", v)}
            disabled={closed}
          />
        </Market>

        <Market title="Ambas marcam" closed={closed}>
          <Options value={pred.btts} options={[{ v: "yes", label: "Sim" }, { v: "no", label: "Não" }]}
            onChange={(v) => set("btts", v)} disabled={closed} />
        </Market>

        <Market title="Total de golos 2.5" closed={closed}>
          <Options value={pred.total_25} options={[{ v: "over", label: "Mais de 2.5" }, { v: "under", label: "Menos de 2.5" }]}
            onChange={(v) => set("total_25", v)} disabled={closed} />
        </Market>

        <Market title="Total de golos 3.5" closed={closed}>
          <Options value={pred.total_35} options={[{ v: "over", label: "Mais de 3.5" }, { v: "under", label: "Menos de 3.5" }]}
            onChange={(v) => set("total_35", v)} disabled={closed} />
        </Market>

        <Market title="Dupla hipótese" closed={closed}>
          <Options value={pred.double_chance} options={[{ v: "1x", label: "1X" }, { v: "x2", label: "X2" }]}
            onChange={(v) => set("double_chance", v)} disabled={closed} />
        </Market>

        <Market title="Resultado exato" closed={closed}>
          <div className="flex items-center justify-center gap-3">
            <ScoreInput value={pred.exact_home} onChange={(v) => set("exact_home", v)} disabled={closed} />
            <span className="font-display text-2xl text-muted-foreground">:</span>
            <ScoreInput value={pred.exact_away} onChange={(v) => set("exact_away", v)} disabled={closed} />
          </div>
        </Market>

        <Market title="Combinação 1X/X2 + 1.5 golos" closed={closed}>
          <Options value={pred.combo_15}
            options={[
              { v: "1x_over", label: "1X · Mais 1.5" }, { v: "1x_under", label: "1X · Menos 1.5" },
              { v: "x2_over", label: "X2 · Mais 1.5" }, { v: "x2_under", label: "X2 · Menos 1.5" },
            ]}
            grid={2}
            onChange={(v) => set("combo_15", v)} disabled={closed} />
        </Market>

        <Market title="Combinação 1X/X2 + 3.5 golos" closed={closed}>
          <Options value={pred.combo_35}
            options={[
              { v: "1x_over", label: "1X · Mais 3.5" }, { v: "1x_under", label: "1X · Menos 3.5" },
              { v: "x2_over", label: "X2 · Mais 3.5" }, { v: "x2_under", label: "X2 · Menos 3.5" },
            ]}
            grid={2}
            onChange={(v) => set("combo_35", v)} disabled={closed} />
        </Market>
      </section>

      {/* Save */}
      <div className="sticky bottom-20 mt-6">
        <button onClick={save} disabled={closed}
          className="w-full rounded-2xl bg-gold py-3.5 font-semibold text-background shadow-gold transition-smooth hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50">
          {closed ? "Votação fechada" : hasVoted ? "Atualizar Previsão" : "Guardar Previsão"}
        </button>
      </div>

      {/* Community */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
          <Users2 className="h-5 w-5 text-gold" /> Opinião da Comunidade
        </h2>
        {!showCommunity ? (
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6 text-center">
            <Lock className="mx-auto mb-2 h-6 w-6 text-gold" />
            <p className="text-sm text-muted-foreground">Deixa a tua previsão para desbloquear a opinião da comunidade.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <CommunityBar title="Resultado 90'" values={community.map((c) => c.result_90)}
              labels={{ home: `Vitória ${(match.home as any).name}`, draw: "Empate", away: `Vitória ${(match.away as any).name}` }} />
            <CommunityBar title="Ambas marcam" values={community.map((c) => c.btts)} labels={{ yes: "Sim", no: "Não" }} />
            <CommunityBar title="Mais/Menos 2.5" values={community.map((c) => c.total_25)} labels={{ over: "Mais de 2.5", under: "Menos de 2.5" }} />
            <CommunityBar title="Mais/Menos 3.5" values={community.map((c) => c.total_35)} labels={{ over: "Mais de 3.5", under: "Menos de 3.5" }} />
            <CommunityBar title="Dupla hipótese" values={community.map((c) => c.double_chance)} labels={{ "1x": "1X", x2: "X2" }} />
            <p className="pt-2 text-center text-xs text-muted-foreground">{community.length} previsões da comunidade</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Team({ flag, name }: { flag: string | null; name: string }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-3xl">{flag ?? "⚽"}</div>
      <span className="mt-2 text-sm font-semibold">{name}</span>
    </div>
  );
}

function Market({ title, closed, children }: { title: string; closed: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base">{title}</h3>
        {closed && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
      {children}
    </div>
  );
}

function Options({ value, options, onChange, disabled, grid = 0 }: {
  value: any; options: { v: string; label: string }[]; onChange: (v: string) => void; disabled?: boolean; grid?: number;
}) {
  return (
    <div className={grid === 2 ? "grid grid-cols-2 gap-2" : "grid gap-2 " + (options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
      {options.map((o) => {
        const active = value === o.v;
        return (
          <button key={o.v} type="button" disabled={disabled} onClick={() => onChange(o.v)}
            className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-smooth disabled:opacity-50 ${
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
    <input
      type="number" min={0} max={20} disabled={disabled}
      value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))}
      className="h-14 w-16 rounded-xl border border-border bg-input text-center font-display text-2xl outline-none focus:border-gold/60 disabled:opacity-50"
    />
  );
}

function CommunityBar({ title, values, labels }: { title: string; values: (string | null)[]; labels: Record<string, string> }) {
  const counts: Record<string, number> = {};
  const filtered = values.filter(Boolean) as string[];
  filtered.forEach((v) => (counts[v] = (counts[v] ?? 0) + 1));
  const total = filtered.length || 1;
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      <div className="space-y-2">
        {Object.keys(labels).map((k) => {
          const pct = Math.round(((counts[k] ?? 0) / total) * 100);
          return (
            <div key={k}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{labels[k]}</span>
                <span className="font-display text-gold">{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
