import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos do Mundial — Voz do Mundial" },
      { name: "description", content: "Vê todos os grupos do Mundial e as equipas em cada grupo." },
    ],
  }),
  component: Grupos,
});

function Grupos() {
  const { data: groups = [] } = useQuery({
    queryKey: ["groups", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("groups")
        .select("id,name,teams(id,name,flag,code)")
        .order("name");
      return data ?? [];
    },
  });

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <h1 className="font-display text-3xl">Grupos</h1>
        <p className="text-sm text-muted-foreground">Os 8 grupos do Mundial e as equipas em cada um.</p>
      </header>

      {groups.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g: any) => (
            <div key={g.id} className="rounded-2xl border border-border bg-card/70 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-xl">{g.name}</h2>
                <span className="text-xs text-muted-foreground">{(g.teams ?? []).length} equipas</span>
              </div>
              <ul className="space-y-2">
                {(g.teams ?? []).map((t: any) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{t.flag ?? "⚽"}</span>
                    <span className="font-medium">{t.name}</span>
                    {t.code && <span className="ml-auto text-xs text-muted-foreground">{t.code}</span>}
                  </li>
                ))}
                {(!g.teams || g.teams.length === 0) && (
                  <li className="text-sm text-muted-foreground">Sem equipas atribuídas.</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty() {
  const placeholders = ["A","B","C","D","E","F","G","H"];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {placeholders.map((p) => (
        <div key={p} className="rounded-2xl border border-dashed border-border bg-card/40 p-5">
          <h2 className="font-display text-xl">Grupo {p}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Equipas em breve.</p>
        </div>
      ))}
    </div>
  );
}
