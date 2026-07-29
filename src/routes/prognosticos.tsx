import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Target, Clock } from "lucide-react";
import { PageTabs, ABAS_JOGAR } from "@/components/PageTabs";
import { TeamBadge } from "@/lib/teamColors.tsx";
import { formatTime } from "@/lib/format";

export const Route = createFileRoute("/prognosticos")({
  head: () => ({
    meta: [
      { title: "Prognósticos — Uma Geração" },
      { name: "description", content: "Análises e sugestões para os jogos oficiais de cada jornada, antes de dares a tua previsão." },
      { property: "og:title", content: "Prognósticos — Uma Geração" },
      { property: "og:description", content: "Análises e sugestões para os jogos oficiais de cada jornada." },
      { property: "og:url", content: "https://geracao2026.com/prognosticos" },
    ],
    links: [{ rel: "canonical", href: "https://geracao2026.com/prognosticos" }],
  }),
  component: Prognosticos,
});

function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

function shortDayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const ds = new Date(d); ds.setHours(0, 0, 0, 0);
  if (ds.getTime() === today.getTime()) return "Hoje";
  if (ds.getTime() === tomorrow.getTime()) return "Amanhã";
  return d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });
}

function Prognosticos() {
  const todayKey = dayKey(new Date().toISOString());
  const [dayFilter, setDayFilter] = useState<string>(todayKey);

  const { data: prognosticos = [], isLoading } = useQuery({
    queryKey: ["prognosticos", "published"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("prognosticos")
        .select("id,suggestion,summary,created_at,match:match_id(id,kickoff_at,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code),round:round_id(label))")
        .eq("published", true)
        .order("created_at", { ascending: false });
      return ((data ?? []) as any[]).sort((a, b) => {
        const ta = a.match?.kickoff_at ? new Date(a.match.kickoff_at).getTime() : Infinity;
        const tb = b.match?.kickoff_at ? new Date(b.match.kickoff_at).getTime() : Infinity;
        return ta - tb;
      });
    },
  });

  // Dias com prognósticos, de hoje para a frente
  const dias = useMemo(() => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const vistos = new Set<string>();
    const lista: { key: string; iso: string }[] = [];
    for (const p of prognosticos as any[]) {
      if (!p.match?.kickoff_at) continue;
      const d = new Date(p.match.kickoff_at); d.setHours(0, 0, 0, 0);
      if (d < hoje) continue;
      const k = dayKey(p.match.kickoff_at);
      if (!vistos.has(k)) { vistos.add(k); lista.push({ key: k, iso: p.match.kickoff_at }); }
    }
    return lista;
  }, [prognosticos]);

  const doDia = useMemo(
    () => (prognosticos as any[]).filter(p => p.match?.kickoff_at && dayKey(p.match.kickoff_at) === dayFilter),
    [prognosticos, dayFilter],
  );

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <header className="mb-5">
        <h1 className="font-display text-3xl md:text-4xl">Prognósticos</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Análises dos jogos oficiais, antes de dares a tua previsão.
        </p>
      </header>

      <PageTabs abas={ABAS_JOGAR} />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[0, 1, 2].map(i => <div key={i} className="shimmer h-56 rounded-2xl" />)}
        </div>
      )}

      {/* Dias */}
      {!isLoading && dias.length > 0 && (
        <div className="-mx-4 mb-5 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex w-max gap-2">
            {dias.map(({ key, iso }) => {
              const total = (prognosticos as any[]).filter(
                p => p.match?.kickoff_at && dayKey(p.match.kickoff_at) === key).length;
              return (
                <button key={key} onClick={() => setDayFilter(key)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold capitalize transition-smooth ${
                    dayFilter === key
                      ? "border-gold bg-gold text-background shadow-gold"
                      : "border-border bg-card/60 text-muted-foreground hover:border-gold/40 hover:text-foreground"
                  }`}>
                  {shortDayLabel(iso)}
                  <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    dayFilter === key ? "bg-background/20 text-background" : "bg-secondary text-muted-foreground"
                  }`}>{total}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && doDia.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {doDia.map((p: any) => <PrognosticoCard key={p.id} article={p} />)}
        </div>
      )}

      {!isLoading && doDia.length === 0 && dias.length > 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
          <p className="font-display text-lg">Sem análises para este dia</p>
          <button onClick={() => setDayFilter(dias[0].key)}
            className="mt-3 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-smooth hover:text-foreground">
            Ver próximo dia disponível
          </button>
        </div>
      )}

      {!isLoading && prognosticos.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Target className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-display text-lg">Sem prognósticos publicados</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aparecem aqui assim que a próxima jornada for analisada.
          </p>
        </div>
      )}
    </div>
  );
}

function PrognosticoCard({ article }: { article: any }) {
  const match = article.match as any;

  const inner = (
    <>
      <div className="card-stripe" />
      <div className="flex items-center justify-between px-4 pb-0 pt-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {match?.round?.label ?? "Prognóstico"}
        </span>
        <span className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
          <Target className="h-2.5 w-2.5" /> Análise
        </span>
      </div>

      {match?.home && match?.away ? (
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="flex flex-1 flex-col items-center gap-2">
            <TeamBadge code={match.home.code} flag={match.home.flag} name={match.home.name} size="md" />
            <span className="text-center text-xs font-bold leading-tight text-foreground md:text-sm">{match.home.name}</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-2">
            <div className="flex items-center gap-1 text-wc-red">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-display text-2xl tabular-nums md:text-3xl">
                {match.kickoff_at ? formatTime(match.kickoff_at) : "–:––"}
              </span>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">vs</span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-2">
            <TeamBadge code={match.away.code} flag={match.away.flag} name={match.away.name} size="md" />
            <span className="text-center text-xs font-bold leading-tight text-foreground md:text-sm">{match.away.name}</span>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4">
          <p className="font-display text-lg leading-tight">Análise</p>
        </div>
      )}

      <div className="mx-4 mb-3 rounded-xl border border-gold/20 bg-gold/8 px-3 py-2.5">
        <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-gold/70">Sugestão</p>
        <p className="text-sm font-semibold leading-snug text-foreground">{article.suggestion}</p>
      </div>

      <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2.5">
        <span className="text-xs text-muted-foreground">
          {match?.kickoff_at
            ? new Date(match.kickoff_at).toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" })
            : ""}
        </span>
        <span className="text-xs font-bold text-wc-red transition-smooth group-hover:underline">Ver análise →</span>
      </div>
    </>
  );

  const cls = "group block overflow-hidden rounded-2xl bg-card transition-smooth";
  const sombra = "0 2px 12px oklch(0 0 0 / 0.30), 0 0 0 1px oklch(1 0 0 / 0.06)";
  const sombraHover = "0 16px 40px oklch(0.54 0.24 27 / 0.25), 0 0 0 1.5px oklch(0.54 0.24 27 / 0.40)";

  if (match?.id) {
    return (
      <Link to="/jogo/$id" params={{ id: match.id }} className={cls}
        style={{ boxShadow: sombra, transition: "transform 240ms cubic-bezier(0.16,1,0.3,1), box-shadow 240ms ease" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = sombraHover; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = sombra; }}>
        {inner}
      </Link>
    );
  }
  return <div className={cls} style={{ boxShadow: sombra }}>{inner}</div>;
}
