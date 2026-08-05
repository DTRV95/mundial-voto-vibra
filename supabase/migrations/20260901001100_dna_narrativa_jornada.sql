-- ============================================================
-- O TEU DNA — FASE D: narrativa da jornada
--
--   · Momento decisivo — o jogo que mais mexeu na tua posição
--   · Previsão rara — quem viu o que os outros não viram
--   · Visionário da Jornada — a mais rara de todas, acertada
--
-- O impacto em lugares calcula-se por CONTRAFACTUAL: compara-se
-- a tua posição na jornada com a posição que terias se aquele
-- jogo não tivesse contado para ti. É a única forma honesta de
-- dizer "este jogo fez-te subir 18 lugares".
--
-- Idempotente: reapurar uma jornada apaga e recalcula.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 1 — TABELAS
-- ════════════════════════════════════════════════════════════

-- Marca de jornada já apurada, para não repetir trabalho
alter table public.rounds
  add column if not exists apurada_em timestamptz;

create table if not exists public.round_moments (
  user_id   uuid not null references auth.users(id) on delete cascade,
  round_id  uuid not null references public.rounds(id) on delete cascade,
  match_id  uuid references public.matches(id) on delete cascade,
  tipo      text not null check (tipo in ('ganho','perda','equilibrada','sem-participacao')),
  posicoes  int,
  pontos    int,
  raridade  int,
  narrativa text not null,
  criado_em timestamptz not null default now(),
  primary key (user_id, round_id)
);

create table if not exists public.round_visionaries (
  round_id      uuid not null references public.rounds(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  match_id      uuid not null references public.matches(id) on delete cascade,
  mercado       text not null,
  escolha       text not null,
  percentagem   int  not null,
  participantes int  not null,
  nivel         text not null check (nivel in ('rara','contra_maioria','excecional')),
  principal     boolean not null default false,
  criado_em     timestamptz not null default now(),
  primary key (round_id, user_id, match_id, mercado)
);

-- Uma só distinção principal por jornada e utilizador
create unique index if not exists idx_visionario_principal
  on public.round_visionaries (round_id, user_id) where principal;

alter table public.round_moments enable row level security;
drop policy if exists "ver os meus momentos" on public.round_moments;
create policy "ver os meus momentos"
  on public.round_moments for select to authenticated using (user_id = auth.uid());

alter table public.round_visionaries enable row level security;
drop policy if exists "visionarios visiveis para todos" on public.round_visionaries;
create policy "visionarios visiveis para todos"
  on public.round_visionaries for select using (true);


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 2 — APURAR UMA JORNADA
-- ════════════════════════════════════════════════════════════

create or replace function public.apurar_jornada(p_round_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_por_terminar int;
  v_momentos     int := 0;
  v_raras        int := 0;
  v_min_raridade int;
begin
  -- Só se apura quando todos os jogos oficiais terminaram
  select count(*) into v_por_terminar
    from public.matches
   where round_id = p_round_id and is_official = true and status <> 'finished';

  if v_por_terminar > 0 then
    return json_build_object('ok', false, 'motivo', 'jornada por terminar',
                             'jogos_por_terminar', v_por_terminar);
  end if;

  -- Recalcular do zero: estes dados são derivados, nunca acumulados
  delete from public.round_moments   where round_id = p_round_id;
  delete from public.round_visionaries where round_id = p_round_id;

  -- ── 2.1 Momento decisivo ──────────────────────────────────
  with tot as (
    select user_id, sum(points)::int as pts
      from public.v_acertos where round_id = p_round_id group by user_id
  ),
  dist as (
    select p.match_id, p.result_90 as escolha,
           count(*)::numeric as n,
           sum(count(*)) over (partition by p.match_id)::numeric as total
      from public.predictions p
      join public.matches m on m.id = p.match_id
     where m.round_id = p_round_id and m.is_official = true
       and p.result_90 is not null
     group by p.match_id, p.result_90
  ),
  impacto as (
    select
      a.user_id, a.match_id, a.points, t.pts,
      -- Posição com todos os pontos
      (select count(*) from tot t2
        where t2.user_id <> a.user_id and t2.pts > t.pts) + 1                as rank_com,
      -- Posição se este jogo não tivesse contado só para mim
      (select count(*) from tot t3
        where t3.user_id <> a.user_id and t3.pts > t.pts - a.points) + 1     as rank_sem,
      case when d.total > 0 then round(d.n * 100 / d.total)::int end         as raridade,
      eq_casa.short_name as casa, eq_fora.short_name as fora
    from public.v_acertos a
    join tot t on t.user_id = a.user_id
    left join dist d on d.match_id = a.match_id and d.escolha = a.res_escolhido
    left join public.matches m2 on m2.id = a.match_id
    left join public.teams eq_casa on eq_casa.id = m2.home_team_id
    left join public.teams eq_fora on eq_fora.id = m2.away_team_id
    where a.round_id = p_round_id
  ),
  melhor as (
    select distinct on (user_id)
      user_id, match_id, points, raridade, casa, fora,
      (rank_sem - rank_com) as posicoes
    from impacto
    order by user_id, abs(rank_sem - rank_com) desc, points desc
  )
  insert into public.round_moments
    (user_id, round_id, match_id, tipo, posicoes, pontos, raridade, narrativa)
  select
    m.user_id, p_round_id, m.match_id,
    case when abs(m.posicoes) < 3 then 'equilibrada'
         when m.posicoes > 0 then 'ganho' else 'perda' end,
    m.posicoes, m.points, m.raridade,
    case
      when abs(m.posicoes) < 3 then
        'Foi uma jornada equilibrada. Nenhum jogo teve um impacto dominante.'
      when m.posicoes > 0 and m.raridade is not null and m.raridade <= 25 then
        format('%s–%s fez-te subir %s lugares, e apenas %s%% da comunidade viu o mesmo que tu.',
               coalesce(m.casa,'Casa'), coalesce(m.fora,'Fora'), m.posicoes, m.raridade)
      when m.posicoes > 0 then
        format('%s–%s fez-te subir %s lugares nesta jornada.',
               coalesce(m.casa,'Casa'), coalesce(m.fora,'Fora'), m.posicoes)
      else
        format('%s–%s foi o resultado que mais te penalizou: %s lugares.',
               coalesce(m.casa,'Casa'), coalesce(m.fora,'Fora'), abs(m.posicoes))
    end
  from melhor m;

  get diagnostics v_momentos = row_count;

  -- ── 2.2 Previsões raras ───────────────────────────────────
  -- Só jogos com 20 ou mais previsões. Abaixo disso, uma
  -- percentagem baixa não significa nada.
  with dist as (
    select
      p.match_id, p.result_90 as escolha,
      count(*)::numeric as n,
      sum(count(*)) over (partition by p.match_id)::numeric as total
    from public.predictions p
    join public.matches m on m.id = p.match_id
    where m.round_id = p_round_id and m.is_official = true
      and p.result_90 is not null
    group by p.match_id, p.result_90
  ),
  certas as (
    select
      a.user_id, a.match_id, a.res_escolhido,
      round(d.n * 100 / d.total)::int as pct,
      d.total::int                    as participantes
    from public.v_acertos a
    join dist d on d.match_id = a.match_id and d.escolha = a.res_escolhido
    where a.round_id = p_round_id
      and a.ok_r90 = true
      and d.total >= 20
      and round(d.n * 100 / d.total) <= 15
  )
  insert into public.round_visionaries
    (round_id, user_id, match_id, mercado, escolha, percentagem, participantes, nivel)
  select
    p_round_id, c.user_id, c.match_id, 'r90', c.res_escolhido,
    c.pct, c.participantes,
    case when c.pct <= 5 then 'excecional'
         when c.pct <= 10 then 'contra_maioria'
         else 'rara' end
  from certas c;

  get diagnostics v_raras = row_count;

  -- ── 2.3 Visionário da Jornada ─────────────────────────────
  -- A mais rara de todas as previsões corretas da jornada.
  select min(percentagem) into v_min_raridade
    from public.round_visionaries where round_id = p_round_id;

  if v_min_raridade is not null then
    update public.round_visionaries
       set principal = true
     where round_id = p_round_id and percentagem = v_min_raridade;

    -- Medalha permanente, com a chave única a impedir duplicados
    insert into public.user_badges
      (user_id, slug, label, emoji, descricao, competicao, ordem)
    select
      v.user_id,
      'visionario-' || p_round_id,
      'Visionário da Jornada',
      '🔮',
      format('Apenas %s%% da comunidade viu este resultado.', v.percentagem),
      coalesce(c.name, 'Época 2026/27'),
      30
    from public.round_visionaries v
    join public.rounds r on r.id = v.round_id
    left join public.competitions c on c.id = r.competition_id
    where v.round_id = p_round_id and v.principal = true
    on conflict (user_id, slug) do nothing;
  end if;

  update public.rounds set apurada_em = now() where id = p_round_id;

  return json_build_object('ok', true,
    'momentos', v_momentos, 'raras', v_raras, 'raridade_minima', v_min_raridade);
end $$;

grant execute on function public.apurar_jornada(uuid) to authenticated, service_role;


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 3 — APURAR TUDO O QUE ESTIVER PRONTO
-- ════════════════════════════════════════════════════════════

create or replace function public.apurar_jornadas_prontas()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare r record; n int := 0;
begin
  for r in
    select ro.id from public.rounds ro
     where ro.status = 'publicada'
       and ro.apurada_em is null
       and exists (select 1 from public.matches m
                    where m.round_id = ro.id and m.is_official = true)
       and not exists (select 1 from public.matches m
                        where m.round_id = ro.id and m.is_official = true
                          and m.status <> 'finished')
  loop
    perform public.apurar_jornada(r.id);
    n := n + 1;
  end loop;
  return n;
end $$;

grant execute on function public.apurar_jornadas_prontas() to service_role;

-- De hora a hora, aos 30 minutos — depois da resolução dos duelos
select cron.unschedule('apurar-jornadas')
  where exists (select 1 from cron.job where jobname = 'apurar-jornadas');

select cron.schedule('apurar-jornadas', '30 * * * *',
  $$ select public.apurar_jornadas_prontas(); $$);


-- ════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ════════════════════════════════════════════════════════════
select
  (select count(*) from pg_proc where proname = 'apurar_jornada')  as funcao,
  (select count(*) from public.round_moments)                      as momentos,
  (select count(*) from public.round_visionaries)                   as visionarios,
  (select count(*) from public.rounds where apurada_em is not null) as jornadas_apuradas;
-- Esperado agora: 1 | 0 | 0 | 0
