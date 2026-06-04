import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatTime } from "@/lib/format";

export const Route = createFileRoute("/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos do Mundial — Uma Geração" },
      { name: "description", content: "Vê os 8 grupos do Mundial, as equipas e os jogos de cada grupo." },
    ],
  }),
  component: Grupos,
});

function Grupos() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups", "full"],
    queryFn: async () => {
      const { data } = await supabase
        .from("groups")
        .select("id,name,teams(id,name,flag,code)")
        .order("name");
      return data ?? [];
    },
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["matches", "grupos-phase"],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id,kickoff_at,phase,status,voting_open,home_score,away_score,home:home_team_id(id,name,flag,group_id),away:away_team_id(id,name,flag,group_id)")
        .eq("phase", "grupos")
        .order("kickoff_at");
      return (data as any) ?? [];
    },
  });

  // Set grupo inicial quando dados carregam
  const firstGroup = groups[0] as any;
  const selectedId = activeGroup ?? firstGroup?.id ?? null;

  const selectedGroup = groups.find((g: any) => g.id === selectedId) as any;

  const groupMatches = matches.filter((m: any) =>
    m.home?.group_id === selectedId || m.away?.group_id === selectedId
  );

  if (isLoading) {
    return (
      <div className="px-4 pt-6 md:px-8">
        <div className="h-8 w-32 shimmer rounded-lg mb-6" />
        <div className="flex gap-2 mb-6">
          {[...Array(8)].map((_, i) => <div key={i} className="h-9 w-16 shimmer rounded-full" />)}
        </div>
        <div className="h-64 shimmer rounded-2xl" />
      </div>
    );
  }

  if (groups.length === 0) return <Empty />;

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <header className="mb-5">
        <h1 className="font-display text-3xl md:text-4xl">Grupos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">12 grupos · 48 equipas · Mundial 2026.</p>
      </header>

      {/* Tabs de grupo */}
      <div className="-mx-4 md:mx-0 overflow-x-auto px-4 md:px-0 mb-6">
        <div className="flex gap-2 w-max">
          {groups.map((g: any) => (
            <button key={g.id} onClick={() => setActiveGroup(g.id)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-smooth ${
                g.id === selectedId
                  ? "border-gold bg-gold text-background shadow-gold"
                  : "border-border bg-card/60 text-muted-foreground hover:border-gold/40 hover:text-foreground"
              }`}>
              {g.name.replace("Grupo ", "")}
            </button>
          ))}
        </div>
      </div>

      {selectedGroup && (
        <div className="space-y-4">
          {/* Equipas do grupo */}
          <div className="rounded-2xl border border-border bg-card/70 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 bg-background/20">
              <h2 className="font-display text-xl">{selectedGroup.name}</h2>
            </div>
            <ul className="divide-y divide-border/40">
              {(selectedGroup.teams ?? []).map((t: any, i: number) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                  <span className="text-2xl">{t.flag ?? "⚽"}</span>
                  <span className="font-semibold text-sm">{t.name}</span>
                  {t.code && <span className="ml-auto text-xs font-mono text-muted-foreground">{t.code}</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Jogos do grupo */}
          <div>
            <h3 className="font-display text-lg mb-3 text-muted-foreground uppercase tracking-wider text-sm">
              Jogos do {selectedGroup.name}
            </h3>
            {groupMatches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
                Sem jogos disponíveis.
              </div>
            ) : (
              <div className="space-y-2">
                {groupMatches.map((m: any) => (
                  <Link key={m.id} to="/jogo/$id" params={{ id: m.id }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3 transition-smooth hover:border-gold/40 group">
                    {/* Home */}
                    <div className="flex flex-1 items-center gap-2 justify-end">
                      <span className="text-sm font-semibold text-right">{m.home.name}</span>
                      <span className="text-xl">{m.home.flag ?? "⚽"}</span>
                    </div>

                    {/* Marcador / hora */}
                    <div className="flex flex-col items-center min-w-[60px]">
                      {m.home_score != null && m.away_score != null ? (
                        <span className="font-display text-xl text-foreground">
                          {m.home_score} : {m.away_score}
                        </span>
                      ) : (
                        <span className="font-display text-base text-gold">
                          {formatTime(m.kickoff_at)}
                        </span>
                      )}
                      {m.status === "live" && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-400 mt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                          Ao Vivo
                        </span>
                      )}
                      {m.status === "finished" && (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Final</span>
                      )}
                    </div>

                    {/* Away */}
                    <div className="flex flex-1 items-center gap-2">
                      <span className="text-xl">{m.away.flag ?? "⚽"}</span>
                      <span className="text-sm font-semibold">{m.away.name}</span>
                    </div>

                    <span className="text-[10px] font-semibold text-gold opacity-0 group-hover:opacity-100 transition-smooth">→</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Empty() {
  const letters = ["A","B","C","D","E","F","G","H"];
  return (
    <div className="px-4 pt-6 md:px-8">
      <h1 className="font-display text-3xl mb-6">Grupos</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {letters.map(l => (
          <div key={l} className="rounded-2xl border border-dashed border-border bg-card/40 p-5">
            <h2 className="font-display text-xl">Grupo {l}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Equipas em breve.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
