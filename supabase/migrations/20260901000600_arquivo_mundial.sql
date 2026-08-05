-- ============================================================
-- FASE 9 — Arquivo permanente do Mundial 2026 + medalhas
--
-- PORQUÊ AGORA: a classificação final do Mundial vive em
-- `profiles.total_points`, que vai ter de ser zerado quando a
-- época 2026/27 começar. Se zerarmos antes de arquivar, perde-se
-- para sempre quem ganhou o Mundial.
--
-- Este script NÃO zera nada. Só copia e dá medalhas.
-- O zerar é um script separado, para correres quando quiseres.
-- ============================================================

-- ── 1. Classificação final do Mundial, congelada ─────────────
create table if not exists public.mundial_2026_classificacao (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  rank                int  not null,
  total_points        int  not null,
  predictions_made    int  not null default 0,
  predictions_correct int  not null default 0,
  arquivado_em        timestamptz not null default now()
);

alter table public.mundial_2026_classificacao enable row level security;
drop policy if exists "classificacao do mundial visivel para todos"
  on public.mundial_2026_classificacao;
create policy "classificacao do mundial visivel para todos"
  on public.mundial_2026_classificacao for select using (true);

-- ── 2. Medalhas permanentes ──────────────────────────────────
--    A chave única (user_id, slug) torna impossível dar a mesma
--    medalha duas vezes — mesmo correndo este script mil vezes.
create table if not exists public.user_badges (
  user_id     uuid not null references auth.users(id) on delete cascade,
  slug        text not null,
  label       text not null,
  emoji       text not null,
  descricao   text,
  competicao  text not null default 'Mundial 2026',
  ordem       int  not null default 100,
  awarded_at  timestamptz not null default now(),
  primary key (user_id, slug)
);

create index if not exists idx_badges_user on public.user_badges (user_id, ordem);

alter table public.user_badges enable row level security;
drop policy if exists "medalhas visiveis para todos" on public.user_badges;
create policy "medalhas visiveis para todos"
  on public.user_badges for select using (true);
-- Sem política de escrita: só as funções abaixo (security definer) atribuem.

-- ── 3. Arquivar a classificação final ────────────────────────
create or replace function public.arquivar_mundial_2026()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  insert into public.mundial_2026_classificacao
    (user_id, rank, total_points, predictions_made, predictions_correct)
  select
    p.id,
    row_number() over (
      order by p.total_points desc,
               p.predictions_correct desc,
               p.predictions_made asc
    )::int,
    coalesce(p.total_points, 0),
    coalesce(p.predictions_made, 0),
    coalesce(p.predictions_correct, 0)
  from public.profiles p
  where coalesce(p.total_points, 0) > 0
  on conflict (user_id) do update set
    rank                = excluded.rank,
    total_points        = excluded.total_points,
    predictions_made    = excluded.predictions_made,
    predictions_correct = excluded.predictions_correct,
    arquivado_em        = now();

  get diagnostics n = row_count;
  return n;
end;
$$;

-- ── 4. Atribuir as medalhas do Mundial ───────────────────────
create or replace function public.atribuir_medalhas_mundial_2026()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int; total int := 0;
begin
  -- Pódio final
  insert into public.user_badges (user_id, slug, label, emoji, descricao, competicao, ordem)
  select
    c.user_id,
    case c.rank when 1 then 'mundial-2026-campeao'
                when 2 then 'mundial-2026-vice'
                else        'mundial-2026-terceiro' end,
    case c.rank when 1 then 'Campeão do Mundial 2026'
                when 2 then 'Vice-Campeão do Mundial 2026'
                else        '3.º Lugar do Mundial 2026' end,
    case c.rank when 1 then '🏆' when 2 then '🥈' else '🥉' end,
    'Pódio final da classificação geral do Mundial 2026 · ' || c.total_points || ' pontos',
    'Mundial 2026',
    c.rank
  from public.mundial_2026_classificacao c
  where c.rank <= 3
  on conflict (user_id, slug) do nothing;
  get diagnostics n = row_count; total := total + n;

  -- Top 10 (sem contar o pódio)
  insert into public.user_badges (user_id, slug, label, emoji, descricao, competicao, ordem)
  select
    c.user_id, 'mundial-2026-top10', 'Top 10 do Mundial 2026', '⭐',
    'Terminou o Mundial 2026 em ' || c.rank || '.º lugar',
    'Mundial 2026', 10
  from public.mundial_2026_classificacao c
  where c.rank between 4 and 10
  on conflict (user_id, slug) do nothing;
  get diagnostics n = row_count; total := total + n;

  -- Pódios de cada fase, a partir do Hall of Fame que já existe
  insert into public.user_badges (user_id, slug, label, emoji, descricao, competicao, ordem)
  select
    h.user_id,
    'mundial-2026-fase-' || h.phase || '-' || h.rank,
    case h.rank when 1 then 'Vencedor · ' else
      case h.rank when 2 then '2.º · ' else '3.º · ' end end ||
    case h.phase
      when 'grupos'  then 'Fase de Grupos'
      when 'ronda32' then '16 Avos'
      when 'oitavos' then 'Oitavos'
      when 'quartos' then 'Quartos'
      when 'meias'   then 'Meias-Finais'
      when 'final'   then 'Final'
      else h.phase end,
    case h.rank when 1 then '🥇' when 2 then '🥈' else '🥉' end,
    'Pódio da fase · ' || h.total_points || ' pontos',
    'Mundial 2026',
    20 + h.rank
  from public.hall_of_fame h
  where h.rank <= 3
  on conflict (user_id, slug) do nothing;
  get diagnostics n = row_count; total := total + n;

  return total;
end;
$$;

grant execute on function public.arquivar_mundial_2026()          to service_role;
grant execute on function public.atribuir_medalhas_mundial_2026() to service_role;

-- ── 5. Correr agora ──────────────────────────────────────────
select
  public.arquivar_mundial_2026()          as adeptos_arquivados,
  public.atribuir_medalhas_mundial_2026() as medalhas_atribuidas;

-- ── 6. Conferir o pódio antes de seguir ──────────────────────
select c.rank, p.display_name, c.total_points
from public.mundial_2026_classificacao c
join public.profiles p on p.id = c.user_id
order by c.rank
limit 10;
