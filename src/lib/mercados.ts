/**
 * O que valeu cada mercado de uma previsão, depois do apito final.
 *
 * A pontuação é a mesma de `calculate_match_points`, no SQL. Isto não
 * substitui essa função — `predictions.points` continua a ser a única
 * fonte de verdade. Isto serve só para *explicar* ao adepto de onde
 * vieram os pontos que já lá estão.
 *
 * Se algum dia mudares os valores, mudam-se nos dois sítios. O total
 * calculado aqui é comparado com o guardado, e a diferença aparece no
 * ecrã em vez de ser escondida.
 */

export interface Equipas {
  casa: string;
  fora: string;
}

export interface Previsao {
  result_90?: string | null;
  btts?: string | null;
  total_25?: string | null;
  exact_home?: number | null;
  exact_away?: number | null;
  qualifier?: string | null;
  points?: number | null;
}

export interface Resultado {
  home_score: number;
  away_score: number;
  /** Quem se apurou, quando o jogo acabou empatado. */
  qualifier?: string | null;
  phase?: string | null;
}

export interface LinhaMercado {
  chave: string;
  mercado: string;
  /** O que a pessoa disse */
  escolha: string;
  /** O que aconteceu */
  real: string;
  acertou: boolean;
  /** Pontos ganhos (0 se falhou) */
  pontos: number;
  /** Pontos que estavam em jogo */
  valor: number;
}

const FASES_MATA_MATA = new Set(["oitavos", "quartos", "meias", "final"]);

export function avaliarPrevisao(
  pred: Previsao,
  jogo: Resultado,
  equipas: Equipas,
): LinhaMercado[] {
  const casa = jogo.home_score;
  const fora = jogo.away_score;
  const golos = casa + fora;

  const real90 = casa > fora ? "home" : casa < fora ? "away" : "draw";
  const realBtts = casa > 0 && fora > 0 ? "yes" : "no";
  const realT25 = golos > 2 ? "over" : "under";
  const realApuro = casa > fora ? "home" : casa < fora ? "away" : jogo.qualifier ?? null;

  const nome90 = (v: string) => (v === "home" ? equipas.casa : v === "away" ? equipas.fora : "Empate");
  const linhas: LinhaMercado[] = [];

  if (pred.result_90) {
    const acertou = pred.result_90 === real90;
    // O empate vale mais porque é o mais difícil de acertar.
    const valor = real90 === "draw" ? 4 : 3;
    linhas.push({
      chave: "r90", mercado: "Resultado em 90 minutos",
      escolha: nome90(pred.result_90), real: nome90(real90),
      acertou, pontos: acertou ? valor : 0, valor,
    });
  }

  if (pred.btts) {
    const acertou = pred.btts === realBtts;
    linhas.push({
      chave: "btts", mercado: "Ambas as equipas marcam",
      escolha: pred.btts === "yes" ? "Sim" : "Não",
      real: realBtts === "yes" ? "Sim" : "Não",
      acertou, pontos: acertou ? 2 : 0, valor: 2,
    });
  }

  if (pred.total_25) {
    const acertou = pred.total_25 === realT25;
    linhas.push({
      chave: "t25", mercado: "Total de golos",
      escolha: pred.total_25 === "over" ? "Mais de 2.5" : "Menos de 2.5",
      real: `${golos} ${golos === 1 ? "golo" : "golos"}`,
      acertou, pontos: acertou ? 2 : 0, valor: 2,
    });
  }

  if (pred.exact_home != null && pred.exact_away != null) {
    const acertou = pred.exact_home === casa && pred.exact_away === fora;
    linhas.push({
      chave: "exato", mercado: "Resultado correto",
      escolha: `${pred.exact_home}–${pred.exact_away}`,
      real: `${casa}–${fora}`,
      acertou, pontos: acertou ? 10 : 0, valor: 10,
    });
  }

  // Só existe em mata-mata, e só quando se sabe quem passou.
  if (pred.qualifier && realApuro && FASES_MATA_MATA.has(jogo.phase ?? "")) {
    const acertou = pred.qualifier === realApuro;
    linhas.push({
      chave: "apuro", mercado: "Quem se apura",
      escolha: pred.qualifier === "home" ? equipas.casa : equipas.fora,
      real: realApuro === "home" ? equipas.casa : equipas.fora,
      acertou, pontos: acertou ? 4 : 0, valor: 4,
    });
  }

  return linhas;
}

/** Soma dos pontos das linhas — o que devia bater certo com `predictions.points`. */
export function somaLinhas(linhas: LinhaMercado[]): number {
  return linhas.reduce((s, l) => s + l.pontos, 0);
}
