-- ============================================================
-- O TEU DNA — FASE E: rival do mês e missão pessoal
--
-- O rival é global e SIMÉTRICO: se o Miguel é teu rival, tu és
-- rival dele. Rivais unilaterais criavam situações absurdas —
-- ele nem saberia que existias.
--
-- As missões nascem da tua maior fraqueza. Não dão pontos ao
-- ranking: os rankings continuam a decidir-se só com previsões.
--
-- Idempotente.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 1 — TABELAS
-- ════════════════════════════════════════════════════════════

create table if not exists public.user_rivals (
  user_id      uuid not null references auth.users(id) on delete cascade,
  cycle_id     uuid not null references public.monthly_cycles(id) on delete cascade,
  rival_id     uuid not null references auth.users(id) on delete cascade,
  motivo       text not null default 'mesma_divisao'
               check (motivo in ('mesma_divisao','divisao_acima','divisao_abaixo')),
  -- Preenchidos no fecho do mês
  pontos_meus  int,
  pontos_rival int,
  desfecho     text check (desfecho in ('vitoria','empate','derrota')),
  criado_em    timestamptz not null default now(),
  primary key (user_id, cycle_id),
  constraint rival_nao_sou_eu check (user_id <> rival_id)
);

create table if not exists public.user_missions (
  user_id        uuid not null references auth.users(id) on delete cascade,
  cycle_id       uuid not null references public.monthly_cycles(id) on delete cascade,
  codigo         text not null,
  alvo           int  not null,
  porque         text not null,
  -- Só preenchido no fecho: o progresso durante o mês é calculado
  progresso_final int,
  concluida      boolean,
  criado_em      timestamptz not null default now(),
  primary key (user_id, cycle_id)
);

alter table public.user_rivals enable row level security;
drop policy if exists "ver o meu rival" on public.user_rivals;
create policy "ver o meu rival"
  on public.user_rivals for select to authenticated
  using (user_id = auth.uid() or rival_id = auth.uid());

alter table public.user_missions enable row level security;
drop policy if exists "ver a minha missao" on public.user_missions;
create policy "ver a minha missao"
  on public.user_missions for select to authenticated using (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 2 — DIVISÃO DE CADA UTILIZADOR
-- ════════════════════════════════════════════════════════════

create or replace view public.v_divisao as
select
  user_id, pontos,
  rank() over (order by pontos desc, acertos desc)::int as posicao,
  case
    when rank() over (order by pontos desc, acertos desc) <= 10 then 1
    when rank() over (order by pontos desc, acertos desc) <= 25 then 2
    when rank() over (order by pontos desc, acertos desc) <= 50 then 3
    else 4
  end as divisao
from public.pontos_totais;

grant select on public.v_divisao to anon, authenticated;


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 3 — EMPARELHAR RIVAIS
-- ════════════════════════════════════════════════════════════

create or replace function public.emparelhar_rivais(p_cycle_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anterior uuid;
  v_pares    int := 0;
  a          record;
  b_id       uuid;
begin
  -- Não refazer o que já está feito
  if exists (select 1 from public.user_rivals where cycle_id = p_cycle_id) then
    return 0;
  end if;

  select id into v_anterior from public.monthly_cycles
   where ends_on < (select starts_on from public.monthly_cycles where id = p_cycle_id)
   order by ends_on desc limit 1;

  -- Candidatos: quem aceita, e com atividade suficiente para o
  -- emparelhamento fazer sentido
  create temp table _cand on commit drop as
  select
    d.user_id, d.pontos, d.divisao,
    row_number() over (partition by d.divisao order by d.pontos desc) as ordem
  from public.v_divisao d
  join public.user_prefs pr on pr.user_id = d.user_id and pr.aceita_rival = true
  join public.v_dna_progresso g on g.user_id = d.user_id and g.previsoes_avaliadas >= 5;

  -- Emparelhamento por vizinhança dentro da divisão
  for a in select * from _cand order by divisao, ordem loop
    -- Já emparelhado nesta ronda?
    continue when exists (
      select 1 from public.user_rivals
       where cycle_id = p_cycle_id and user_id = a.user_id);

    select c.user_id into b_id
      from _cand c
     where c.divisao = a.divisao
       and c.user_id <> a.user_id
       and not exists (select 1 from public.user_rivals r
                        where r.cycle_id = p_cycle_id and r.user_id = c.user_id)
       -- Evitar repetir o rival do mês anterior
       and not exists (select 1 from public.user_rivals r2
                        where r2.cycle_id = v_anterior
                          and r2.user_id = a.user_id and r2.rival_id = c.user_id)
     order by abs(c.pontos - a.pontos), c.ordem
     limit 1;

    -- Sem par na divisão: tenta a divisão adjacente
    if b_id is null then
      select c.user_id into b_id
        from _cand c
       where c.user_id <> a.user_id
         and abs(c.divisao - a.divisao) = 1
         and not exists (select 1 from public.user_rivals r
                          where r.cycle_id = p_cycle_id and r.user_id = c.user_id)
       order by abs(c.pontos - a.pontos)
       limit 1;
    end if;

    -- Sem par justo: fica sem rival este mês, e está bem assim
    continue when b_id is null;

    insert into public.user_rivals (user_id, cycle_id, rival_id, motivo)
    select a.user_id, p_cycle_id, b_id,
           case when c.divisao = a.divisao then 'mesma_divisao'
                when c.divisao < a.divisao then 'divisao_acima'
                else 'divisao_abaixo' end
      from _cand c where c.user_id = b_id;

    -- Simétrico: o rival do meu rival sou eu
    insert into public.user_rivals (user_id, cycle_id, rival_id, motivo)
    select b_id, p_cycle_id, a.user_id,
           case when c.divisao = a.divisao then 'mesma_divisao'
                when c.divisao > a.divisao then 'divisao_acima'
                else 'divisao_abaixo' end
      from _cand c where c.user_id = b_id;

    v_pares := v_pares + 1;
    b_id := null;
  end loop;

  return v_pares;
end $$;

grant execute on function public.emparelhar_rivais(uuid) to service_role;


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 4 — ATRIBUIR MISSÕES
-- ════════════════════════════════════════════════════════════

-- A missão sai da maior fraqueza, por ordem. Nunca duas pessoas
-- recebem a mesma missão por acaso: recebem-na porque têm a
-- mesma fraqueza — e a explicação diz isso.
create or replace function public.atribuir_missoes(p_cycle_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  u        record;
  v_codigo text;
  v_alvo   int;
  v_porque text;
  v_n      int := 0;
begin
  if exists (select 1 from public.user_missions where cycle_id = p_cycle_id) then
    return 0;
  end if;

  for u in
    select
      p.id as user_id,
      coalesce(g.previsoes_avaliadas, 0)                                as avaliadas,
      coalesce(me.certos_exato, 0)                                      as exatos,
      coalesce(me.tent_t25, 0)                                          as tent_t25,
      coalesce(me.certos_t25, 0)                                        as certos_t25,
      coalesce(b.com_a_maioria, 0)                                      as maioria,
      coalesce(b.avaliadas, 0)                                          as bancada_aval,
      (select count(distinct competition_id) from public.v_metricas_competicao
        where user_id = p.id)                                           as competicoes,
      (select count(*) from public.competitions)                        as total_competicoes
    from public.profiles p
    left join public.v_dna_progresso g on g.user_id = p.id
    left join lateral (
      select
        sum(certos) filter (where mercado = 'exato') as certos_exato,
        sum(tentativas) filter (where mercado = 't25') as tent_t25,
        sum(certos) filter (where mercado = 't25') as certos_t25
      from public.v_metricas_mercado where user_id = p.id
    ) me on true
    left join public.v_bancada b on b.user_id = p.id
  loop
    v_codigo := null;

    if u.avaliadas < 10 then
      v_codigo := 'arranque'; v_alvo := 1;
      v_porque := 'Estás a começar — esta é a missão de toda a gente no primeiro mês.';

    elsif u.exatos = 0 then
      v_codigo := 'exato'; v_alvo := 2;
      v_porque := 'Ainda não acertaste nenhum resultado exato.';

    elsif u.bancada_aval >= 10 and u.maioria::numeric / u.bancada_aval > 0.8 then
      v_codigo := 'bancada'; v_alvo := 1;
      v_porque := format('Seguiste a maioria em %s%% das previsões.',
                         round(u.maioria * 100.0 / u.bancada_aval));

    elsif u.tent_t25 >= 10 and u.certos_t25::numeric / u.tent_t25 < 0.45 then
      v_codigo := 'golos'; v_alvo := 3;
      v_porque := format('Nos mercados de golos acertas %s%%, abaixo do teu normal.',
                         round(u.certos_t25 * 100.0 / u.tent_t25));

    elsif u.competicoes < u.total_competicoes then
      v_codigo := 'outra_competicao'; v_alvo := 1;
      v_porque := 'Só tens previsões numa das competições.';

    else
      v_codigo := 'participacao'; v_alvo := 3;
      v_porque := 'Um desafio de constância: manteres o ritmo todas as jornadas.';
    end if;

    insert into public.user_missions (user_id, cycle_id, codigo, alvo, porque)
    values (u.user_id, p_cycle_id, v_codigo, v_alvo, v_porque)
    on conflict (user_id, cycle_id) do nothing;

    v_n := v_n + 1;
  end loop;

  return v_n;
end $$;

grant execute on function public.atribuir_missoes(uuid) to service_role;


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 5 — ABRIR O CICLO DO MÊS
-- ════════════════════════════════════════════════════════════

create or replace function public.abrir_ciclo_atual()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ciclo   uuid;
  v_rivais  int := 0;
  v_missoes int := 0;
begin
  select id into v_ciclo from public.monthly_cycles
   where current_date between starts_on and ends_on limit 1;

  if v_ciclo is null then
    return json_build_object('ok', false, 'motivo', 'sem ciclo para hoje');
  end if;

  v_rivais  := public.emparelhar_rivais(v_ciclo);
  v_missoes := public.atribuir_missoes(v_ciclo);

  return json_build_object('ok', true, 'pares', v_rivais, 'missoes', v_missoes);
end $$;

grant execute on function public.abrir_ciclo_atual() to service_role;

-- Todos os dias às 05:00, depois da fotografia do ranking
select cron.unschedule('abrir-ciclo')
  where exists (select 1 from cron.job where jobname = 'abrir-ciclo');

select cron.schedule('abrir-ciclo', '0 5 * * *',
  $$ select public.abrir_ciclo_atual(); $$);


-- ════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ════════════════════════════════════════════════════════════
select
  (select count(*) from public.v_divisao)      as utilizadores_com_divisao,
  (select count(*) from public.user_rivals)    as rivais,
  (select count(*) from public.user_missions)  as missoes;
-- Esperado agora: 0 | 0 | 0
