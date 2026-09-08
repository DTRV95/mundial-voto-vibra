import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Configuração de uma liga privada e pontuação dos seus membros.
 *
 * Os pontos da liga são somados das previsões na leitura — já não
 * dependem de `profiles.total_points`, que ainda tem os pontos do
 * Mundial e vai ser zerado.
 */

export type FiltroJogos = "todos" | "grandes" | "equipa";

export const ROTULO_FILTRO: Record<FiltroJogos, string> = {
  todos: "Todos os jogos oficiais",
  grandes: "Só jogos dos grandes",
  equipa: "Só jogos de um clube",
};

export const EXPLICACAO_FILTRO: Record<FiltroJogos, string> = {
  todos: "Contam os 8 jogos oficiais de cada jornada.",
  grandes: "Contam só os jogos com Benfica, FC Porto ou Sporting CP.",
  equipa: "Contam só os jogos do clube que escolheres.",
};

export interface ConfigLiga {
  competition_ids: string[] | null;
  filtro_jogos: FiltroJogos;
  equipa_id: string | null;
  duelos_ativos: boolean;
}

export interface MembroLiga {
  user_id: string;
  pontos: number;
  previsoes: number;
  acertos: number;
  rank: number;
  display_name: string | null;
  avatar_url: string | null;
}

/** Classificação de uma liga, já com a configuração dela aplicada. */
export function useRankingLiga(poolId: string | undefined) {
  return useQuery({
    queryKey: ["ranking-liga", poolId],
    enabled: !!poolId,
    staleTime: 60_000,
    queryFn: async (): Promise<MembroLiga[]> => {
      const { data } = await (supabase as any)
        .from("pontos_liga")
        .select("user_id,pontos,previsoes,acertos")
        .eq("pool_id", poolId);

      const linhas = (data ?? []) as any[];
      if (linhas.length === 0) return [];

      const { data: perfis } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", linhas.map((l) => l.user_id));
      const mapa = new Map((perfis ?? []).map((p: any) => [p.id, p]));

      return linhas
        .map((l) => ({
          ...l,
          display_name: mapa.get(l.user_id)?.display_name ?? null,
          avatar_url: mapa.get(l.user_id)?.avatar_url ?? null,
          rank: 0,
        }))
        .sort((a, b) =>
          b.pontos - a.pontos ||
          b.acertos / Math.max(b.previsoes, 1) - a.acertos / Math.max(a.previsoes, 1) ||
          a.previsoes - b.previsoes,
        )
        .map((l, i) => ({ ...l, rank: i + 1 }));
    },
  });
}

/** Guardar a configuração. Só o dono da liga consegue (RLS). */
export function useGuardarConfig(poolId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: Partial<ConfigLiga>) => {
      const { error } = await (supabase as any)
        .from("pools")
        .update(config)
        .eq("id", poolId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ranking-liga", poolId] });
      qc.invalidateQueries({ queryKey: ["pool"] });
    },
  });
}

/** Clubes disponíveis para o filtro "só jogos de um clube". */
export function useClubes() {
  return useQuery({
    queryKey: ["clubes"],
    staleTime: 300_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("teams")
        .select("id,name,short_name,monogram,is_grande")
        .eq("kind", "club")
        .order("name");
      return (data ?? []) as {
        id: string; name: string; short_name: string | null;
        monogram: string | null; is_grande: boolean;
      }[];
    },
  });
}

/** Descreve a configuração em português, para mostrar no cabeçalho da liga. */
export function descreverConfig(
  config: Partial<ConfigLiga> | null | undefined,
  nomesCompeticoes: Map<string, string>,
  nomeEquipa?: string | null,
): string {
  if (!config) return "Todos os jogos oficiais";

  const comps = config.competition_ids?.length
    ? config.competition_ids.map((id) => nomesCompeticoes.get(id) ?? "?").join(" + ")
    : "Todas as competições";

  const jogos =
    config.filtro_jogos === "grandes" ? "só jogos dos grandes"
    : config.filtro_jogos === "equipa" ? `só jogos do ${nomeEquipa ?? "clube escolhido"}`
    : "todos os jogos oficiais";

  return `${comps} · ${jogos}`;
}
