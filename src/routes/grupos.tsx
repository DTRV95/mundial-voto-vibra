import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos do Mundial — Ultima Geração" },
      { name: "description", content: "Os 12 grupos do Mundial 2026 e as equipas de cada grupo." },
    ],
  }),
  component: Grupos,
});

function Grupos() {
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

  if (isLoading) {
    return (
      <div className="px-4 pt-6 md:px-8">
        <div className="h-8 w-48 shimmer rounded-lg mb-6" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-44 shimmer rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const letters = ["A","B","C","D","E","F","G","H","I","J","K","L"];

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl">Grupos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          12 grupos · 48 equipas · Mundial 2026
        </p>
      </header>

      {groups.length === 0 ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2">
          {letters.map(l => (
            <div key={l} className="rounded-2xl border border-dashed border-border bg-card/40 p-5">
              <h2 className="font-display text-xl mb-3">Grupo {l}</h2>
              <p className="text-sm text-muted-foreground">Equipas em breve.</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g: any) => (
            <div key={g.id} className="rounded-2xl border border-border bg-card/70 overflow-hidden">
              {/* Header do grupo */}
              <div className="px-4 py-2.5 border-b border-border/60 bg-background/30">
                <h2 className="font-display text-lg text-gold">{g.name}</h2>
              </div>
              {/* Equipas */}
              <ul className="divide-y divide-border/30">
                {(g.teams ?? []).map((t: any, i: number) => (
                  <li key={t.id} className="flex items-center gap-2.5 px-4 py-2.5">
                    <span className="w-4 text-center text-[11px] font-bold text-muted-foreground">{i + 1}</span>
                    <span className="text-xl leading-none">{t.flag ?? "⚽"}</span>
                    <span className="text-sm font-medium truncate">{t.name}</span>
                    {t.code && (
                      <span className="ml-auto text-[10px] font-mono font-bold text-muted-foreground/60 shrink-0">{t.code}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
