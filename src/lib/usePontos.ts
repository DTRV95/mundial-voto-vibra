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

/** Todos os adeptos registados, em blocos (o PostgREST limita a 1000). */
async function todosOsPerfis(): Promise<any[]> {
  const perfis: any[] = [];
  for (let inicio = 0; ; inicio += 1000) {
    const { data } = await supabase
      .from("profiles")
      .select("id,display_name,avatar_url")
      .range(inicio, inicio + 999);
    perfis.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return perfis;
}

/**
 * Constrói o ranking a partir de TODOS os adeptos registados,
 * não só dos que já pontuaram. Quem ainda não tem pontos aparece
 * na mesma, com zero — senão o ranking arrancaria vazio e as
 * pessoas não se encontrariam nele.
 */
async function comPerfis(linhas: any[]): Promise<LinhaRanking[]> {
  const perfis = await todosOsPerfis();
  if (perfis.length === 0) return [];

  const pontos = new Map(linhas.map((l) => [l.user_id, l]));

  return perfis
    .map((p) => {
      const l = pontos.get(p.id);
      return {
        user_id: p.id,
        pontos: l?.pontos ?? 0,
        previsoes: l?.previsoes ?? 0,
        acertos: l?.acertos ?? 0,
        display_name: p.display_name ?? null,
        avatar_url: p.avatar_url ?? null,
        rank: 0,
      };
    })
    .sort((a, b) =>
      // Desempate: pontos → percentagem de acerto → menos previsões feitas.
      // O nome no fim mantém a ordem estável entre quem tem tudo igual.
      b.pontos - a.pontos ||
      b.acertos / Math.max(b.previsoes, 1) - a.acertos / Math.max(a.previsoes, 1) ||
      a.previsoes - b.previsoes ||
      (a.display_name ?? "").localeCompare(b.display_name ?? "", "pt"),
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

/**
 * Identificador do ranking, para a tendência saber com o que comparar.
 * Tem de ser igual ao que a função `gravar_fotografia_ranking()` escreve.
 */
export function escopoDe(opts: { competitionId?: string | null; monthId?: string | null }): string {
  if (opts.monthId) return `mes:${opts.monthId}`;
  if (opts.competitionId) return `comp:${opts.competitionId}`;
  return "total";
}

/**
 * Posição anterior de cada utilizador neste ranking — a base da
 * seta de subiu/desceu. Devolve um mapa user_id → posição de ontem.
 */
export function useTendencia(escopo: string) {
  return useQuery({
    queryKey: ["tendencia", escopo],
    staleTime: 300_000,
    queryFn: async (): Promise<Map<string, number>> => {
      const { data } = await (supabase as any)
        .from("ranking_tendencia")
        .select("user_id,rank_anterior")
        .eq("escopo", escopo);
      return new Map<string, number>(
        ((data ?? []) as any[]).map((r) => [r.user_id, r.rank_anterior]),
      );
    },
  });
}

/** Os pontos do próprio utilizador numa competição (ou no total). */
export function useOsMeusPontos(userId: string | undefined, competitionId: string | null) {
  const { data: ranking = [], isLoading } = useRanking(competitionId);
  const eu = userId ? ranking.find((l) => l.user_id === userId) ?? null : null;
  return { eu, total: ranking.length, isLoading };
}
