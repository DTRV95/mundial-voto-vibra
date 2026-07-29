import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Estatísticas de um utilizador — fonte única.
 *
 * Substitui `profiles.total_points`, que era INCREMENTADO a cada
 * resultado. Era esse mecanismo que provocou os pontos a dobrar no
 * Mundial, e o que fazia o perfil dizer um número e o ranking outro.
 *
 * Aqui tudo vem de `v_dna_progresso`, que soma `predictions.points`
 * dos jogos oficiais terminados. Se divergir do ranking, é porque o
 * ranking está errado — não há duas contas possíveis.
 */

export interface Estatisticas {
  pontos: number;
  /** Jogos oficiais já disputados em que houve previsão */
  previsoes: number;
  /** Mercados acertados e tentados */
  acertos: number;
  tentativas: number;
  /** Percentagem de acerto, ou null sem amostra */
  acertoPct: number | null;
}

const VAZIO: Estatisticas = {
  pontos: 0, previsoes: 0, acertos: 0, tentativas: 0, acertoPct: null,
};

export function useEstatisticas(userId: string | undefined) {
  return useQuery({
    queryKey: ["estatisticas", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<Estatisticas> => {
      const { data } = await (supabase as any)
        .from("v_dna_progresso")
        .select("pontos,previsoes_avaliadas,mercados_certos,mercados_tentados")
        .eq("user_id", userId)
        .maybeSingle();

      if (!data) return VAZIO;

      const tentativas = data.mercados_tentados ?? 0;
      return {
        pontos: data.pontos ?? 0,
        previsoes: data.previsoes_avaliadas ?? 0,
        acertos: data.mercados_certos ?? 0,
        tentativas,
        acertoPct: tentativas > 0
          ? Math.round(((data.mercados_certos ?? 0) / tentativas) * 100) : null,
      };
    },
  });
}

/** Estatísticas de vários utilizadores de uma vez, para listas. */
export function useEstatisticasDe(userIds: string[]) {
  return useQuery({
    queryKey: ["estatisticas-varios", [...userIds].sort().join(",")],
    enabled: userIds.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<Map<string, Estatisticas>> => {
      const { data } = await (supabase as any)
        .from("v_dna_progresso")
        .select("user_id,pontos,previsoes_avaliadas,mercados_certos,mercados_tentados")
        .in("user_id", userIds);

      const mapa = new Map<string, Estatisticas>();
      for (const l of ((data ?? []) as any[])) {
        const tentativas = l.mercados_tentados ?? 0;
        mapa.set(l.user_id, {
          pontos: l.pontos ?? 0,
          previsoes: l.previsoes_avaliadas ?? 0,
          acertos: l.mercados_certos ?? 0,
          tentativas,
          acertoPct: tentativas > 0
            ? Math.round(((l.mercados_certos ?? 0) / tentativas) * 100) : null,
        });
      }
      // Quem não tem linha ainda não pontuou — zeros, não ausência
      for (const id of userIds) if (!mapa.has(id)) mapa.set(id, VAZIO);
      return mapa;
    },
  });
}

/** A posição de alguém no ranking geral, calculada da mesma fonte. */
export function usePosicaoGeral(userId: string | undefined) {
  return useQuery({
    queryKey: ["posicao-geral", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<number | null> => {
      const { data } = await (supabase as any)
        .from("v_divisao")
        .select("posicao")
        .eq("user_id", userId)
        .maybeSingle();
      return data?.posicao ?? null;
    },
  });
}
