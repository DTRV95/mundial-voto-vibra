import { useEffect, useState } from "react";

/**
 * Quanto falta para o apito inicial.
 *
 * Um jogo daqui a três dias e um jogo que fecha daqui a dez minutos não
 * podem ser a mesma coisa no ecrã. Isto devolve o texto certo e o grau
 * de urgência, para a página decidir a cor.
 *
 * A votação fecha cinco minutos antes do apito — a mesma regra de
 * `votingStatus`, em `format.ts`.
 */

export type Urgencia = "longe" | "hoje" | "proximo" | "iminente" | "fechado";

export interface Contagem {
  texto: string;
  urgencia: Urgencia;
  /** Fração já decorrida da última hora, de 0 a 1. Só faz sentido perto do fim. */
  progresso: number;
}

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const FECHO = 5 * MINUTO;

function calcular(kickoff: string, agora: number): Contagem {
  const inicio = new Date(kickoff).getTime();
  const falta = inicio - FECHO - agora;

  if (Number.isNaN(inicio)) return { texto: "", urgencia: "longe", progresso: 0 };
  if (falta <= 0) return { texto: "Votação fechada", urgencia: "fechado", progresso: 1 };

  const progresso = Math.min(1, Math.max(0, 1 - falta / HORA));

  if (falta < HORA) {
    const min = Math.floor(falta / MINUTO);
    const seg = Math.floor((falta % MINUTO) / 1000);
    return {
      texto: `Fecha em ${min}:${String(seg).padStart(2, "0")}`,
      urgencia: "iminente",
      progresso,
    };
  }

  const horas = Math.floor(falta / HORA);
  if (horas < 6) {
    const min = Math.floor((falta % HORA) / MINUTO);
    return { texto: `Fecha em ${horas}h ${min}m`, urgencia: "proximo", progresso };
  }

  const mesmoDia = new Date(inicio).toDateString() === new Date(agora).toDateString();
  if (mesmoDia) return { texto: `Hoje às ${hora(inicio)}`, urgencia: "hoje", progresso: 0 };

  const dias = Math.ceil(falta / (24 * HORA));
  if (dias === 1) return { texto: `Amanhã às ${hora(inicio)}`, urgencia: "hoje", progresso: 0 };

  return { texto: `${diaCurto(inicio)} às ${hora(inicio)}`, urgencia: "longe", progresso: 0 };
}

function hora(ms: number) {
  return new Date(ms).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function diaCurto(ms: number) {
  return new Date(ms).toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });
}

export function useContagem(kickoff: string): Contagem {
  // No servidor não há relógio que valha a pena — a primeira renderização
  // usa a data do jogo e o cliente corrige logo a seguir.
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    setAgora(Date.now());
    const falta = new Date(kickoff).getTime() - FECHO - Date.now();
    // Só vale a pena contar segundos na última hora.
    const intervalo = falta < HORA ? 1000 : MINUTO;
    const t = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(t);
  }, [kickoff]);

  if (agora === null) {
    return { texto: `${diaCurto(new Date(kickoff).getTime())} às ${hora(new Date(kickoff).getTime())}`, urgencia: "longe", progresso: 0 };
  }
  return calcular(kickoff, agora);
}
