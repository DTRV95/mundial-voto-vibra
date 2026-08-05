/**
 * As divisões — definição única.
 *
 * Estavam copiadas em sete ficheiros, cada um com os seus limites e
 * cores. Bastava mudar a 1ª Liga de "top 10" para "top 8" num sítio
 * para o ranking dizer uma coisa e o perfil outra.
 *
 * Os limites TÊM de bater certo com a vista v_divisao, no SQL da
 * Fase E. Se mudares aqui, muda lá.
 */

export interface Divisao {
  key: "primeira" | "segunda" | "distrital" | "regional";
  label: string;
  emoji: string;
  /** Posições incluídas, ambas inclusive */
  min: number;
  max: number;
  /** Classes Tailwind, para não haver duas paletas para a mesma divisão */
  color: string;
  border: string;
  bg: string;
  text: string;
  /** Gradiente do cabeçalho, na página de rankings */
  header: string;
}

export const DIVISOES: Divisao[] = [
  {
    key: "primeira", label: "1ª Liga", emoji: "🏆", min: 1, max: 10,
    color: "from-cyan-400 to-blue-500", border: "border-cyan-400/40",
    bg: "bg-cyan-400/10", text: "text-cyan-400",
    header: "linear-gradient(90deg,#0d1a2e,#0a1f3a)",
  },
  {
    key: "segunda", label: "2ª Liga", emoji: "⚽", min: 11, max: 25,
    color: "from-yellow-400 to-amber-500", border: "border-gold/40",
    bg: "bg-gold/10", text: "text-gold",
    header: "linear-gradient(90deg,#1a1500,#2a1f00)",
  },
  {
    key: "distrital", label: "Distrital", emoji: "🟡", min: 26, max: 50,
    color: "from-slate-300 to-slate-500", border: "border-slate-400/40",
    bg: "bg-slate-400/10", text: "text-slate-400",
    header: "linear-gradient(90deg,#111,#1a1a1a)",
  },
  {
    key: "regional", label: "Liga do Zé Povinho", emoji: "🟢", min: 51, max: Infinity,
    color: "from-green-700 to-emerald-800", border: "border-green-700/40",
    bg: "bg-green-700/10", text: "text-green-600",
    header: "linear-gradient(90deg,#0a1a0d,#0d1f10)",
  },
];

/** A divisão de uma posição. Sem posição, cai na última. */
export function divisaoDe(posicao: number | null | undefined): Divisao {
  if (!posicao) return DIVISOES[DIVISOES.length - 1];
  return DIVISOES.find(d => posicao >= d.min && posicao <= d.max)
    ?? DIVISOES[DIVISOES.length - 1];
}

/** "1º ao 10º" · "51º em diante" */
export function faixaDe(d: Divisao): string {
  return d.max === Infinity ? `${d.min}º em diante` : `${d.min}º ao ${d.max}º`;
}
