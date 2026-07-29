-- ============================================================
-- FASE 7 — Ligas privadas configuráveis
--
-- Cada liga decide:
--   · que competições contam
--   · que jogos oficiais contam (todos, só os dos grandes,
--     ou só os de um clube à escolha)
--   · se tem duelos 1v1 lá dentro
--
-- RESOLVE TAMBÉM um problema antigo: a pontuação das ligas
-- deixa de depender de `profiles.total_points` (que ainda tem
-- os pontos do Mundial e vai ser zerado). Passa a ser somada
-- das previsões, contando só a partir do dia em que cada
-- membro entrou na liga.
-- ============================================================

-- ── 1. Quem são os grandes ───────────────────────────────────
alter table public.teams
  add column if not exists is_grande boolean not null default false;

update public.teams set is_grande = true
where kind = 'club'
  and (name ilike '%benfica%' or name ilike '%porto%' or name ilike '%sporting cp%'
       or name ilike '%sporting clube de portugal%');

-- ── 2. Configuração da liga ──────────────────────────────────
alter table public.pools
  add column if not exists competition_ids uuid[],
  add column if not exists filtro_jogos    text not null default 'todos',
  add column if not exists equipa_id       uuid references public.teams(id) on delete set null,
  add column if not exists duelos_ativos   boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pools_filtro_jogos_valido'
  ) then
    alter table public.pools add constraint pools_filtro_jogos_valido
      check (filtro_jogos in ('todos', 'grandes', 'equipa'));
  end if;
end $$;

comment on column public.pools.competition_ids is
  'Competições que contam. NULL = todas.';
comment on column public.pools.filtro_jogos is
  'todos = os 5 jogos oficiais de cada jornada; grandes = só os que envolvem um grande; equipa = só os de equipa_id.';

-- ── 3. A partir de quando conta para cada membro ─────────────
alter table public.pool_members
  add column if not exists conta_desde timestamptz;

-- Quem já lá estava conta desde que entrou (ou desde a criação da liga)
update public.pool_members pm
set conta_desde = coalesce(pm.conta_desde, pm.created_at, p.created_at)
from public.pools p
where p.id = pm.pool_id and pm.conta_desde is null;

alter table public.pool_members
  alter column conta_desde set default now();

-- ── 4. Pontos de cada membro na sua liga ─────────────────────
--    Somados na leitura, a partir das previsões. Nunca guardados.
create or replace view public.pontos_liga as
select
  pm.pool_id,
  pm.user_id,
  coalesce(sum(p.points), 0)::int                          as pontos,
  count(p.id)::int                                         as previsoes,
  count(p.id) filter (where coalesce(p.points, 0) > 0)::int as acertos
from public.pool_members pm
join public.pools po on po.id = pm.pool_id
left join public.predictions p on p.user_id = pm.user_id
left join public.matches m
       on m.id = p.match_id
      and m.is_official = true
      and m.status = 'finished'
      and m.kickoff_at >= coalesce(pm.conta_desde, po.created_at)
      and (po.competition_ids is null or m.competition_id = any(po.competition_ids))
      and (
        po.filtro_jogos = 'todos'
        or (po.filtro_jogos = 'grandes' and exists (
              select 1 from public.teams t
              where t.id in (m.home_team_id, m.away_team_id) and t.is_grande
           ))
        or (po.filtro_jogos = 'equipa' and po.equipa_id in (m.home_team_id, m.away_team_id))
      )
where m.id is not null or p.id is null
group by pm.pool_id, pm.user_id;

grant select on public.pontos_liga to anon, authenticated;

-- ── 5. Total da liga, para o ranking entre ligas ─────────────
--    Média dos 3 melhores, para não premiar ligas gigantes.
create or replace view public.ranking_ligas as
select
  pl.pool_id,
  sum(pl.pontos) filter (where pl.posicao <= 3)::int as pontos,
  count(*)::int                                      as membros
from (
  select
    pool_id, user_id, pontos,
    row_number() over (partition by pool_id order by pontos desc) as posicao
  from public.pontos_liga
) pl
group by pl.pool_id;

grant select on public.ranking_ligas to anon, authenticated;

-- ── 6. Só o dono configura a liga ────────────────────────────
drop policy if exists "dono configura a liga" on public.pools;
create policy "dono configura a liga"
  on public.pools for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- ── 7. Índices ───────────────────────────────────────────────
create index if not exists idx_pool_members_pool on public.pool_members (pool_id);
create index if not exists idx_predictions_user  on public.predictions (user_id);
create index if not exists idx_teams_grande      on public.teams (is_grande) where is_grande;

-- ── Verificação ──────────────────────────────────────────────
select
  (select count(*) from public.teams where is_grande) as grandes,
  (select count(*) from public.pontos_liga)           as linhas_pontos_liga,
  (select count(*) from public.pool_members where conta_desde is null) as sem_data;
-- Esperado: 3 (ou 4 com o Braga) | nº de membros | 0
