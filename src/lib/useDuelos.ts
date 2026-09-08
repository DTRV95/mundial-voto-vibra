import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Duelos 1 contra 1.
 *
 * Os pontos do ranking de duelos nunca são guardados: a base de dados
 * guarda só o resultado, e a vista `ranking_duelos` soma-os na leitura.
 */

export type TipoDuelo = "jogo" | "jornada" | "mes";

export const PESO_DUELO: Record<TipoDuelo, number> = { jogo: 2, jornada: 3, mes: 6 };

export const ROTULO_DUELO: Record<TipoDuelo, string> = {
  jogo: "Jogo",
  jornada: "Jornada",
  mes: "Mês",
};

export const EXPLICACAO_DUELO: Record<TipoDuelo, string> = {
  jogo: "Quem fizer mais pontos neste jogo.",
  jornada: "Quem fizer mais pontos nos 8 jogos da jornada.",
  mes: "Quem fizer mais pontos no mês inteiro.",
};

export interface Duelo {
  id: string;
  desafiante_id: string;
  adversario_id: string;
  tipo: TipoDuelo;
  competition_id: string;
  match_id: string | null;
  round_id: string | null;
  month_id: string | null;
  pool_id: string | null;
  estado: "pendente" | "aceite" | "recusado" | "resolvido" | "expirado";
  pontos_desafiante: number | null;
  pontos_adversario: number | null;
  resultado: "desafiante" | "adversario" | "empate" | null;
  vale_pontos: boolean;
  criado_em: string;
  resolvido_em: string | null;
  /** Preenchido no cliente */
  outro?: { id: string; display_name: string | null; avatar_url: string | null };
  /** true se o utilizador atual é o desafiante */
  sou_desafiante?: boolean;
}

/** O mês atual no formato que a vista de ranking usa. */
export function mesCorrente(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Todos os duelos em que o utilizador participa. */
export function useMeusDuelos(userId: string | undefined) {
  return useQuery({
    queryKey: ["duelos", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<Duelo[]> => {
      const { data } = await (supabase as any)
        .from("duels")
        .select("*")
        .or(`desafiante_id.eq.${userId},adversario_id.eq.${userId}`)
        .order("criado_em", { ascending: false });

      const duelos = (data ?? []) as Duelo[];
      if (duelos.length === 0) return [];

      const outros = [
        ...new Set(
          duelos.map((d) => (d.desafiante_id === userId ? d.adversario_id : d.desafiante_id)),
        ),
      ];
      const { data: perfis } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", outros);
      const mapa = new Map((perfis ?? []).map((p: any) => [p.id, p]));

      return duelos.map((d) => {
        const souDesafiante = d.desafiante_id === userId;
        return {
          ...d,
          sou_desafiante: souDesafiante,
          outro: mapa.get(souDesafiante ? d.adversario_id : d.desafiante_id),
        };
      });
    },
  });
}

export interface LinhaDuelos {
  user_id: string;
  pontos: number;
  duelos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  rank: number;
  display_name: string | null;
  avatar_url: string | null;
}

/** Ranking de duelos de um mês (reinicia todos os meses). */
export function useRankingDuelos(mes: string) {
  return useQuery({
    queryKey: ["ranking-duelos", mes],
    staleTime: 60_000,
    queryFn: async (): Promise<LinhaDuelos[]> => {
      const { data } = await (supabase as any)
        .from("ranking_duelos")
        .select("user_id,pontos,duelos,vitorias,empates,derrotas")
        .eq("mes", mes);

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
        // Desempate: pontos → mais vitórias → menos duelos jogados
        .sort((a, b) => b.pontos - a.pontos || b.vitorias - a.vitorias || a.duelos - b.duelos)
        .map((l, i) => ({ ...l, rank: i + 1 }));
    },
  });
}

export interface Rivalidade {
  adversario: string;
  duelos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  ultimo_duelo: string;
  display_name: string | null;
  avatar_url: string | null;
}

/** Confronto direto contra cada adversário — permanente. */
export function useRivalidades(userId: string | undefined) {
  return useQuery({
    queryKey: ["rivalidades", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<Rivalidade[]> => {
      const { data } = await (supabase as any)
        .from("rivalidades")
        .select("adversario,duelos,vitorias,empates,derrotas,ultimo_duelo")
        .eq("user_id", userId);

      const linhas = (data ?? []) as any[];
      if (linhas.length === 0) return [];

      const { data: perfis } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", linhas.map((l) => l.adversario));
      const mapa = new Map((perfis ?? []).map((p: any) => [p.id, p]));

      return linhas
        .map((l) => ({
          ...l,
          display_name: mapa.get(l.adversario)?.display_name ?? null,
          avatar_url: mapa.get(l.adversario)?.avatar_url ?? null,
        }))
        .sort((a, b) => b.duelos - a.duelos);
    },
  });
}

/** Quantos duelos pontuados já houve contra este adversário este mês (limite: 2). */
export function useDuelosEsteMes(userId: string | undefined, adversarioId: string | undefined) {
  return useQuery({
    queryKey: ["duelos-mes", userId, adversarioId],
    enabled: !!userId && !!adversarioId,
    staleTime: 30_000,
    queryFn: async (): Promise<number> => {
      const inicioMes = new Date();
      inicioMes.setUTCDate(1);
      inicioMes.setUTCHours(0, 0, 0, 0);

      const { count } = await (supabase as any)
        .from("duels")
        .select("id", { count: "exact", head: true })
        .eq("estado", "resolvido")
        .eq("vale_pontos", true)
        .gte("resolvido_em", inicioMes.toISOString())
        .or(
          `and(desafiante_id.eq.${userId},adversario_id.eq.${adversarioId}),` +
          `and(desafiante_id.eq.${adversarioId},adversario_id.eq.${userId})`,
        );
      return count ?? 0;
    },
  });
}

/** Lançar um desafio. */
export function useDesafiar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: {
      desafiante_id: string;
      adversario_id: string;
      tipo: TipoDuelo;
      competition_id: string;
      match_id?: string | null;
      round_id?: string | null;
      month_id?: string | null;
      pool_id?: string | null;
    }) => {
      const { error } = await (supabase as any).from("duels").insert({
        ...d,
        match_id: d.match_id ?? null,
        round_id: d.round_id ?? null,
        month_id: d.month_id ?? null,
        pool_id: d.pool_id ?? null,
        estado: "pendente",
      });
      if (error) {
        // O índice único trava desafios repetidos ao mesmo alvo
        if (error.code === "23505") throw new Error("Já tens um desafio em aberto com este adepto para o mesmo alvo.");
        throw new Error(error.message);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["duelos"] }); },
  });
}

/** Aceitar ou recusar um desafio. */
export function useResponderDuelo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, aceitar }: { id: string; aceitar: boolean }) => {
      const { error } = await (supabase as any)
        .from("duels")
        .update({ estado: aceitar ? "aceite" : "recusado", respondido_em: new Date().toISOString() })
        .eq("id", id)
        .eq("estado", "pendente");
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["duelos"] }); },
  });
}
