import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

const PHASES = [
  { key: "geral", label: "Ranking Geral" },
  { key: "grupos", label: "Fase de Grupos" },
  { key: "oitavos", label: "Oitavos" },
  { key: "quartos", label: "Quartos" },
  { key: "meias", label: "Meias-Finais" },
] as const;

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Rankings — Voz do Mundial" },
      { name: "description", content: "Vê o ranking dos adeptos por fase do Mundial." },
    ],
  }),
  component: Rankings,
});

function Rankings() {
  const [phase, setPhase] = useState<typeof PHASES[number]["key"]>("geral");

  const { data: rows = [] } = useQuery({
    queryKey: ["ranking", phase],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,display_name,total_points,predictions_made,predictions_correct")
        .order("total_points", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <h1 className="font-display text-3xl">Rankings</h1>
        <p className="text-sm text-muted-foreground">Compete por fase do Mundial e ganha prémios.</p>
      </header>

      <div className="mb-5 -mx-5 overflow-x-auto px-5">
        <div className="flex gap-2">
          {PHASES.map((p) => (
            <button
              key={p.key}
              onClick={() => setPhase(p.key)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-smooth ${
                phase === p.key
                  ? "border-gold bg-gold text-background"
                  : "border-border bg-card/60 text-muted-foreground hover:border-gold/40"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/70">
        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <Trophy className="mx-auto mb-2 h-8 w-8 text-gold" />
            <p className="font-display text-lg">Ainda sem ranking</p>
            <p className="text-sm text-muted-foreground">Sê o primeiro a votar para subir ao topo.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Adepto</th>
                <th className="px-2 py-2 text-right">Pts</th>
                <th className="px-2 py-2 text-right">Acertos</th>
                <th className="px-2 py-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const acc = r.predictions_made > 0
                  ? Math.round((r.predictions_correct / r.predictions_made) * 100)
                  : 0;
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2.5">
                      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                        i === 0 ? "bg-gold text-background" : i < 3 ? "bg-gold/30 text-gold" : "bg-secondary"
                      }`}>{i + 1}</span>
                    </td>
                    <td className="px-3 py-2.5 font-medium">{r.display_name ?? "Adepto"}</td>
                    <td className="px-2 py-2.5 text-right font-display text-gold">{r.total_points}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">{r.predictions_correct}/{r.predictions_made}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">{acc}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card/50 p-5 text-xs text-muted-foreground">
        <h3 className="mb-2 font-display text-base text-foreground">Critérios de desempate</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Maior pontuação total.</li>
          <li>Maior percentagem de acerto.</li>
          <li>Menor número de previsões feitas.</li>
          <li>Quem submeteu primeiro a previsão.</li>
        </ol>
      </div>
    </div>
  );
}
