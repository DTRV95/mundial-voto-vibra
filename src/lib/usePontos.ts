import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Pontos e rankings — sempre calculados, nunca guardados.
 *
 * Lê as vistas `pontos_por_competicao` / `pontos_por_mes` / `pontos_totais`,
 * que somam `predictions.points` dos jogos oficiais já terminados.
 */

export interface LinhaRanking {
  user_id: string;
  pontos: number;
  previsoes: number;
  acertos: number;
  /** Posição no ranking, 1 = primeiro */
  rank: number;
  display_name: string | null;
  avatar_url: string | null;
}

/** Junta os perfis às linhas de pontos e ordena. */
async function comPerfis(linhas: any[]): Promise<LinhaRanking[]> {
  if (linhas.length === 0) return [];

  const ids = [...new Set(linhas.map((l) => l.user_id))];
  const perfis: any[] = [];
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await supabase
      .from("profiles")
      .select("id,display_name,avatar_url")
      .in("id", ids.slice(i, i + 300));
    perfis.push(...(data ?? []));
  }
  const mapa = new Map(perfis.map((p) => [p.id, p]));

  return linhas
    .map((l) => ({
      user_id: l.user_id,
      pontos: l.pontos ?? 0,
      previsoes: l.previsoes ?? 0,
      acertos: l.acertos ?? 0,
      display_name: mapa.get(l.user_id)?.display_name ?? null,
      avatar_url: mapa.get(l.user_id)?.avatar_url ?? null,
      rank: 0,
    }))
    .sort((a, b) =>
      // Desempate: pontos → percentagem de acerto → menos previsões feitas
      b.pontos - a.pontos ||
      b.acertos / Math.max(b.previsoes, 1) - a.acertos / Math.max(a.previsoes, 1) ||
      a.previsoes - b.previsoes,
    )
    .map((l, i) => ({ ...l, rank: i + 1 }));
}

/**
 * Ranking de uma competição, ou o total combinado quando
 * `competitionId` é `null`.
 */
export function useRanking(competitionId: string | null | undefined) {
  const combinado = !competitionId;
  return useQuery({
    queryKey: ["ranking", competitionId ?? "total"],
    staleTime: 60_000,
    queryFn: async (): Promise<LinhaRanking[]> => {
      const db = supabase as any;
      if (combinado) {
        const { data } = await db.from("pontos_totais").select("user_id,pontos,previsoes,acertos");
        return comPerfis(data ?? []);
      }
      const { data } = await db
        .from("pontos_por_competicao")
        .select("user_id,pontos,previsoes,acertos")
        .eq("competition_id", competitionId);
      return comPerfis(data ?? []);
    },
  });
}

/** Ranking de um mês competitivo (base das divisões mensais). */
export function useRankingMes(monthId: string | null | undefined) {
  return useQuery({
    queryKey: ["ranking-mes", monthId],
    enabled: !!monthId,
    staleTime: 60_000,
    queryFn: async (): Promise<LinhaRanking[]> => {
      const { data } = await (supabase as any)
        .from("pontos_por_mes")
        .select("user_id,pontos,previsoes,acertos")
        .eq("month_id", monthId);
      return comPerfis(data ?? []);
    },
  });
}

export interface MesCompetitivo {
  id: string;
  label: string;
  year: number;
  month: number;
  starts_on: string;
  ends_on: string;
  status: string;
}

/** Meses competitivos de uma competição, do mais recente para trás. */
export function useMeses(competitionId: string | null | undefined) {
  return useQuery({
    queryKey: ["meses", competitionId],
    enabled: !!competitionId,
    staleTime: 300_000,
    queryFn: async (): Promise<MesCompetitivo[]> => {
      const { data } = await (supabase as any)
        .from("competition_months")
        .select("id,label,year,month,starts_on,ends_on,status")
        .eq("competition_id", competitionId)
        .order("year")
        .order("month");
      return (data ?? []) as MesCompetitivo[];
    },
  });
}

/** O mês em curso — o que contém a data de hoje, ou o mais próximo. */
export function mesAtual(meses: MesCompetitivo[]): MesCompetitivo | null {
  if (meses.length === 0) return null;
  const hoje = new Date().toISOString().slice(0, 10);
  return (
    meses.find((m) => m.starts_on <= hoje && hoje <= m.ends_on) ??
    meses.filter((m) => m.ends_on < hoje).at(-1) ??
    meses[0]
  );
}

/** Os pontos do próprio utilizador numa competição (ou no total). */
export function useOsMeusPontos(userId: string | undefined, competitionId: string | null) {
  const { data: ranking = [], isLoading } = useRanking(competitionId);
  const eu = userId ? ranking.find((l) => l.user_id === userId) ?? null : null;
  return { eu, total: ranking.length, isLoading };
}
