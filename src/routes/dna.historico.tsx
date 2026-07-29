import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useActiveCompetition } from "@/lib/useActiveCompetition";
import { CompetitionAtmosphere, PageHeader } from "@/components/CompetitionAtmosphere";
import { useResumos, type ResumoMensal } from "@/lib/useMes";
import { ResumoCompacto, ResumoMensalCartoes } from "@/components/dna/ResumoMensal";

export const Route = createFileRoute("/dna/historico")({
  head: () => ({
    meta: [
      { title: "Histórico mensal — Uma Geração" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Historico,
});

function Historico() {
  const { user } = useAuth();
  const { active: comp } = useActiveCompetition();
  const { data: resumos = [], isLoading } = useResumos(user?.id);
  const [aVer, setAVer] = useState<ResumoMensal | null>(null);

  if (!user) return null;

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <CompetitionAtmosphere comp={comp} />

      <Link to="/dna"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-smooth hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> O teu DNA
      </Link>

      <PageHeader title="Histórico mensal"
        subtitle="Cada mês fechado fica guardado exatamente como terminou." comp={comp} />

      <div className="mx-auto max-w-2xl space-y-3">
        {isLoading && <div className="shimmer h-32 rounded-2xl" />}

        {!isLoading && resumos.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="font-display text-lg">Ainda sem meses fechados</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              O teu primeiro resumo mensal aparece aqui quando o mês terminar.
            </p>
          </div>
        )}

        {resumos.map(r => (
          <button key={r.cycleId} onClick={() => setAVer(r)} className="block w-full text-left">
            <ResumoCompacto resumo={r} />
          </button>
        ))}
      </div>

      {aVer && (
        <ResumoMensalCartoes resumo={aVer} comp={comp} aoFechar={() => setAVer(null)} />
      )}
    </div>
  );
}
