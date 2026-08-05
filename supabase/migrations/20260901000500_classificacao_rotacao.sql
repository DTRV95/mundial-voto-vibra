-- ============================================================
-- FASE 8 — Rotação de equipas e sugestão dos 5 jogos
--
-- Duas peças que faltavam para o site poder sugerir:
--   · a classificação da competição (para saber o que é equilibrado)
--   · quantas vezes cada equipa já foi escolhida (para rodar)
--
-- Tudo calculado na leitura, como sempre. A escolha final é
-- SEMPRE tua — isto só propõe.
-- ============================================================

-- ── 1. Classificação, a partir dos jogos terminados ──────────
--    Conta todos os jogos da competição, não só os oficiais:
--    a classificação é a real, não a do site.
create or replace view public.classificacao as
with jogos as (
  select m.competition_id, r.season_id, m.home_team_id as team_id,
         m.home_score as golos_marcados, m.away_score as golos_sofridos
  from public.matches m
  join public.rounds r on r.id = m.round_id
  where m.status = 'finished' and m.home_score is not null
  union all
  select m.competition_id, r.season_id, m.away_team_id,
         m.away_score, m.home_score
  from public.matches m
  join public.rounds r on r.id = m.round_id
  where m.status = 'finished' and m.away_score is not null
)
select
  competition_id,
  season_id,
  team_id,
  count(*)::int                                                        as jogos,
  sum(case when golos_marcados > golos_sofridos then 3
           when golos_marcados = golos_sofridos then 1
           else 0 end)::int                                            as pontos,
  sum(case when golos_marcados > golos_sofridos then 1 else 0 end)::int as vitorias,
  sum(case when golos_marcados = golos_sofridos then 1 else 0 end)::int as empates,
  sum(case when golos_marcados < golos_sofridos then 1 else 0 end)::int as derrotas,
  sum(golos_marcados)::int                                             as golos_marcados,
  sum(golos_sofridos)::int                                             as golos_sofridos,
  (sum(golos_marcados) - sum(golos_sofridos))::int                     as diferenca,
  rank() over (
    partition by competition_id, season_id
    order by sum(case when golos_marcados > golos_sofridos then 3
                      when golos_marcados = golos_sofridos then 1
                      else 0 end) desc,
             (sum(golos_marcados) - sum(golos_sofridos)) desc,
             sum(golos_marcados) desc
  )::int                                                               as posicao
from jogos
group by competition_id, season_id, team_id;

grant select on public.classificacao to anon, authenticated;

-- ── 2. Rotação — quem já foi escolhido, e há quanto tempo ────
create or replace view public.rotacao_equipas as
with escolhas as (
  select m.competition_id, r.season_id, m.home_team_id as team_id, r.number as jornada
  from public.matches m
  join public.rounds r on r.id = m.round_id
  where m.is_official = true
  union all
  select m.competition_id, r.season_id, m.away_team_id, r.number
  from public.matches m
  join public.rounds r on r.id = m.round_id
  where m.is_official = true
)
select
  competition_id,
  season_id,
  team_id,
  count(*)::int      as vezes_escolhida,
  max(jornada)::int  as ultima_jornada
from escolhas
group by competition_id, season_id, team_id;

grant select on public.rotacao_equipas to anon, authenticated;

-- ── 3. Etiqueta de destaque nos jogos ────────────────────────
--    Já existe `highlight_tag` na tabela matches (Fase 3).
--    Aqui só se garante que existe, para quem saltou essa fase.
alter table public.matches
  add column if not exists highlight_tag text;

-- ── Verificação ──────────────────────────────────────────────
select
  (select count(*) from public.classificacao)     as linhas_classificacao,
  (select count(*) from public.rotacao_equipas)   as linhas_rotacao;
-- Esperado, antes da época começar: 0 | 0
