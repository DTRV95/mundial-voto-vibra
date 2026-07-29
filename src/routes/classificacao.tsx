import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table2 } from "lucide-react";
import { PageTabs, ABAS_JOGAR } from "@/components/PageTabs";
import { useActiveCompetition } from "@/lib/useActiveCompetition";
import { TeamBadge } from "@/lib/teamColors.tsx";

export const Route = createFileRoute("/classificacao")({
  head: () => ({
    meta: [
      { title: "Classificação — Uma Geração" },
      { name: "description", content: "A classificação da Liga Portugal e da Champions League, atualizada a cada jornada." },
      { property: "og:title", content: "Classificação — Uma Geração" },
      { property: "og:url", content: "https://geracao2026.com/classificacao" },
    ],
    links: [{ rel: "canonical", href: "https://geracao2026.com/classificacao" }],
  }),
  component: Classificacao,
});

interface Linha {
  team_id: string;
  posicao: number;
  jogos: number;
  pontos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golos_marcados: number;
  golos_sofridos: number;
  diferenca: number;
  nome: string;
  monograma: string | null;
  codigo: string | null;
}

function Classificacao() {
  const { competitions, active, setSlug } = useActiveCompetition();

  const { data: tabela = [], isLoading } = useQuery({
    queryKey: ["classificacao", active?.id],
    enabled: !!active?.id,
    staleTime: 120_000,
    queryFn: async (): Promise<Linha[]> => {
      const { data } = await (supabase as any)
        .from("classificacao")
        .select("team_id,posicao,jogos,pontos,vitorias,empates,derrotas,golos_marcados,golos_sofridos,diferenca")
        .eq("competition_id", active!.id)
        .order("posicao");

      const linhas = (data ?? []) as any[];
      if (linhas.length === 0) return [];

      const { data: equipas } = await (supabase as any)
        .from("teams")
        .select("id,name,short_name,monogram,code")
        .in("id", linhas.map(l => l.team_id));
      const mapa = new Map<string, any>((equipas ?? []).map((t: any) => [t.id, t]));

      return linhas.map(l => ({
        ...l,
        nome: mapa.get(l.team_id)?.short_name ?? mapa.get(l.team_id)?.name ?? "—",
        monograma: mapa.get(l.team_id)?.monogram ?? null,
        codigo: mapa.get(l.team_id)?.code ?? null,
      }));
    },
  });

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <header className="mb-5">
        <h1 className="font-display text-3xl md:text-4xl">Classificação</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Calculada a partir de todos os resultados, não só dos jogos oficiais.
        </p>
      </header>

      <PageTabs abas={ABAS_JOGAR} />

      {competitions.length > 1 && (
        <div className="mb-5 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex w-max gap-2">
            {competitions.map(c => {
              const on = c.id === active?.id;
              return (
                <button key={c.id} onClick={() => setSlug(c.slug)}
                  className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-smooth"
                  style={on
                    ? { borderColor: c.accent, background: c.accent, color: "#fff" }
                    : { borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                  {c.emoji} {c.short}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isLoading && <div className="shimmer h-96 rounded-2xl" />}

      {!isLoading && tabela.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Table2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-display text-lg">Ainda sem jogos disputados</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A classificação de {active?.name ?? "competição"} aparece aqui a partir da primeira jornada.
          </p>
        </div>
      )}

      {tabela.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card/70">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2.5 text-left font-bold">#</th>
                <th className="px-2 py-2.5 text-left font-bold">Equipa</th>
                <th className="px-2 py-2.5 text-center font-bold">J</th>
                <th className="px-2 py-2.5 text-center font-bold">V</th>
                <th className="px-2 py-2.5 text-center font-bold">E</th>
                <th className="px-2 py-2.5 text-center font-bold">D</th>
                <th className="px-2 py-2.5 text-center font-bold">GM</th>
                <th className="px-2 py-2.5 text-center font-bold">GS</th>
                <th className="px-2 py-2.5 text-center font-bold">DG</th>
                <th className="px-3 py-2.5 text-center font-bold">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {tabela.map(l => (
                <tr key={l.team_id} className="transition-smooth hover:bg-accent/40">
                  <td className="px-3 py-2.5">
                    <span className="grid h-6 w-6 place-items-center rounded-lg text-xs font-bold"
                      style={l.posicao <= 4
                        ? { background: `color-mix(in srgb, ${active?.accent ?? "var(--gold)"} 20%, transparent)`, color: active?.accent }
                        : { color: "var(--muted-foreground)" }}>
                      {l.posicao}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <TeamBadge code={l.codigo} flag={null} name={l.nome} size="sm" />
                      <span className="truncate font-semibold">{l.nome}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{l.jogos}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{l.vitorias}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{l.empates}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{l.derrotas}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{l.golos_marcados}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{l.golos_sofridos}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">
                    {l.diferenca > 0 ? `+${l.diferenca}` : l.diferenca}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="font-display text-lg text-gold">{l.pontos}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
