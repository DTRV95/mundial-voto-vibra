import { supabase } from "@/integrations/supabase/client";
import type { ImportPayload } from "@/lib/importar.functions";

/**
 * Grava na base de dados o que veio da API.
 *
 * Princípio: IDEMPOTENTE — correr duas vezes atualiza, nunca duplica.
 * Tudo é encontrado pelo `external_id` (o id do jogo/equipa na API).
 */

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
               "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export interface ResultadoImportacao {
  equipasNovas: number;
  equipasAtualizadas: number;
  jogosNovos: number;
  jogosAtualizados: number;
  jornadasCriadas: number;
  mesesCriados: number;
  /** Quantas equipas vieram com emblema oficial da API */
  emblemas: number;
  avisos: string[];
}

export async function aplicarImportacao(
  competitionId: string,
  epocaLabel: string,
  dados: ImportPayload,
  aoProgredir?: (msg: string) => void,
): Promise<ResultadoImportacao> {
  const r: ResultadoImportacao = {
    equipasNovas: 0, equipasAtualizadas: 0,
    jogosNovos: 0, jogosAtualizados: 0,
    jornadasCriadas: 0, mesesCriados: 0, emblemas: 0, avisos: [],
  };
  const db = supabase as any;

  // ── 1. Época ─────────────────────────────────────────────
  aoProgredir?.("Época…");
  let { data: epoca } = await db.from("seasons")
    .select("id").eq("competition_id", competitionId).eq("label", epocaLabel).maybeSingle();

  if (!epoca) {
    const { data, error } = await db.from("seasons").insert({
      competition_id: competitionId,
      label: epocaLabel,
      starts_on: dados.competicao.inicio || null,
      ends_on: dados.competicao.fim || null,
      is_current: true,
    }).select("id").single();
    if (error) throw new Error(`Época: ${error.message}`);
    epoca = data;
  }
  const seasonId = epoca.id;

  // ── 2. Equipas ───────────────────────────────────────────
  aoProgredir?.("Equipas…");
  r.emblemas = dados.equipas.filter(e => !!e.emblema).length;
  const extIds = dados.equipas.map(e => e.externalId);
  const { data: existentes } = await db.from("teams")
    .select("id,external_id").in("external_id", extIds);
  const mapaEquipas = new Map<string, string>(   // externalId → id interno
    (existentes ?? []).map((t: any) => [t.external_id, t.id])
  );

  for (const e of dados.equipas) {
    const idInterno = mapaEquipas.get(e.externalId);
    if (idInterno) {
      // Verificar o erro: sem isto, uma coluna em falta ou uma política
      // RLS a bloquear passavam despercebidas e contavam como sucesso.
      const { error } = await db.from("teams").update({
        name: e.nome, short_name: e.nomeCurto, monogram: e.monograma,
        crest_url: e.emblema, kind: "club", country: e.pais ?? null,
      }).eq("id", idInterno);
      if (error) { r.avisos.push(`Equipa ${e.nome}: ${error.message}`); continue; }
      r.equipasAtualizadas++;
    } else {
      const { data, error } = await db.from("teams").insert({
        name: e.nome, short_name: e.nomeCurto, monogram: e.monograma,
        code: e.monograma, crest_url: e.emblema, kind: "club", country: e.pais ?? null,
        external_id: e.externalId,
      }).select("id").single();
      if (error) { r.avisos.push(`Equipa ${e.nome}: ${error.message}`); continue; }
      mapaEquipas.set(e.externalId, data.id);
      r.equipasNovas++;
    }
  }

  // ── 3. Meses competitivos ────────────────────────────────
  aoProgredir?.("Meses…");
  const mesesNecessarios = new Map<string, { ano: number; mes: number }>();
  for (const j of dados.jogos) {
    const d = new Date(j.dataHora);
    const chave = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
    if (!mesesNecessarios.has(chave))
      mesesNecessarios.set(chave, { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 });
  }

  const { data: mesesExistentes } = await db.from("competition_months")
    .select("id,year,month").eq("season_id", seasonId);
  const mapaMeses = new Map<string, string>(
    (mesesExistentes ?? []).map((m: any) => [`${m.year}-${m.month}`, m.id])
  );

  for (const [chave, { ano, mes }] of mesesNecessarios) {
    if (mapaMeses.has(chave)) continue;
    const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
    const { data, error } = await db.from("competition_months").insert({
      season_id: seasonId, competition_id: competitionId,
      year: ano, month: mes,
      label: `${MESES[mes - 1]} ${ano}`,
      starts_on: `${ano}-${String(mes).padStart(2, "0")}-01`,
      ends_on: `${ano}-${String(mes).padStart(2, "0")}-${ultimoDia}`,
      status: "upcoming",
    }).select("id").single();
    if (error) { r.avisos.push(`Mês ${chave}: ${error.message}`); continue; }
    mapaMeses.set(chave, data.id);
    r.mesesCriados++;
  }

  // ── 4. Jornadas ──────────────────────────────────────────
  aoProgredir?.("Jornadas…");
  // Jornada → primeira data (para saber a que mês pertence)
  const jornadas = new Map<number, string>();
  for (const j of dados.jogos) {
    if (j.jornada == null) continue;
    const atual = jornadas.get(j.jornada);
    if (!atual || j.dataHora < atual) jornadas.set(j.jornada, j.dataHora);
  }

  // Filtrar TAMBÉM por competição. Sem isto, a Jornada 1 da Champions
  // era "encontrada" como sendo a Jornada 1 da Liga, e os jogos das
  // duas competições caíam na mesma jornada.
  const { data: jornadasExistentes } = await db.from("rounds")
    .select("id,number")
    .eq("season_id", seasonId)
    .eq("competition_id", competitionId)
    .eq("kind", "jornada");
  const mapaJornadas = new Map<number, string>(
    (jornadasExistentes ?? []).map((x: any) => [x.number, x.id])
  );

  for (const [numero, primeiraData] of [...jornadas].sort((a, b) => a[0] - b[0])) {
    if (mapaJornadas.has(numero)) continue;
    const d = new Date(primeiraData);
    const mesId = mapaMeses.get(`${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`) ?? null;
    const { data, error } = await db.from("rounds").insert({
      competition_id: competitionId, season_id: seasonId, month_id: mesId,
      kind: "jornada", number: numero, label: `Jornada ${numero}`,
      status: "rascunho",
    }).select("id").single();
    if (error) { r.avisos.push(`Jornada ${numero}: ${error.message}`); continue; }
    mapaJornadas.set(numero, data.id);
    r.jornadasCriadas++;
  }

  // ── 5. Jogos ─────────────────────────────────────────────
  aoProgredir?.("Jogos…");
  const jogoExtIds = dados.jogos.map(j => j.externalId);
  const jogosExistentes: any[] = [];
  // Em blocos, para não estourar o tamanho do pedido
  for (let i = 0; i < jogoExtIds.length; i += 200) {
    const { data } = await db.from("matches")
      .select("id,external_id").in("external_id", jogoExtIds.slice(i, i + 200));
    jogosExistentes.push(...(data ?? []));
  }
  const mapaJogos = new Map<string, string>(
    jogosExistentes.map((m: any) => [m.external_id, m.id])
  );

  const terminado = (estado: string) => estado === "FINISHED";

  for (const j of dados.jogos) {
    const casaId = mapaEquipas.get(j.casaExternalId);
    const foraId = mapaEquipas.get(j.foraExternalId);
    if (!casaId || !foraId) { r.avisos.push(`Jogo ${j.externalId}: equipa em falta`); continue; }

    const comum: any = {
      home_team_id: casaId,
      away_team_id: foraId,
      kickoff_at: j.dataHora,
      competition_id: competitionId,
      round_id: j.jornada != null ? (mapaJornadas.get(j.jornada) ?? null) : null,
      status: terminado(j.estado) ? "finished" : "scheduled",
      home_score: j.golosCasa,
      away_score: j.golosFora,
    };

    const idExistente = mapaJogos.get(j.externalId);
    if (idExistente) {
      // Não mexe em is_official nem official_position — são escolhas tuas
      const { error } = await db.from("matches").update(comum).eq("id", idExistente);
      if (error) { r.avisos.push(`Jogo ${j.externalId}: ${error.message}`); continue; }
      r.jogosAtualizados++;
    } else {
      const { error } = await db.from("matches").insert({
        ...comum,
        external_id: j.externalId,
        voting_open: false,      // só abre quando a jornada for publicada
        is_official: false,
      });
      if (error) { r.avisos.push(`Jogo ${j.externalId}: ${error.message}`); continue; }
      r.jogosNovos++;
    }
  }

  return r;
}
