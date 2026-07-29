/**
 * Catálogo dos perfis de DNA.
 *
 * O perfil não vem de um questionário: é a maior vantagem relativa
 * do utilizador face à SUA PRÓPRIA média. É isso que garante que
 * ninguém recebe um rótulo insultuoso — mesmo quem acerta pouco tem
 * um mercado onde é menos fraco, e é esse que ganha.
 */

export type PerfilId =
  | "estratega"
  | "cacador-golos"
  | "mestre-resultado"
  | "especialista-europeu"
  | "rei-da-liga"
  | "cacador-surpresas"
  | "favorito-seguro"
  | "analista-classicos"
  | "sem-clubismos"
  | "pensador-independente";

export interface Perfil {
  id: PerfilId;
  nome: string;
  /** Uma frase, na segunda pessoa. Nunca duas. */
  descricao: string;
  /** Frase usada como traço secundário */
  traco: string;
  /** Precisa de dados da comunidade — só entra na Fase B */
  precisaComunidade: boolean;
}

export const PERFIS: Record<PerfilId, Perfil> = {
  "estratega": {
    id: "estratega",
    nome: "Estratega",
    descricao: "Acertas de forma constante, sem depender de um mercado só.",
    traco: "com cabeça de Estratega",
    precisaComunidade: false,
  },
  "cacador-golos": {
    id: "cacador-golos",
    nome: "Caçador de Golos",
    descricao: "Os jogos em que ambas marcam são o teu ponto forte.",
    traco: "com faro para os golos",
    precisaComunidade: false,
  },
  "mestre-resultado": {
    id: "mestre-resultado",
    nome: "Mestre do Resultado",
    descricao: "Acertas placares exatos com uma frequência acima do normal.",
    traco: "com pontaria para o placar exato",
    precisaComunidade: true,
  },
  "especialista-europeu": {
    id: "especialista-europeu",
    nome: "Especialista Europeu",
    descricao: "Lês melhor os jogos da Champions do que os da Liga.",
    traco: "com olho para a Europa",
    precisaComunidade: false,
  },
  "rei-da-liga": {
    id: "rei-da-liga",
    nome: "Rei da Liga",
    descricao: "É na Liga Portugal que mostras o teu melhor.",
    traco: "com raízes na Liga",
    precisaComunidade: false,
  },
  "cacador-surpresas": {
    id: "cacador-surpresas",
    nome: "Caçador de Surpresas",
    descricao: "Vês empates e desfechos improváveis que escapam à maioria.",
    traco: "com queda para a surpresa",
    precisaComunidade: true,
  },
  "favorito-seguro": {
    id: "favorito-seguro",
    nome: "Favorito Seguro",
    descricao: "Escolhes o favorito e raramente te enganas.",
    traco: "com mão firme nos favoritos",
    precisaComunidade: true,
  },
  "analista-classicos": {
    id: "analista-classicos",
    nome: "Analista de Clássicos",
    descricao: "É nos grandes jogos que acertas mais.",
    traco: "com apetite pelos grandes jogos",
    precisaComunidade: false,
  },
  "sem-clubismos": {
    id: "sem-clubismos",
    nome: "Sem Clubismos",
    descricao: "Consegues prever contra o teu clube quando é preciso.",
    traco: "sem deixar o coração decidir",
    precisaComunidade: false,
  },
  "pensador-independente": {
    id: "pensador-independente",
    nome: "Pensador Independente",
    descricao: "Discordas da maioria com frequência — e acertas.",
    traco: "com pensamento próprio",
    precisaComunidade: true,
  },
};

/** Marcos de amostra. */
export const MINIMO_PRIMEIRO_PERFIL = 10;
export const MINIMO_PERFIL_CONFIRMADO = 30;

export type EstadoDna = "a-conhecer" | "em-evolucao" | "confirmado";

export function estadoDna(previsoesAvaliadas: number): EstadoDna {
  if (previsoesAvaliadas < MINIMO_PRIMEIRO_PERFIL) return "a-conhecer";
  if (previsoesAvaliadas < MINIMO_PERFIL_CONFIRMADO) return "em-evolucao";
  return "confirmado";
}

export const ROTULO_ESTADO: Record<EstadoDna, string> = {
  "a-conhecer": "Ainda estamos a conhecer-te",
  "em-evolucao": "Perfil em evolução",
  "confirmado": "Perfil confirmado",
};
