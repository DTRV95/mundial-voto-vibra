-- ============================================================
-- FASE 5 — Pontos e rankings por competição
--
-- PRINCÍPIO (aprendido com o Mundial): os pontos NUNCA são
-- guardados em nenhuma tabela. `predictions.points` é a única
-- fonte de verdade; tudo o resto é somado no momento da leitura.
-- Assim é impossível haver pontos a dobrar ou a triplicar.
--
-- Só contam jogos OFICIAIS (os 5 de cada jornada) e já terminados.
-- ============================================================

-- ── 1. Pontos por competição e época ─────────────────────────
create or replace view public.pontos_por_competicao as
select
  p.user_id,
  m.competition_id,
  r.season_id,
  coalesce(sum(p.points), 0)::int                          as pontos,
  count(*)::int                                            as previsoes,
  count(*) filter (where coalesce(p.points, 0) > 0)::int    as acertos
from public.predictions p
join public.matches m on m.id = p.match_id
join public.rounds  r on r.id = m.round_id
where m.is_official = true
  and m.status = 'finished'
group by p.user_id, m.competition_id, r.season_id;

-- ── 2. Pontos por mês competitivo (base das divisões mensais) ─
create or replace view public.pontos_por_mes as
select
  p.user_id,
  m.competition_id,
  r.season_id,
  r.month_id,
  coalesce(sum(p.points), 0)::int                          as pontos,
  count(*)::int                                            as previsoes,
  count(*) filter (where coalesce(p.points, 0) > 0)::int    as acertos
from public.predictions p
join public.matches m on m.id = p.match_id
join public.rounds  r on r.id = m.round_id
where m.is_official = true
  and m.status = 'finished'
  and r.month_id is not null
group by p.user_id, m.competition_id, r.season_id, r.month_id;

-- ── 3. Pontos por jornada (progresso e duelos de jornada) ────
create or replace view public.pontos_por_jornada as
select
  p.user_id,
  m.competition_id,
  r.season_id,
  m.round_id,
  coalesce(sum(p.points), 0)::int                          as pontos,
  count(*)::int                                            as previsoes,
  count(*) filter (where coalesce(p.points, 0) > 0)::int    as acertos
from public.predictions p
join public.matches m on m.id = p.match_id
join public.rounds  r on r.id = m.round_id
where m.is_official = true
  and m.status = 'finished'
group by p.user_id, m.competition_id, r.season_id, m.round_id;

-- ── 4. Total combinado da época a decorrer ───────────────────
--    Soma de todas as competições cuja época está marcada como atual.
create or replace view public.pontos_totais as
select
  c.user_id,
  sum(c.pontos)::int      as pontos,
  sum(c.previsoes)::int   as previsoes,
  sum(c.acertos)::int     as acertos
from public.pontos_por_competicao c
join public.seasons s on s.id = c.season_id
where s.is_current = true
group by c.user_id;

-- ── 5. Leitura pública ───────────────────────────────────────
--    As vistas só expõem agregados (nunca a previsão individual
--    de ninguém), por isso podem ser lidas por todos — é o que
--    torna os rankings visíveis sem sessão iniciada.
grant select on public.pontos_por_competicao to anon, authenticated;
grant select on public.pontos_por_mes        to anon, authenticated;
grant select on public.pontos_por_jornada    to anon, authenticated;
grant select on public.pontos_totais         to anon, authenticated;

-- ── 6. Índices de apoio ──────────────────────────────────────
create index if not exists idx_predictions_match  on public.predictions (match_id);
create index if not exists idx_matches_oficiais   on public.matches (competition_id, is_official, status);
create index if not exists idx_matches_round      on public.matches (round_id);
create index if not exists idx_rounds_season      on public.rounds (season_id, month_id);

-- ── Verificação ──────────────────────────────────────────────
select
  (select count(*) from public.pontos_por_competicao) as linhas_competicao,
  (select count(*) from public.pontos_por_mes)        as linhas_mes,
  (select count(*) from public.pontos_totais)         as linhas_total;
