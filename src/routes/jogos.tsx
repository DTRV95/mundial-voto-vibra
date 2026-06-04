import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MatchCard, type MatchCardData } from "@/components/MatchCard";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/jogos")({
  head: () => ({
    meta: [
      { title: "Jogos de Hoje — Uma Geração" },
      { name: "description", content: "Vê os jogos do Mundial de hoje e deixa as tuas previsões." },
    ],
  }),
  component: Jogos,
});

function Jogos() {
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches", "today", "full"],
    queryFn: async (): Promise<MatchCardData[]> => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const { data } = await supabase
        .from("matches")
        .select("id,kickoff_at,phase,voting_open,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code)")
        .gte("kickoff_at", start.toISOString())
        .lte("kickoff_at", end.toISOString())
        .order("kickoff_at");
      return (data as any) ?? [];
    },
  });

  const { data: upcoming = [] } = useQuery({
    queryKey: ["matches", "upcoming"],
    queryFn: async (): Promise<MatchCardData[]> => {
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const { data } = await supabase
        .from("matches")
        .select("id,kickoff_at,phase,voting_open,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code)")
        .gt("kickoff_at", end.toISOString())
        .order("kickoff_at")
        .limit(10);
      return (data as any) ?? [];
    },
  });

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <h1 className="font-display text-3xl">Jogos de Hoje</h1>
        <p className="text-sm text-muted-foreground capitalize">{formatDate(new Date().toISOString())}</p>
      </header>

      {isLoading && <Skeleton />}
      {!isLoading && matches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
          <p className="font-display text-lg">Sem jogos para hoje</p>
          <p className="text-sm text-muted-foreground">Vê os próximos jogos abaixo.</p>
        </div>
      )}
      <div className="grid gap-3">
        {matches.map((m) => <MatchCard key={m.id} match={m} />)}
      </div>

      {upcoming.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 font-display text-xl">Próximos Jogos</h2>
          <div className="grid gap-3">
            {upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-3">
      {[0,1,2].map((i) => <div key={i} className="h-32 shimmer rounded-2xl" />)}
    </div>
  );
}
