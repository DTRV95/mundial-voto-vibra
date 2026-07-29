import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/useAuth";
import { useActiveCompetition } from "@/lib/useActiveCompetition";
import { CompetitionAtmosphere, PageHeader } from "@/components/CompetitionAtmosphere";
import { BlocoDna } from "@/components/dna/BlocoDna";
import { useProgressoDna, useObservacaoInicial } from "@/lib/useDna";
import { Dna } from "lucide-react";

export const Route = createFileRoute("/dna")({
  head: () => ({
    meta: [
      { title: "O teu DNA futebolístico — Uma Geração" },
      { name: "description", content: "Descobre que tipo de prognosticador és. O teu perfil é calculado a partir das tuas previsões." },
      { property: "og:title", content: "O teu DNA futebolístico — Uma Geração" },
      { property: "og:url", content: "https://geracao2026.com/dna" },
      // Página pessoal e privada: não deve ser indexada
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dna_,
});

function Dna_() {
  const { user } = useAuth();
  const { active: comp } = useActiveCompetition();
  const { data: progresso, isLoading } = useProgressoDna(user?.id);
  const { data: observacao } = useObservacaoInicial(user?.id);

  if (!user) {
    return (
      <div className="px-5 pt-6 pb-10">
        <PageHeader title="O teu DNA futebolístico"
          subtitle="A tua identidade futebolística." comp={comp} />
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
          <Dna className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-display text-lg">Descobre que tipo de prognosticador és</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            O teu perfil é calculado a partir das tuas previsões. Sem questionários.
          </p>
          <Link to="/auth"
            className="mt-4 inline-block rounded-full bg-gold px-5 py-2 text-sm font-bold text-background shadow-gold">
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <CompetitionAtmosphere comp={comp} />

      <PageHeader
        eyebrow="A tua identidade futebolística"
        title="O teu DNA futebolístico"
        subtitle="Cada previsão ajuda-nos a descobrir que tipo de prognosticador és."
        comp={comp}
      />

      <div className="mx-auto max-w-2xl">
        {isLoading && <div className="shimmer h-64 rounded-3xl" />}

        {!isLoading && progresso && (
          <BlocoDna
            progresso={progresso}
            observacao={observacao ?? null}
            // Fase A: o motor de atribuição chega na Fase B.
            // Até lá, nunca se mostra um perfil — só o progresso real.
            perfil={null}
            traco={null}
            comp={comp}
          />
        )}

        {/* Os blocos "O teu mês" e "A última descoberta" ainda não
            existem: não teriam conteúdo verdadeiro. Aparecem quando
            houver dados, não antes. */}
      </div>
    </div>
  );
}
