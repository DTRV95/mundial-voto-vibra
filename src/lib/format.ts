export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.toDateString() === n.toDateString();
}

export const PHASE_LABEL: Record<string, string> = {
  grupos:   "Fase de Grupos",
  ronda32:  "Ronda de 32",
  oitavos:  "Oitavos de Final",
  quartos:  "Quartos de Final",
  meias:    "Meias-Finais",
  final:    "Final",
};

export function votingStatus(match: { kickoff_at: string; voting_open: boolean }) {
  if (!match.voting_open) return { label: "Fechada", tone: "destructive" as const };
  const diffMin = (new Date(match.kickoff_at).getTime() - Date.now()) / 60000;
  if (diffMin <= 5) return { label: "Fechada", tone: "destructive" as const };
  if (diffMin <= 60) return { label: "Fecha em breve", tone: "gold" as const };
  return { label: "Aberta", tone: "primary" as const };
}
