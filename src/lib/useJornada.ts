import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MatchCardData } from "@/components/MatchCard";

/**
 * A jornada em curso — fonte única.
 *
 * A homepage e a página de Jogos mostravam coisas diferentes porque cada
 * uma fazia a sua consulta. Agora partilham esta: só jogos oficiais de
 * jornadas publicadas, da competição escolhida.
 */

export interface JogoOficial extends MatchCardData {
  round_id: string;
  round_number: number | null;
  official_position: number | null;
  highlight_tag: string | null;
}

export interface Jornada {
  id: string;
  label: string;
  numero: number | null;
  jogos: JogoOficial[];
  /** Quantos dos 5 já tens previstos */
  votados: number;
  /** Fecha quando o primeiro jogo começar */
  fecha_em: string | null;
}

export function useJornadas(competitionId: string | null | undefined, userId?: string) {
  return useQuery({
    queryKey: ["jornadas-oficiais", competitionId, userId],
    enabled: !!competitionId,
    staleTime: 60_000,
    queryFn: async (): Promise<Jornada[]> => {
      const { data } = await (supabase as any)
        .from("matches")
        .select(
          "id,kickoff_at,phase,status,voting_open,official_position,highlight_tag," +
          "home:home_team_id(name,flag,code),away:away_team_id(name,flag,code)," +
          "round:round_id!inner(id,number,label,status),predictions(count)"
        )
        .eq("competition_id", competitionId)
        .eq("is_official", true)
        .eq("round.status", "publicada")
        .order("kickoff_at");

      const linhas = ((data ?? []) as any[]).filter(m => m.home && m.away && m.round);
      if (linhas.length === 0) return [];

      // Em que jogos é que este utilizador já votou
      let votados = new Set<string>();
      if (userId) {
        const { data: preds } = await supabase
          .from("predictions")
          .select("match_id")
          .eq("user_id", userId)
          .in("match_id", linhas.map(m => m.id));
        votados = new Set((preds ?? []).map((p: any) => p.match_id));
      }

      const mapa = new Map<string, Jornada>();
      for (const m of linhas) {
        const jogo: JogoOficial = {
          id: m.id,
          kickoff_at: m.kickoff_at,
          phase: m.phase ?? "",
          status: m.status,
          voting_open: m.voting_open,
          home: m.home,
          away: m.away,
          votes_count: m.predictions?.[0]?.count ?? 0,
          already_voted: votados.has(m.id),
          is_official: true,
          round_label: m.round.label ?? (m.round.number ? `Jornada ${m.round.number}` : null),
          round_id: m.round.id,
          round_number: m.round.number ?? null,
          official_position: m.official_position ?? null,
          highlight_tag: m.highlight_tag ?? null,
        };

        const atual = mapa.get(m.round.id);
        if (atual) atual.jogos.push(jogo);
        else mapa.set(m.round.id, {
          id: m.round.id,
          label: jogo.round_label ?? "Jornada",
          numero: m.round.number ?? null,
          jogos: [jogo],
          votados: 0,
          fecha_em: null,
        });
      }

      return [...mapa.values()].map(r => {
        const jogos = r.jogos.sort(
          (a, b) => (a.official_position ?? 99) - (b.official_position ?? 99),
        );
        return {
          ...r,
          jogos,
          votados: jogos.filter(j => j.already_voted).length,
          fecha_em: jogos.reduce<string | null>(
            (min, j) => (!min || j.kickoff_at < min ? j.kickoff_at : min), null),
        };
      });
    },
  });
}

/** A jornada mais próxima de acontecer — a que interessa mostrar na homepage. */
export function jornadaEmFoco(jornadas: Jornada[]): Jornada | null {
  if (jornadas.length === 0) return null;
  const agora = new Date().toISOString();
  // A primeira que ainda tenha jogos por começar; senão, a mais recente
  return jornadas.find(r => r.jogos.some(j => j.kickoff_at > agora)) ?? jornadas.at(-1) ?? null;
}
