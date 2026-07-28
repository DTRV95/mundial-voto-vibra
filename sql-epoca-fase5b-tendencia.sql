-- ============================================================
-- FASE 5b — Seta de tendência (subiu / desceu X lugares)
--
-- A tendência precisa de saber qual era a posição ANTES. Como os
-- pontos nunca são guardados, guardamos apenas a POSIÇÃO, uma vez
-- por dia. É um histórico, não um acumulador — nunca pode dobrar.
--
-- Cada ranking tem o seu escopo:
--   'total'          → soma de todas as competições da época
--   'comp:<uuid>'    → uma competição, época inteira
--   'mes:<uuid>'     → um mês competitivo
-- ============================================================

-- ── 1. Tabela de fotografias ─────────────────────────────────
create table if not exists public.ranking_snapshots (
  escopo   text        not null,
  dia      date        not null,
  user_id  uuid        not null references auth.users(id) on delete cascade,
  rank     int         not null,
  pontos   int         not null,
  primary key (escopo, dia, user_id)
);

create index if not exists idx_snapshots_escopo_dia
  on public.ranking_snapshots (escopo, dia desc);

alter table public.ranking_snapshots enable row level security;

drop policy if exists "fotografias visiveis para todos" on public.ranking_snapshots;
create policy "fotografias visiveis para todos"
  on public.ranking_snapshots for select using (true);
-- Sem política de escrita: só a função abaixo (security definer) escreve.

-- ── 2. Função que grava a fotografia de hoje ─────────────────
--    Correr duas vezes no mesmo dia atualiza, não duplica.
create or replace function public.gravar_fotografia_ranking()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
  total int := 0;
begin
  -- Total combinado
  insert into public.ranking_snapshots (escopo, dia, user_id, rank, pontos)
  select
    'total', current_date, user_id,
    row_number() over (
      order by pontos desc,
               acertos::numeric / greatest(previsoes, 1) desc,
               previsoes asc
    )::int,
    pontos
  from public.pontos_totais
  on conflict (escopo, dia, user_id)
    do update set rank = excluded.rank, pontos = excluded.pontos;
  get diagnostics n = row_count; total := total + n;

  -- Por competição (época inteira)
  insert into public.ranking_snapshots (escopo, dia, user_id, rank, pontos)
  select
    'comp:' || competition_id, current_date, user_id,
    row_number() over (
      partition by competition_id
      order by pontos desc,
               acertos::numeric / greatest(previsoes, 1) desc,
               previsoes asc
    )::int,
    pontos
  from public.pontos_por_competicao
  on conflict (escopo, dia, user_id)
    do update set rank = excluded.rank, pontos = excluded.pontos;
  get diagnostics n = row_count; total := total + n;

  -- Por mês competitivo
  insert into public.ranking_snapshots (escopo, dia, user_id, rank, pontos)
  select
    'mes:' || month_id, current_date, user_id,
    row_number() over (
      partition by month_id
      order by pontos desc,
               acertos::numeric / greatest(previsoes, 1) desc,
               previsoes asc
    )::int,
    pontos
  from public.pontos_por_mes
  on conflict (escopo, dia, user_id)
    do update set rank = excluded.rank, pontos = excluded.pontos;
  get diagnostics n = row_count; total := total + n;

  return total;
end;
$$;

grant execute on function public.gravar_fotografia_ranking() to authenticated, service_role;

-- ── 3. Vista da posição anterior ─────────────────────────────
--    A fotografia mais recente de cada utilizador, de um dia
--    anterior a hoje. É contra esta que se compara a posição atual.
create or replace view public.ranking_tendencia as
select distinct on (escopo, user_id)
  escopo, user_id, rank as rank_anterior, dia
from public.ranking_snapshots
where dia < current_date
order by escopo, user_id, dia desc;

grant select on public.ranking_tendencia to anon, authenticated;

-- ── 4. Fotografia automática, todos os dias às 04:00 ─────────
create extension if not exists pg_cron;

select cron.unschedule('fotografia-ranking')
  where exists (select 1 from cron.job where jobname = 'fotografia-ranking');

select cron.schedule(
  'fotografia-ranking',
  '0 4 * * *',
  $$ select public.gravar_fotografia_ranking(); $$
);

-- ── 5. Primeira fotografia (para haver já um ponto de partida) ─
select public.gravar_fotografia_ranking() as linhas_gravadas;
