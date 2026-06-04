import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MatchCard, type MatchCardData } from "@/components/MatchCard";
import { formatDate, PHASE_LABEL } from "@/lib/format";
import { CalendarClock } from "lucide-react";

export const Route = createFileRoute("/jogos")({
  head: () => ({
    meta: [
      { title: "Jogos — Uma Geração" },
      { name: "description", content: "Calendário completo dos jogos do Mundial. Filtra por dia ou fase e deixa as tuas previsões." },
    ],
  }),
  component: Jogos,
});

type Filter = "hoje" | "amanha" | "semana" | "todos";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "hoje",   label: "Hoje" },
  { key: "amanha", label: "Amanhã" },
  { key: "semana", label: "Esta semana" },
  { key: "todos",  label: "Todos" },
];

function Jogos() {
  const [filter, setFilter] = useState<Filter>("hoje");

  const { data: all = [], isLoading } = useQuery({
    queryKey: ["matches", "all"],
    queryFn: async (): Promise<MatchCardData[]> => {
      const { data } = await supabase
        .from("matches")
        .select("id,kickoff_at,phase,status,voting_open,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code),predictions(count)")
        .order("kickoff_at");
      return ((data as any) ?? []).map((m: any) => ({
        ...m,
        votes_count: m.predictions?.[0]?.count ?? 0,
      }));
    },
  });

  const filtered = useMemo(() => {
    const now = new Date();
    const startOfDay = (d: Date) => { const c = new Date(d); c.setHours(0,0,0,0); return c; };
    const endOfDay   = (d: Date) => { const c = new Date(d); c.setHours(23,59,59,999); return c; };

    const today    = startOfDay(now);
    const tomorrow = startOfDay(new Date(now.getTime() + 86400000));
    const weekEnd  = endOfDay(new Date(now.getTime() + 6 * 86400000));

    return all.filter(m => {
      const t = new Date(m.kickoff_at);
      if (filter === "hoje")   return t >= today && t <= endOfDay(now);
      if (filter === "amanha") return t >= tomorrow && t <= endOfDay(tomorrow);
      if (filter === "semana") return t >= today && t <= weekEnd;
      return true;
    });
  }, [all, filter]);

  // Agrupar por data
  const grouped = useMemo(() => {
    const map: Record<string, MatchCardData[]> = {};
    filtered.forEach(m => {
      const key = new Date(m.kickoff_at).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return Object.entries(map).map(([key, matches]) => ({
      date: new Date(key),
      matches,
    }));
  }, [filtered]);

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <header className="mb-5">
        <h1 className="font-display text-3xl md:text-4xl">Jogos</h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">{formatDate(new Date().toISOString())}</p>
      </header>

      {/* Filtros */}
      <div className="mb-6 -mx-4 md:mx-0 overflow-x-auto px-4 md:px-0">
        <div className="flex gap-2 w-max">
          {FILTERS.map(f => {
            const count = all.filter(m => {
              const now = new Date();
              const t = new Date(m.kickoff_at);
              const s = (d: Date) => { const c = new Date(d); c.setHours(0,0,0,0); return c; };
              const e = (d: Date) => { const c = new Date(d); c.setHours(23,59,59,999); return c; };
              if (f.key === "hoje")   return t >= s(now) && t <= e(now);
              if (f.key === "amanha") return t >= s(new Date(now.getTime()+86400000)) && t <= e(new Date(now.getTime()+86400000));
              if (f.key === "semana") return t >= s(now) && t <= e(new Date(now.getTime()+6*86400000));
              return true;
            }).length;

            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-smooth ${
                  filter === f.key
                    ? "border-gold bg-gold text-background shadow-gold"
                    : "border-border bg-card/60 text-muted-foreground hover:border-gold/40 hover:text-foreground"
                }`}>
                {f.label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    filter === f.key ? "bg-background/20 text-background" : "bg-secondary text-muted-foreground"
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading && (
        <div className="grid gap-3">
          {[0,1,2].map(i => <div key={i} className="h-32 shimmer rounded-2xl" />)}
        </div>
      )}

      {!isLoading && grouped.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <CalendarClock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-display text-lg">Sem jogos para este período</p>
          <p className="text-sm text-muted-foreground mt-1">Experimenta outro filtro.</p>
          {filter !== "todos" && (
            <button onClick={() => setFilter("todos")} className="mt-4 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-smooth">
              Ver todos os jogos
            </button>
          )}
        </div>
      )}

      <div className="space-y-8">
        {grouped.map(({ date, matches }) => (
          <div key={date.toDateString()}>
            {/* Header de data */}
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-xl border border-border bg-card/60 px-3 py-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-gold">
                  {isToday(date) ? "Hoje" : isTomorrow(date) ? "Amanhã" : date.toLocaleDateString("pt-PT", { weekday: "long" })}
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {date.toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}
                </p>
              </div>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{matches.length} {matches.length === 1 ? "jogo" : "jogos"}</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {matches.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function isToday(d: Date) {
  const n = new Date();
  return d.toDateString() === n.toDateString();
}
function isTomorrow(d: Date) {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return d.toDateString() === t.toDateString();
}
