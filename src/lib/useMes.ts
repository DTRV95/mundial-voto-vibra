import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * O teu mês — rival e missão, tratados como uma coisa só.
 *
 * O progresso da missão é calculado, nunca guardado durante o mês.
 * Só o valor final é congelado no fecho.
 */

export const MISSOES: Record<string, { titulo: string; unidade: string }> = {
  arranque:         { titulo: "Completa a tua primeira jornada", unidade: "jornada" },
  participacao:     { titulo: "Completa 3 jornadas este mês", unidade: "jornadas" },
  exato:            { titulo: "Acerta 2 resultados exatos", unidade: "exatos" },
  bancada:          { titulo: "Acerta uma previsão contra a bancada", unidade: "acerto" },
  golos:            { titulo: "Acerta 3 previsões de mais ou menos de 2.5", unidade: "acertos" },
  outra_competicao: { titulo: "Faz uma previsão na outra competição", unidade: "competição" },
};

export interface Mes {
  cycleId: string;
  label: string;
  rival: {
    nome: string;
    avatar: string | null;
    meus: number;
    dele: number;
    motivo: string;
  } | null;
  missao: {
    codigo: string;
    titulo: string;
    alvo: number;
    progresso: number;
    porque: string;
  } | null;
}

export function useMes(userId: string | undefined) {
  return useQuery({
    queryKey: ["o-meu-mes", userId],
    enabled: !!userId,
    staleTime: 120_000,
    queryFn: async (): Promise<Mes | null> => {
      const db = supabase as any;

      const { data: ciclo } = await db
        .from("monthly_cycles")
        .select("id,label,starts_on,ends_on")
        .eq("status", "aberto")
        .lte("starts_on", new Date().toISOString().slice(0, 10))
        .gte("ends_on", new Date().toISOString().slice(0, 10))
        .maybeSingle();

      if (!ciclo) return null;

      const [rivalRes, missaoRes] = await Promise.all([
        db.from("user_rivals").select("rival_id,motivo")
          .eq("user_id", userId).eq("cycle_id", ciclo.id).maybeSingle(),
        db.from("user_missions").select("codigo,alvo,porque")
          .eq("user_id", userId).eq("cycle_id", ciclo.id).maybeSingle(),
      ]);

      // ── Rival: pontos do mês dos dois ──────────────────────
      let rival: Mes["rival"] = null;
      if (rivalRes.data?.rival_id) {
        const [{ data: perfil }, meus, dele] = await Promise.all([
          db.from("profiles").select("display_name,avatar_url")
            .eq("id", rivalRes.data.rival_id).maybeSingle(),
          pontosNoPeriodo(userId!, ciclo.starts_on, ciclo.ends_on),
          pontosNoPeriodo(rivalRes.data.rival_id, ciclo.starts_on, ciclo.ends_on),
        ]);
        rival = {
          nome: perfil?.display_name ?? "Adepto",
          avatar: perfil?.avatar_url ?? null,
          meus, dele,
          motivo: rivalRes.data.motivo,
        };
      }

      // ── Missão: progresso calculado no momento ─────────────
      let missao: Mes["missao"] = null;
      if (missaoRes.data) {
        const { data: prog } = await db.rpc("progresso_missao", {
          p_user_id: userId, p_codigo: missaoRes.data.codigo, p_cycle_id: ciclo.id,
        });
        missao = {
          codigo: missaoRes.data.codigo,
          titulo: MISSOES[missaoRes.data.codigo]?.titulo ?? "Desafio do mês",
          alvo: missaoRes.data.alvo,
          progresso: Math.min(Number(prog ?? 0), missaoRes.data.alvo),
          porque: missaoRes.data.porque,
        };
      }

      if (!rival && !missao) return { cycleId: ciclo.id, label: ciclo.label, rival: null, missao: null };
      return { cycleId: ciclo.id, label: ciclo.label, rival, missao };
    },
  });
}

async function pontosNoPeriodo(userId: string, de: string, ate: string): Promise<number> {
  const { data } = await (supabase as any)
    .from("v_acertos").select("points")
    .eq("user_id", userId)
    .gte("kickoff_at", de)
    .lte("kickoff_at", `${ate}T23:59:59`);
  return ((data ?? []) as any[]).reduce((s, l) => s + (l.points ?? 0), 0);
}

export interface ResumoMensal {
  cycleId: string;
  label: string;
  pontos: number;
  previsoes: number;
  acerto: number | null;
  posicao: number | null;
  resumo: any;
}

/** Resumos já fechados, do mais recente para trás. */
export function useResumos(userId: string | undefined) {
  return useQuery({
    queryKey: ["resumos-mensais", userId],
    enabled: !!userId,
    staleTime: 300_000,
    queryFn: async (): Promise<ResumoMensal[]> => {
      const { data } = await (supabase as any)
        .from("user_month_snapshot")
        .select("cycle_id,pontos_total,previsoes,acerto,posicao_final,resumo,monthly_cycles(label,ends_on)")
        .eq("user_id", userId)
        .order("criado_em", { ascending: false });

      return ((data ?? []) as any[]).map(l => ({
        cycleId: l.cycle_id,
        label: l.monthly_cycles?.label ?? "Mês",
        pontos: l.pontos_total ?? 0,
        previsoes: l.previsoes ?? 0,
        acerto: l.acerto ?? null,
        posicao: l.posicao_final ?? null,
        resumo: l.resumo ?? {},
      }));
    },
  });
}
