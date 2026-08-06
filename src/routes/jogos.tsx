import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/useAuth";
import { MatchCard } from "@/components/MatchCard";
import { useActiveCompetition } from "@/lib/useActiveCompetition";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { PageTabs, ABAS_JOGAR } from "@/components/PageTabs";
import { CompetitionAtmosphere, PageHeader, CompetitionPicker } from "@/components/CompetitionAtmosphere";
import { useJornadas } from "@/lib/useJornada";

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
      { name: "description", content: "Os 5 jogos oficiais de cada jornada. Dá a tua previsão antes do apito inicial e sobe no ranking." },
      { property: "og:title", content: "A tua jornada — Uma Geração" },
      { property: "og:description", content: "Os 5 jogos oficiais de cada jornada. Dá a tua previsão e compara com a comunidade." },
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
        subtitle="5 jogos oficiais — os mesmos para toda a gente."
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
            Assim que a próxima jornada de {active?.name ?? "competição"} for publicada, os 5 jogos aparecem aqui.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {jornadas.map((r) => (
          <section key={r.label}>
            <div className="mb-3 flex items-end gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {active?.short}
                </p>
                <h2 className="font-display text-3xl uppercase leading-none md:text-4xl"
                  style={{ color: active?.accent }}>
                  {r.label}
                </h2>
              </div>
              <div className="mb-1.5 h-px flex-1 bg-border" />
              {user ? (
                <span className="mb-0.5 flex shrink-0 items-center gap-1.5">
                  {r.votados === r.jogos.length && (
                    <CheckCircle2 className="h-4 w-4 text-wc-green" />
                  )}
                  <span className={`font-display text-2xl leading-none tabular-nums ${
                    r.votados === r.jogos.length ? "text-wc-green" : "text-foreground"
                  }`}>
                    {r.votados}<span className="text-muted-foreground">/{r.jogos.length}</span>
                  </span>
                </span>
              ) : (
                <span className="mb-1 shrink-0 text-xs text-muted-foreground">{r.jogos.length} jogos</span>
              )}
            </div>

            {/* Barra de progresso */}
            {user && (
              <div className="mb-3 h-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(r.votados / Math.max(r.jogos.length, 1)) * 100}%`,
                    background: active?.accent ?? "var(--gold)",
                  }}
                />
              </div>
            )}

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
                      />
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    {restantes.map((m) => <MatchCard key={m.id} match={m} />)}
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
