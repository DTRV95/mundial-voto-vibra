import { createServerFn } from "@tanstack/react-start";
import { getTeams, getMatches, getCompetition, FootballDataError } from "@/lib/footballData.server";

/**
 * Funções servidor da importação.
 *
 * O servidor faz APENAS as chamadas à API (para a chave não sair daqui).
 * A escrita na base de dados acontece no cliente, com a sessão do admin,
 * respeitando as políticas RLS que já existem.
 */

export interface ImportPayload {
  competicao: { codigo: string; nome: string; inicio: string; fim: string; jornadaAtual: number | null };
  equipas: { externalId: string; nome: string; nomeCurto: string; monograma: string }[];
  jogos: {
    externalId: string;
    casaExternalId: string;
    foraExternalId: string;
    dataHora: string;
    estado: string;
    jornada: number | null;
    fase: string | null;
    golosCasa: number | null;
    golosFora: number | null;
  }[];
}

/** Deriva um monograma de 3 letras a partir do nome do clube. */
function monogramaDe(t: { tla?: string; shortName?: string; name: string }): string {
  if (t.tla && t.tla.length >= 2) return t.tla.toUpperCase().slice(0, 3);
  const base = (t.shortName ?? t.name)
    .replace(/\b(FC|SC|SL|CD|CF|AC|AS|SS|VfL|RC|UD|GD|CS)\b/gi, "")
    .trim();
  const palavras = base.split(/\s+/).filter(Boolean);
  if (palavras.length >= 3) return palavras.slice(0, 3).map(p => p[0]).join("").toUpperCase();
  return base.slice(0, 3).toUpperCase();
}

/** Vai buscar tudo o que é preciso para importar uma competição/época. */
export const buscarImportacao = createServerFn({ method: "POST" })
  .inputValidator((d: { codigo: string; epoca: number }) => d)
  .handler(async ({ data }): Promise<{ ok: true; dados: ImportPayload } | { ok: false; erro: string; status?: number }> => {
    try {
      const [comp, teams, matches] = await Promise.all([
        getCompetition(data.codigo),
        getTeams(data.codigo, data.epoca),
        getMatches(data.codigo, data.epoca),
      ]);

      return {
        ok: true,
        dados: {
          competicao: {
            codigo: comp.code,
            nome: comp.name,
            inicio: comp.currentSeason?.startDate ?? "",
            fim: comp.currentSeason?.endDate ?? "",
            jornadaAtual: comp.currentSeason?.currentMatchday ?? null,
          },
          equipas: teams.teams.map(t => ({
            externalId: String(t.id),
            nome: t.name,
            nomeCurto: t.shortName ?? t.name,
            monograma: monogramaDe(t),
          })),
          jogos: matches.matches.map(m => ({
            externalId: String(m.id),
            casaExternalId: String(m.homeTeam.id),
            foraExternalId: String(m.awayTeam.id),
            dataHora: m.utcDate,
            estado: m.status,
            jornada: m.matchday,
            fase: m.stage ?? null,
            golosCasa: m.score?.fullTime?.home ?? null,
            golosFora: m.score?.fullTime?.away ?? null,
          })),
        },
      };
    } catch (e: any) {
      if (e instanceof FootballDataError) return { ok: false, erro: e.message, status: e.status };
      return { ok: false, erro: e?.message ?? "Erro desconhecido" };
    }
  });
