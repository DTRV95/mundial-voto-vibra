import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table2 } from "lucide-react";
import { useState } from "react";
import { PageTabs, ABAS_JOGAR } from "@/components/PageTabs";
import { CompetitionAtmosphere, PageHeader, CompetitionPicker } from "@/components/CompetitionAtmosphere";
import { useActiveCompetition } from "@/lib/useActiveCompetition";
import { TeamBadge } from "@/lib/teamColors.tsx";
import { nomeCurto } from "@/lib/clubBadge";

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
  emblema: string | null;
  /** Últimos cinco jogos, do mais antigo para o mais recente: "VVEDV" */
  forma: string | null;
  casa: Lado;
  fora: Lado;
}

interface Lado {
  jogos: number; vitorias: number; empates: number; derrotas: number;
  golos_marcados: number; golos_sofridos: number; pontos: number;
}

const LADO_VAZIO: Lado = {
  jogos: 0, vitorias: 0, empates: 0, derrotas: 0,
  golos_marcados: 0, golos_sofridos: 0, pontos: 0,
};

type Vista = "geral" | "casa" | "fora";

function Classificacao() {
  const { competitions, active, setSlug } = useActiveCompetition();
  const [vista, setVista] = useState<Vista>("geral");

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

      const [{ data: equipas }, { data: formas }] = await Promise.all([
        (supabase as any).from("teams")
          .select("id,name,short_name,monogram,code,crest_url")
          .in("id", linhas.map(l => l.team_id)),
        (supabase as any).from("v_forma_equipa")
          .select("*").eq("competition_id", active!.id)
          .in("team_id", linhas.map(l => l.team_id)),
      ]);

      const mapa = new Map<string, any>((equipas ?? []).map((t: any) => [t.id, t]));
      const forma = new Map<string, any>(((formas ?? []) as any[]).map(f => [f.team_id, f]));

      return linhas.map(l => {
        const f = forma.get(l.team_id);
        return {
          ...l,
          nome: mapa.get(l.team_id)?.short_name ?? mapa.get(l.team_id)?.name ?? "—",
          monograma: mapa.get(l.team_id)?.monogram ?? null,
          codigo: mapa.get(l.team_id)?.code ?? null,
          emblema: mapa.get(l.team_id)?.crest_url ?? null,
          forma: f?.forma ?? null,
          casa: f ? {
            jogos: f.casa_jogos, vitorias: f.casa_v, empates: f.casa_e, derrotas: f.casa_d,
            golos_marcados: f.casa_gm, golos_sofridos: f.casa_gs, pontos: f.casa_pontos,
          } : LADO_VAZIO,
          fora: f ? {
            jogos: f.fora_jogos, vitorias: f.fora_v, empates: f.fora_e, derrotas: f.fora_d,
            golos_marcados: f.fora_gm, golos_sofridos: f.fora_gs, pontos: f.fora_pontos,
          } : LADO_VAZIO,
        };
      });
    },
  });

  /**
   * Em "casa" e "fora" a tabela é outra: reordena-se pelos pontos
   * feitos só desse lado. Uma equipa forte em casa e frágil fora não
   * tem a mesma posição nas três vistas — é esse o objetivo.
   */
  const linhas = vista === "geral"
    ? tabela
    : [...tabela]
        .map(l => ({ ...l, lado: vista === "casa" ? l.casa : l.fora }))
        .sort((a, b) =>
          b.lado.pontos - a.lado.pontos ||
          (b.lado.golos_marcados - b.lado.golos_sofridos) - (a.lado.golos_marcados - a.lado.golos_sofridos) ||
          b.lado.golos_marcados - a.lado.golos_marcados)
        .map((l, i) => ({ ...l, posicao: i + 1 }));

  const dados = (l: any): Lado => vista === "geral"
    ? { jogos: l.jogos, vitorias: l.vitorias, empates: l.empates, derrotas: l.derrotas,
        golos_marcados: l.golos_marcados, golos_sofridos: l.golos_sofridos, pontos: l.pontos }
    : l.lado;

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <CompetitionAtmosphere comp={active} />

      <PageHeader
        eyebrow={active?.name}
        title="Classificação"
        subtitle="Como estão as equipas na competição. Para a classificação dos adeptos, vê os Rankings."
        comp={active}
      />

      <PageTabs abas={ABAS_JOGAR} direita={
        <CompetitionPicker competitions={competitions} activeId={active?.id} onPick={setSlug} compacto />
      } />

      {isLoading && <div className="shimmer h-96 rounded-2xl" />}

      {!isLoading && tabela.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Table2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-display text-lg">Ainda sem jogos disputados</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ainda não há jogos terminados {active?.name ? `da ${active.name}` : ""}.
            A tabela aparece aqui assim que a primeira jornada acabar.
          </p>
        </div>
      )}

      {tabela.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
            style={{ background: `${active?.accent ?? "#888"}1F`, color: active?.accent }}>
            {active?.emoji} {active?.name}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {tabela.length} equipas
          </span>
        </div>
      )}

      {tabela.length > 0 && (
        <div className="mb-3 inline-flex rounded-xl border border-border bg-card/60 p-1">
          {([["geral", "Geral"], ["casa", "Em casa"], ["fora", "Fora"]] as [Vista, string][]).map(([v, rotulo]) => (
            <button key={v} onClick={() => setVista(v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-smooth ${
                vista === v ? "text-background" : "text-muted-foreground hover:text-foreground"
              }`}
              style={vista === v ? { background: active?.accent ?? "var(--gold)" } : undefined}>
              {rotulo}
            </button>
          ))}
        </div>
      )}

      {tabela.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card/70">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2.5 text-left font-bold">#</th>
                <th className="px-2 py-2.5 text-left font-bold">Equipa</th>
                <th className="px-1.5 py-2.5 text-center font-bold">J</th>
                <th className="hidden px-2 py-2.5 text-center font-bold sm:table-cell">V</th>
                <th className="hidden px-2 py-2.5 text-center font-bold sm:table-cell">E</th>
                <th className="hidden px-2 py-2.5 text-center font-bold sm:table-cell">D</th>
                <th className="hidden px-2 py-2.5 text-center font-bold md:table-cell">GM</th>
                <th className="hidden px-2 py-2.5 text-center font-bold md:table-cell">GS</th>
                <th className="px-1.5 py-2.5 text-center font-bold">DG</th>
                <th className="px-2 py-2.5 text-center font-bold">Pts</th>
                <th className="hidden px-3 py-2.5 text-left font-bold sm:table-cell">Forma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {linhas.map(l => {
                const d = dados(l);
                return (
                <tr key={l.team_id} className="transition-smooth hover:bg-accent/40">
                  <td className="px-3 py-2.5">
                    <span className="grid h-6 w-6 place-items-center rounded-lg text-xs font-bold"
                      style={l.posicao <= 4
                        ? { background: `color-mix(in srgb, ${active?.accent ?? "var(--gold)"} 20%, transparent)`, color: active?.accent }
                        : { color: "var(--muted-foreground)" }}>
                      {l.posicao}
                    </span>
                  </td>
                  <td className="max-w-0 px-1.5 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <TeamBadge code={l.codigo} flag={null} name={l.nome} monogram={l.monograma} crest={l.emblema} size="sm" />
                      <div className="min-w-0">
                        <span className="block truncate font-semibold">{nomeCurto(l.nome)}</span>
                        {/* No telemóvel não há coluna para a forma: fica
                            aqui por baixo do nome, em miniatura. */}
                        <span className="mt-1 block sm:hidden">
                          <Forma forma={l.forma} mini />
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-1.5 py-2.5 text-center tabular-nums text-muted-foreground">{d.jogos}</td>
                  <td className="hidden px-2 py-2.5 text-center tabular-nums sm:table-cell">{d.vitorias}</td>
                  <td className="hidden px-2 py-2.5 text-center tabular-nums text-muted-foreground sm:table-cell">{d.empates}</td>
                  <td className="hidden px-2 py-2.5 text-center tabular-nums text-muted-foreground sm:table-cell">{d.derrotas}</td>
                  <td className="hidden px-2 py-2.5 text-center tabular-nums text-muted-foreground md:table-cell">{d.golos_marcados}</td>
                  <td className="hidden px-2 py-2.5 text-center tabular-nums text-muted-foreground md:table-cell">{d.golos_sofridos}</td>
                  <td className="px-1.5 py-2.5 text-center tabular-nums">
                    {(() => { const dg = d.golos_marcados - d.golos_sofridos;
                              return dg > 0 ? `+${dg}` : dg; })()}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className="font-display text-lg text-gold">{d.pontos}</span>
                  </td>
                  <td className="hidden px-3 py-2.5 sm:table-cell">
                    <Forma forma={l.forma} />
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Os últimos cinco jogos, do mais antigo à esquerda para o mais
 * recente à direita — a mesma direção em que o tempo se lê.
 *
 * A letra fica lá dentro de propósito: só cor não chega a quem não
 * distingue verde de vermelho.
 */
function Forma({ forma, mini = false }: { forma: string | null; mini?: boolean }) {
  if (!forma) return <span className="text-[11px] text-muted-foreground/40">—</span>;

  const cor: Record<string, string> = {
    V: "bg-wc-green/85 text-white",
    E: "bg-muted-foreground/30 text-foreground",
    D: "bg-wc-red/80 text-white",
  };
  const titulo: Record<string, string> = { V: "Vitória", E: "Empate", D: "Derrota" };

  return (
    <span className={`flex items-center ${mini ? "gap-0.5" : "gap-1"}`}>
      {forma.split("").map((r, i) => (
        <span key={i} title={titulo[r] ?? r}
          className={`grid place-items-center rounded font-bold ${
            mini ? "h-3 w-3 text-[7px]" : "h-5 w-5 rounded-md text-[10px]"
          } ${cor[r] ?? "bg-muted"}`}>
          {r}
        </span>
      ))}
    </span>
  );
}
