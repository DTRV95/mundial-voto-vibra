import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Trophy } from "lucide-react";
import { PHASE_LABEL } from "@/lib/format";

export const Route = createFileRoute("/premios")({
  head: () => ({
    meta: [
      { title: "Prémios — Voz do Mundial" },
      { name: "description", content: "Prémios para os vencedores de cada fase do Mundial." },
    ],
  }),
  component: Premios,
});

function Premios() {
  const { data: prizes = [] } = useQuery({
    queryKey: ["prizes"],
    queryFn: async () => {
      const { data } = await supabase.from("prizes").select("*").order("phase");
      return data ?? [];
    },
  });

  const phases: Array<keyof typeof PHASE_LABEL> = ["grupos", "oitavos", "quartos", "meias"];

  return (
    <div className="px-5 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-gold/15 text-gold">
          <Trophy className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl">Prémios</h1>
          <p className="text-sm text-muted-foreground">Um prémio para o vencedor de cada fase.</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {phases.map((phase) => {
          const prize = prizes.find((p) => p.phase === phase);
          return (
            <article key={phase} className="overflow-hidden rounded-2xl border border-border bg-card/70 backdrop-blur-sm">
              <div className="relative h-44 w-full bg-pitch">
                {prize?.image_url ? (
                  <img src={prize.image_url} alt={prize.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-gold/40">
                    <Gift className="h-12 w-12" />
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full border border-gold/40 bg-background/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold backdrop-blur">
                  {PHASE_LABEL[phase]}
                </span>
              </div>
              <div className="p-4">
                <h2 className="font-display text-xl">{prize?.name ?? "Prémio em breve"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {prize?.description ?? "A comunidade vai conhecer este prémio antes do arranque da fase."}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
