import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sugestão dos 5 jogos oficiais de uma jornada.
 *
 * Critério combinado: 2 de destaque + 2 equilibrados + 1 de rotação.
 * A sugestão é só uma proposta — quem escolhe és sempre tu.
 */

export interface JogoCandidato {
  id: string;
  kickoff_at: string;
  home_team_id: string;
  away_team_id: string;
  home: { name: string; short_name: string | null; is_grande: boolean };
  away: { name: string; short_name: string | null; is_grande: boolean };
}

export interface JogoPontuado extends JogoCandidato {
  /** 0–100, quanto o jogo interessa ao público */
  interesse: number;
  /** Porque é que foi sugerido — mostrado ao admin */
  razao: string;
  categoria: "destaque" | "equilibrio" | "rotacao" | null;
}

interface Contexto {
  posicoes: Map<string, number>;      // team_id → posição na tabela
  vezesEscolhida: Map<string, number>;
  ultimaJornada: Map<string, number>;
  totalEquipas: number;
  jornadaAtual: number;
}

/** Dados de apoio: classificação e histórico de escolhas. */
export function useContextoSugestao(competitionId: string | undefined, seasonId: string | undefined) {
  return useQuery({
    queryKey: ["contexto-sugestao", competitionId, seasonId],
    enabled: !!competitionId,
    staleTime: 120_000,
    queryFn: async () => {
      const db = supabase as any;
      const [cls, rot] = await Promise.all([
        db.from("classificacao").select("team_id,posicao").eq("competition_id", competitionId),
        db.from("rotacao_equipas").select("team_id,vezes_escolhida,ultima_jornada").eq("competition_id", competitionId),
      ]);
      return {
        posicoes: new Map<string, number>(((cls.data ?? []) as any[]).map(r => [r.team_id, r.posicao])),
        vezesEscolhida: new Map<string, number>(((rot.data ?? []) as any[]).map(r => [r.team_id, r.vezes_escolhida])),
        ultimaJornada: new Map<string, number>(((rot.data ?? []) as any[]).map(r => [r.team_id, r.ultima_jornada])),
      };
    },
  });
}

/** Quanto interessa um jogo, de 0 a 100. */
function pontuar(jogo: JogoCandidato, ctx: Contexto): { interesse: number; notas: string[] } {
  const notas: string[] = [];
  let pontos = 30;   // base

  // Grandes — o que mais move audiência
  const grandes = [jogo.home.is_grande, jogo.away.is_grande].filter(Boolean).length;
  if (grandes === 2) { pontos += 45; notas.push("clássico entre grandes"); }
  else if (grandes === 1) { pontos += 20; notas.push("tem um grande"); }

  // Equilíbrio — equipas próximas na tabela dão jogos incertos
  const pc = ctx.posicoes.get(jogo.home_team_id);
  const pf = ctx.posicoes.get(jogo.away_team_id);
  if (pc && pf) {
    const distancia = Math.abs(pc - pf);
    const proximidade = Math.max(0, 1 - distancia / Math.max(ctx.totalEquipas - 1, 1));
    pontos += Math.round(proximidade * 20);
    if (distancia <= 3) notas.push(`${pc}.º vs ${pf}.º — muito perto`);

    // Jogos no topo valem mais
    const melhor = Math.min(pc, pf);
    if (melhor <= 4) { pontos += 10; notas.push("disputa no topo"); }
    // E os do fundo também têm drama
    else if (Math.max(pc, pf) >= ctx.totalEquipas - 3) { pontos += 5; notas.push("luta pela permanência"); }
  }

  // Rotação — quem aparece pouco ganha vantagem
  const usos = (ctx.vezesEscolhida.get(jogo.home_team_id) ?? 0)
             + (ctx.vezesEscolhida.get(jogo.away_team_id) ?? 0);
  const ultima = Math.max(
    ctx.ultimaJornada.get(jogo.home_team_id) ?? 0,
    ctx.ultimaJornada.get(jogo.away_team_id) ?? 0,
  );
  const jornadasSemAparecer = ctx.jornadaAtual - ultima;
  if (usos === 0) { pontos += 12; notas.push("equipas ainda por aparecer"); }
  else if (jornadasSemAparecer >= 4) { pontos += 8; notas.push(`fora há ${jornadasSemAparecer} jornadas`); }
  else if (usos >= 6) { pontos -= 10; notas.push("já apareceram muitas vezes"); }

  return { interesse: Math.max(0, Math.min(100, pontos)), notas };
}

/** Quanto uma equipa precisa de aparecer (para a vaga de rotação). */
function necessidadeRotacao(jogo: JogoCandidato, ctx: Contexto): number {
  const usos = (ctx.vezesEscolhida.get(jogo.home_team_id) ?? 0)
             + (ctx.vezesEscolhida.get(jogo.away_team_id) ?? 0);
  const ultima = Math.max(
    ctx.ultimaJornada.get(jogo.home_team_id) ?? 0,
    ctx.ultimaJornada.get(jogo.away_team_id) ?? 0,
  );
  // Menos usos e mais tempo sem aparecer = mais necessidade
  return (ctx.jornadaAtual - ultima) * 2 - usos * 3;
}

/**
 * Escolhe 5 jogos: 2 de destaque, 2 equilibrados, 1 de rotação.
 * Evita repetir equipas sempre que houver alternativa.
 */
export function sugerirCinco(
  jogos: JogoCandidato[],
  ctx: Omit<Contexto, "totalEquipas" | "jornadaAtual"> & { totalEquipas?: number; jornadaAtual?: number },
): JogoPontuado[] {
  const contexto: Contexto = {
    ...ctx,
    totalEquipas: ctx.totalEquipas ?? 18,
    jornadaAtual: ctx.jornadaAtual ?? 1,
  };

  const pontuados: JogoPontuado[] = jogos.map(j => {
    const { interesse, notas } = pontuar(j, contexto);
    return { ...j, interesse, razao: notas.join(" · ") || "jogo normal", categoria: null };
  });

  const escolhidos: JogoPontuado[] = [];
  const equipasUsadas = new Set<string>();

  /** Tira o melhor da lista, preferindo não repetir equipas. */
  function tirar(pool: JogoPontuado[], categoria: JogoPontuado["categoria"]) {
    const livres = pool.filter(j =>
      !escolhidos.includes(j) &&
      !equipasUsadas.has(j.home_team_id) &&
      !equipasUsadas.has(j.away_team_id));
    // Se não houver nenhum sem repetir equipas, aceita repetir
    const candidato = (livres.length > 0 ? livres : pool.filter(j => !escolhidos.includes(j)))[0];
    if (!candidato) return;
    candidato.categoria = categoria;
    escolhidos.push(candidato);
    equipasUsadas.add(candidato.home_team_id);
    equipasUsadas.add(candidato.away_team_id);
  }

  // 2 de destaque — os mais interessantes
  const porInteresse = [...pontuados].sort((a, b) => b.interesse - a.interesse);
  tirar(porInteresse, "destaque");
  tirar(porInteresse, "destaque");

  // 2 equilibrados — os mais renhidos na tabela
  const porEquilibrio = [...pontuados].sort((a, b) => {
    const da = distanciaTabela(a, contexto);
    const db = distanciaTabela(b, contexto);
    return da - db || b.interesse - a.interesse;
  });
  tirar(porEquilibrio, "equilibrio");
  tirar(porEquilibrio, "equilibrio");

  // 1 de rotação — dar palco a quem aparece pouco
  const porRotacao = [...pontuados].sort(
    (a, b) => necessidadeRotacao(b, contexto) - necessidadeRotacao(a, contexto) || b.interesse - a.interesse,
  );
  tirar(porRotacao, "rotacao");

  // Se ainda faltar (jornada com poucos jogos), completa pelo interesse
  while (escolhidos.length < Math.min(5, pontuados.length)) {
    tirar(porInteresse, "destaque");
  }

  return escolhidos;
}

function distanciaTabela(j: JogoCandidato, ctx: Contexto): number {
  const pc = ctx.posicoes.get(j.home_team_id);
  const pf = ctx.posicoes.get(j.away_team_id);
  // Sem classificação ainda, trata como distância média
  if (!pc || !pf) return ctx.totalEquipas / 2;
  return Math.abs(pc - pf);
}

export const ROTULO_CATEGORIA: Record<NonNullable<JogoPontuado["categoria"]>, string> = {
  destaque: "Destaque",
  equilibrio: "Equilibrado",
  rotacao: "Rotação",
};
