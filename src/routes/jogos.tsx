import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/useAuth";
import { MatchCard } from "@/components/MatchCard";
import { useActiveCompetition } from "@/lib/useActiveCompetition";
import { CalendarClock } from "lucide-react";
import { PageTabs, ABAS_JOGAR } from "@/components/PageTabs";
import { CompetitionAtmosphere, PageHeader, CompetitionPicker } from "@/components/CompetitionAtmosphere";
import { useJornadas } from "@/lib/useJornada";
import { TalaoJornada } from "@/components/TalaoJornada";

/** As etiquetas que o admin pode pôr num jogo, por ordem de peso. */
const ETIQUETA_DESTAQUE: Record<string, string> = {
  classico: "O clássico da jornada",
  derbi: "O dérbi da jornada",
  decisivo: "Jogo decisivo",
  destaque: "Jogo da jornada",
};

const PESO_ETIQUETA: Record<string, number> = {
  classico: 4, derbi: 3, decisivo: 2, destaque: 1,
};

/**
 * O jogo com a etiqueta mais forte fica em primeiro; sem etiquetas,
 * manda a ordem que o admin definiu.
 */
function ordenarPorDestaque<T extends { highlight_tag: string | null; official_position: number | null }>(jogos: T[]): T[] {
  return [...jogos].sort((a, b) =>
    (PESO_ETIQUETA[b.highlight_tag ?? ""] ?? 0) - (PESO_ETIQUETA[a.highlight_tag ?? ""] ?? 0) ||
    (a.official_position ?? 99) - (b.official_position ?? 99),
  );
}

export const Route = createFileRoute("/jogos")({
  head: () => ({
    meta: [
      { title: "A tua jornada — Uma Geração" },
      { name: "description", content: "Os 8 jogos oficiais de cada jornada. Dá a tua previsão antes do apito inicial e sobe no ranking." },
      { property: "og:title", content: "A tua jornada — Uma Geração" },
      { property: "og:description", content: "Os 8 jogos oficiais de cada jornada. Dá a tua previsão e compara com a comunidade." },
      { property: "og:url", content: "https://geracao2026.com/jogos" },
    ],
    links: [{ rel: "canonical", href: "https://geracao2026.com/jogos" }],
  }),
  component: Jogos,
});

function Jogos() {
  const { user } = useAuth();
  const { competitions, active, setSlug } = useActiveCompetition();
  const { data: jornadas = [], isLoading } = useJornadas(active?.id, user?.id);

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <CompetitionAtmosphere comp={active} />

      <PageHeader
        eyebrow={active?.name}
        title="A tua jornada"
        subtitle={
          // O número vem da jornada que está aberta, não de uma
          // constante: as jornadas antigas foram publicadas com cinco
          // jogos e dizer-lhes "oito" era mentira.
          jornadas.length > 0
            ? `${jornadas[0].jogos.length} jogos oficiais — os mesmos para toda a gente.`
            : "Os jogos oficiais da jornada, os mesmos para toda a gente."
        }
        comp={active}
      />

      <PageTabs abas={ABAS_JOGAR} direita={
        <CompetitionPicker competitions={competitions} activeId={active?.id} onPick={setSlug} compacto />
      } />

      {isLoading && (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && jornadas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <CalendarClock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-display text-lg">Ainda não há jornada aberta</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Assim que a próxima jornada de {active?.name ?? "competição"} for publicada, os 8 jogos aparecem aqui.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {jornadas.map((r) => (
          <section key={r.label}>
            <div className="mb-4">
              <TalaoJornada
                label={r.label}
                competicao={active?.short}
                jogos={r.jogos}
                accent={active?.accent}
                autenticado={!!user}
              />
            </div>

            {/* O jogo da jornada ocupa a largura toda — os cinco não
                são iguais, e a página devia dizê-lo. */}
            {(() => {
              const [destaque, ...restantes] = ordenarPorDestaque(r.jogos);
              return (
                <>
                  {destaque && (
                    <div className="mb-3">
                      <MatchCard
                        match={destaque}
                        destaque
                        etiqueta={ETIQUETA_DESTAQUE[destaque.highlight_tag ?? ""] ?? "Jogo da jornada"}
                        votoRapido={!!user}
                      />
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    {restantes.map((m) => <MatchCard key={m.id} match={m} votoRapido={!!user} />)}
                  </div>
                </>
              );
            })()}
          </section>
        ))}
      </div>
    </div>
  );
}
