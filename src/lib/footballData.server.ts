/**
 * Cliente do football-data.org — SÓ SERVIDOR.
 *
 * O sufixo .server.ts impede o Vite de enviar este ficheiro para o browser:
 * a chave da API nunca chega ao cliente.
 *
 * Na Cloudflare, as variáveis ligam-se por pedido — daí a leitura de
 * process.env acontecer dentro da função, nunca no topo do módulo.
 */
import process from "node:process";

const BASE = "https://api.football-data.org/v4";

export class FootballDataError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) {
    throw new FootballDataError(
      "Falta a chave da API. Configura o secret FOOTBALL_DATA_KEY na Cloudflare.",
      0
    );
  }

  const res = await fetch(`${BASE}${path}`, { headers: { "X-Auth-Token": key } });
  const text = await res.text();

  if (!res.ok) {
    let msg = text.slice(0, 200);
    try { msg = JSON.parse(text).message ?? msg; } catch { /* resposta não-JSON */ }
    throw new FootballDataError(msg, res.status);
  }

  return JSON.parse(text) as T;
}

// ── Formatos da API que nos interessam ──────────────────────

export interface ApiTeam {
  id: number;
  name: string;         // "Sport Lisboa e Benfica"
  shortName?: string;   // "Benfica"
  tla?: string;         // "SLB"
  crest?: string;
}

export interface ApiMatch {
  id: number;
  utcDate: string;
  status: string;       // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | POSTPONED | CANCELLED
  matchday: number | null;
  stage?: string;       // REGULAR_SEASON | LEAGUE_STAGE | LAST_16 | ...
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  score?: { fullTime?: { home: number | null; away: number | null } };
}

/** Equipas de uma competição numa época. */
export function getTeams(competition: string, season: number) {
  return apiGet<{ count: number; teams: ApiTeam[] }>(
    `/competitions/${competition}/teams?season=${season}`
  );
}

/** Todos os jogos de uma competição numa época. */
export function getMatches(competition: string, season: number) {
  return apiGet<{ resultSet: { count: number }; matches: ApiMatch[] }>(
    `/competitions/${competition}/matches?season=${season}`
  );
}

/** Informação da competição, incluindo a época corrente. */
export function getCompetition(competition: string) {
  return apiGet<{
    code: string;
    name: string;
    currentSeason: { startDate: string; endDate: string; currentMatchday: number | null };
  }>(`/competitions/${competition}`);
}
