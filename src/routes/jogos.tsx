import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { MatchCard, type MatchCardData } from "@/components/MatchCard";
import { formatDate } from "@/lib/format";
import { CalendarClock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/jogos")({
  head: () => ({
    meta: [
      { title: "Jogos — Voz do Mundial" },
      { name: "description", content: "Calendário completo dos jogos do Mundial. Filtra por dia ou fase e deixa as tuas previsões." },
    ],
  }),
  component: Jogos,
});

type Filter = "hoje" | "amanha" | "semana" | "votados" | "todos";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "hoje",    label: "Hoje" },
  { key: "amanha",  label: "Amanhã" },
  { key: "semana",  label: "Esta semana" },
  { key: "votados", label: "Já votados" },
  { key: "todos",   label: "Todos" },
];

function Jogos() {
  const [filter, setFilter] = useState<Filter>("hoje");
  const { user } = useAuth();

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

  // IDs dos jogos em que o utilizador já votou
  const { data: votedIds = new Set<string>() } = useQuery({
    queryKey: ["voted-match-ids", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("predictions")
        .select("match_id")
        .eq("user_id", user!.id);
      return new Set((data ?? []).map((p: any) => p.match_id));
    },
  });

  const filtered = useMemo(() => {
    const now = new Date();
    const s = (d: Date) => { const c = new Date(d); c.setHours(0,0,0,0); return c; };
    const e = (d: Date) => { const c = new Date(d); c.setHours(23,59,59,999); return c; };
    const today    = s(now);
    const tomorrow = s(new Date(now.getTime() + 86400000));
    const weekEnd  = e(new Date(now.getTime() + 6 * 86400000));

    return all
      .map(m => ({ ...m, already_voted: votedIds.has(m.id) }))
      .filter(m => {
        const t = new Date(m.kickoff_at);
        if (filter === "hoje")    return t >= today && t <= e(now);
        if (filter === "amanha")  return t >= tomorrow && t <= e(tomorrow);
        if (filter === "semana")  return t >= today && t <= weekEnd;
        if (filter === "votados") return m.already_voted;
        return true;
      });
  }, [all, filter, votedIds]);

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

  function countFilter(f: Filter) {
    const now = new Date();
    const s = (d: Date) => { const c = new Date(d); c.setHours(0,0,0,0); return c; };
    const e = (d: Date) => { const c = new Date(d); c.setHours(23,59,59,999); return c; };
    return all.filter(m => {
      const t = new Date(m.kickoff_at);
      if (f === "hoje")    return t >= s(now) && t <= e(now);
      if (f === "amanha")  return t >= s(new Date(now.getTime()+86400000)) && t <= e(new Date(now.getTime()+86400000));
      if (f === "semana")  return t >= s(now) && t <= e(new Date(now.getTime()+6*86400000));
      if (f === "votados") return votedIds.has(m.id);
      return true;
    }).length;
  }

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
            // Só mostra "Já votados" se o user estiver autenticado
            if (f.key === "votados" && !user) return null;
            const count = countFilter(f.key);
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-smooth ${
                  filter === f.key
                    ? "border-gold bg-gold text-background shadow-gold"
                    : "border-border bg-card/60 text-muted-foreground hover:border-gold/40 hover:text-foreground"
                }`}>
                {f.key === "votados" && (
                  <CheckCircle2 className={`h-3.5 w-3.5 ${filter === f.key ? "text-background" : "text-primary"}`} />
                )}
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
          <p className="font-display text-lg">
            {filter === "votados" ? "Ainda não votaste em nenhum jogo" : "Sem jogos para este período"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "votados" ? "Vai à página de jogos e dá a tua previsão!" : "Experimenta outro filtro."}
          </p>
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
  return d.toDateString() === new Date().toDateString();
}
function isTomorrow(d: Date) {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return d.toDateString() === t.toDateString();
}
