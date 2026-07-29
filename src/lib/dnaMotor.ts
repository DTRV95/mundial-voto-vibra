import { PERFIS, type PerfilId } from "@/lib/dnaPerfis";

/**
 * O motor que atribui o perfil.
 *
 * Cada perfil produz uma VANTAGEM RELATIVA, medida em pontos
 * percentuais acima da média do próprio utilizador. Ganha a maior.
 *
 * É esta escolha que impede rótulos insultuosos: mesmo quem acerta
 * pouco tem um mercado onde é menos fraco, e é esse que sobe. O
 * perfil diz onde és melhor *para ti*, não onde és melhor que os outros.
 */

export interface MetricasDna {
  previsoesAvaliadas: number;
  mercadosTentados: number;
  mercadosCertos: number;

  /** Por mercado: tentativas e certos, somados em todas as competições */
  mercados: Record<"r90" | "btts" | "t25" | "exato", { tentativas: number; certos: number }>;

  /** Por competição, pelo slug */
  competicoes: Record<string, { previsoes: number; tentativas: number; certos: number }>;

  /** Jogos com etiqueta de destaque (clássico, dérbi, decisivo) */
  destaque: { previsoes: number; tentativas: number; certos: number };
  semDestaque: { previsoes: number; tentativas: number; certos: number };

  /** Contra a Bancada — só previsões não informadas */
  bancada: {
    avaliadas: number;
    contra: number; contraCertas: number;
    maioria: number; maioriaCertas: number;
  } | null;

  /** Jogos do clube favorito da altura */
  clube: {
    jogos: number; tentativas: number; certos: number;
    jogosSemVitoria: number; acertosSemVitoria: number;
  } | null;
  foraDoClube: { jogos: number; tentativas: number; certos: number } | null;

  /** Média da comunidade por mercado, em percentagem */
  mediaComunidade: Record<string, number>;
}

export interface Atribuicao {
  perfil: PerfilId;
  traco: PerfilId | null;
  /** A explicação em linguagem humana, para o "Saber porquê" */
  porque: string;
  /** Todas as vantagens, para o detalhe */
  vantagens: { perfil: PerfilId; valor: number; nota: string }[];
}

const pct = (certos: number, tentativas: number) =>
  tentativas > 0 ? (certos / tentativas) * 100 : 0;

/** Arredonda para apresentar sem dar ares de precisão que não existe. */
const r = (n: number) => Math.round(n);

/**
 * Calcula a vantagem de cada perfil. Devolve null quando não há
 * amostra suficiente para dizer seja o que for.
 */
export function atribuirPerfil(m: MetricasDna): Atribuicao | null {
  if (m.previsoesAvaliadas < 10) return null;

  const global = pct(m.mercadosCertos, m.mercadosTentados);
  const vantagens: { perfil: PerfilId; valor: number; nota: string }[] = [];

  const junta = (perfil: PerfilId, valor: number, nota: string) => {
    if (Number.isFinite(valor) && valor > 0) vantagens.push({ perfil, valor, nota });
  };

  // ── Competições ───────────────────────────────────────────
  const cl = m.competicoes["champions"];
  const lp = m.competicoes["liga-portugal"];
  if (cl && lp && cl.previsoes >= 10 && lp.previsoes >= 10) {
    const taxaCl = pct(cl.certos, cl.tentativas);
    const taxaLp = pct(lp.certos, lp.tentativas);
    junta("especialista-europeu", taxaCl - taxaLp,
      `Acertas ${r(taxaCl)}% na Champions contra ${r(taxaLp)}% na Liga.`);
    junta("rei-da-liga", taxaLp - taxaCl,
      `Acertas ${r(taxaLp)}% na Liga contra ${r(taxaCl)}% na Champions.`);
  }

  // ── Mercados de golos ─────────────────────────────────────
  const btts = m.mercados.btts;
  const t25 = m.mercados.t25;
  if (btts.tentativas + t25.tentativas >= 15) {
    const golos = pct(btts.certos + t25.certos, btts.tentativas + t25.tentativas);
    junta("cacador-golos", golos - global,
      `Acertas ${r(golos)}% nos mercados de golos, contra ${r(global)}% no geral.`);
  }

  // ── Resultado exato ───────────────────────────────────────
  const exato = m.mercados.exato;
  const mediaExato = m.mediaComunidade["exato"] ?? 0;
  if (exato.certos >= 2 && mediaExato > 0) {
    const meu = pct(exato.certos, exato.tentativas);
    junta("mestre-resultado", (meu / mediaExato - 1) * 20,
      `Acertaste ${exato.certos} ${exato.certos === 1 ? "placar exato" : "placares exatos"} — a média da comunidade é ${mediaExato}%.`);
  }

  // ── Grandes jogos ─────────────────────────────────────────
  if (m.destaque.previsoes >= 5) {
    const taxa = pct(m.destaque.certos, m.destaque.tentativas);
    junta("analista-classicos", taxa - global,
      `Nos clássicos e dérbis acertas ${r(taxa)}%, contra ${r(global)}% nos outros jogos.`);
  }

  // ── Contra a bancada ──────────────────────────────────────
  if (m.bancada && m.bancada.avaliadas >= 10) {
    const b = m.bancada;
    const percContra = (b.contra / b.avaliadas) * 100;
    const acertoContra = pct(b.contraCertas, b.contra);
    const acertoMaioria = pct(b.maioriaCertas, b.maioria);

    if (b.contra >= 8) {
      junta("cacador-surpresas", acertoContra - global,
        `Quando escolhes o improvável, acertas ${r(acertoContra)}%.`);
    }
    if (b.contra >= 10 && acertoContra >= global) {
      junta("pensador-independente", (percContra - 30) / 2,
        `Discordas da maioria em ${r(percContra)}% das previsões — e acertas nessas.`);
    }
    if (percContra <= 25 && global >= 55) {
      junta("favorito-seguro", (75 - percContra) / 2,
        `Segues o favorito em ${r(100 - percContra)}% das vezes, e acertas ${r(acertoMaioria)}%.`);
    }
  }

  // ── Sem clubismos ─────────────────────────────────────────
  if (m.clube && m.clube.jogos >= 5 && m.clube.jogosSemVitoria >= 3) {
    const semCoracao = pct(m.clube.acertosSemVitoria, m.clube.jogosSemVitoria);
    junta("sem-clubismos", semCoracao - global,
      `Quando o teu clube não ganha, acertas ${r(semCoracao)}% — o coração não te atrapalha.`);
  }

  // ── Estratega: consistência entre mercados ────────────────
  const taxas = (["r90", "btts", "t25"] as const)
    .map(k => m.mercados[k])
    .filter(x => x.tentativas >= 5)
    .map(x => pct(x.certos, x.tentativas));
  if (taxas.length >= 2) {
    const media = taxas.reduce((a, b) => a + b, 0) / taxas.length;
    const desvio = Math.sqrt(taxas.reduce((s, t) => s + (t - media) ** 2, 0) / taxas.length);
    junta("estratega", 10 - desvio,
      `Acertas de forma parecida em todos os mercados — ${r(desvio)} pontos de diferença entre o melhor e o pior.`);
  }

  if (vantagens.length === 0) return null;

  vantagens.sort((a, b) => b.valor - a.valor);
  const principal = vantagens[0];
  const segundo = vantagens[1];

  // O traço secundário só aparece se for mesmo relevante
  const traco = segundo && segundo.valor >= principal.valor * 0.6
    ? segundo.perfil : null;

  return {
    perfil: principal.perfil,
    traco,
    porque: principal.nota,
    vantagens,
  };
}

/**
 * Equipa-talismã e equipa-fantasma.
 *
 * Regressão à própria média: com poucos jogos, a equipa puxa para
 * a tua média normal; quanto mais jogos, mais ela própria pesa.
 * É o que impede um resultado exato isolado de eleger um talismã.
 */
export interface EquipaMetrica {
  team_id: string;
  jogos: number;
  pontos: number;
  mercadosCertos: number;
  mercadosTentados: number;
}

export interface Relacao {
  team_id: string;
  jogos: number;
  /** Pontuação já regressada */
  valor: number;
  /** % de mercados certos, para explicar */
  acerto: number;
}

const K_CONFIANCA = 3;
export const MINIMO_JOGOS_EQUIPA = 5;

export function talismaFantasma(equipas: EquipaMetrica[], mediaGeral: number): {
  talisma: Relacao | null;
  fantasma: Relacao | null;
} {
  const elegiveis = equipas.filter(e => e.jogos >= MINIMO_JOGOS_EQUIPA);
  if (elegiveis.length < 2) return { talisma: null, fantasma: null };

  const pontuadas: Relacao[] = elegiveis.map(e => ({
    team_id: e.team_id,
    jogos: e.jogos,
    valor: (e.pontos + K_CONFIANCA * mediaGeral) / (e.jogos + K_CONFIANCA),
    acerto: e.mercadosTentados > 0
      ? Math.round((e.mercadosCertos / e.mercadosTentados) * 100) : 0,
  })).sort((a, b) => b.valor - a.valor);

  return {
    talisma: pontuadas[0] ?? null,
    fantasma: pontuadas.at(-1) ?? null,
  };
}

/** Frase para o talismã e para o fantasma. */
export function frasesRelacao(nome: string, rel: Relacao, tipo: "talisma" | "fantasma"): string {
  return tipo === "talisma"
    ? `Acertaste em ${rel.acerto}% das previsões dos jogos do ${nome}.`
    : `É a equipa que mais desafia as tuas previsões. Acertaste apenas em ${rel.acerto}% dos jogos dela.`;
}

/** Nome legível do perfil, para reutilizar fora dos componentes. */
export const nomePerfil = (id: PerfilId) => PERFIS[id].nome;
