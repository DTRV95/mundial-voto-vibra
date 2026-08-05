-- ============================================================
-- O TEU DNA — FASE F: fecho do mês e resumo mensal
--
-- O que o mês produziu fica CONGELADO. Depois de fechado, o
-- resumo de Setembro não muda mais — nem que os dados de origem
-- sejam recalculados. É a diferença entre esta tabela e todas as
-- vistas que fizemos até aqui.
--
-- Idempotente: fechar duas vezes não altera nada na segunda.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 1 — TABELA DO SNAPSHOT
-- ════════════════════════════════════════════════════════════

create table if not exists public.user_month_snapshot (
  user_id              uuid not null references auth.users(id) on delete cascade,
  cycle_id             uuid not null references public.monthly_cycles(id) on delete cascade,
  dna_principal        text,
  dna_traco            text,
  dna_porque           text,
  talisma_id           text references public.teams(id),
  fantasma_id          text references public.teams(id),
  melhor_competicao_id uuid references public.competitions(id),
  pontos_total         int not null default 0,
  posicao_final        int,
  previsoes            int not null default 0,
  acerto               int,
  -- A narrativa e o detalhe por competição
  resumo               jsonb not null default '{}'::jsonb,
  criado_em            timestamptz not null default now(),
  primary key (user_id, cycle_id)
);

alter table public.user_month_snapshot enable row level security;
drop policy if exists "ver o meu resumo" on public.user_month_snapshot;
create policy "ver o meu resumo"
  on public.user_month_snapshot for select to authenticated using (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 2 — PROGRESSO DAS MISSÕES
-- ════════════════════════════════════════════════════════════

-- Calculado, nunca guardado durante o mês. Só o valor final é
-- congelado no fecho.
create or replace function public.progresso_missao(
  p_user_id uuid, p_codigo text, p_cycle_id uuid
) returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ini date; v_fim date; v_n int := 0;
begin
  select starts_on, ends_on into v_ini, v_fim
    from public.monthly_cycles where id = p_cycle_id;

  if p_codigo = 'exato' then
    select count(*) into v_n from public.v_acertos
     where user_id = p_user_id and ok_exato
       and kickoff_at::date between v_ini and v_fim;

  elsif p_codigo = 'golos' then
    select count(*) into v_n from public.v_acertos
     where user_id = p_user_id and ok_t25
       and kickoff_at::date between v_ini and v_fim;

  elsif p_codigo = 'bancada' then
    -- Acertos contra a maioria, em previsões não informadas
    select count(*) into v_n
      from public.v_acertos a
      join (
        select match_id, result_90 as escolha, count(*) as n,
               max(count(*)) over (partition by match_id) as topo
          from public.predictions where result_90 is not null
         group by match_id, result_90
      ) d on d.match_id = a.match_id and d.escolha = a.res_escolhido
     where a.user_id = p_user_id and a.ok_r90 and not a.informada
       and d.n < d.topo
       and a.kickoff_at::date between v_ini and v_fim;

  elsif p_codigo in ('arranque', 'participacao') then
    -- Jornadas com todos os 5 jogos previstos
    select count(*) into v_n from (
      select a.round_id
        from public.v_acertos a
       where a.user_id = p_user_id
         and a.kickoff_at::date between v_ini and v_fim
       group by a.round_id
      having count(*) >= 5
    ) x;

  elsif p_codigo = 'outra_competicao' then
    select count(distinct competition_id) into v_n from public.v_acertos
     where user_id = p_user_id and kickoff_at::date between v_ini and v_fim;
  end if;

  return coalesce(v_n, 0);
end $$;

grant execute on function public.progresso_missao(uuid, text, uuid) to authenticated;


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 3 — FECHAR O MÊS
-- ════════════════════════════════════════════════════════════

create or replace function public.fechar_ciclo_mensal(p_cycle_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ciclo    record;
  v_snaps    int := 0;
  v_missoes  int := 0;
  u          record;
begin
  select * into v_ciclo from public.monthly_cycles where id = p_cycle_id;
  if v_ciclo is null then
    return json_build_object('ok', false, 'motivo', 'ciclo inexistente');
  end if;
  if v_ciclo.status = 'fechado' then
    return json_build_object('ok', true, 'ja_estava_fechado', true);
  end if;
  if v_ciclo.ends_on >= current_date then
    return json_build_object('ok', false, 'motivo', 'mês ainda a decorrer');
  end if;

  -- ── 3.1 Resolver os duelos com o rival ────────────────────
  update public.user_rivals r
     set pontos_meus  = coalesce((select sum(points)::int from public.v_acertos a
                                   where a.user_id = r.user_id
                                     and a.kickoff_at::date between v_ciclo.starts_on and v_ciclo.ends_on), 0),
         pontos_rival = coalesce((select sum(points)::int from public.v_acertos a
                                   where a.user_id = r.rival_id
                                     and a.kickoff_at::date between v_ciclo.starts_on and v_ciclo.ends_on), 0)
   where r.cycle_id = p_cycle_id;

  update public.user_rivals
     set desfecho = case
           when pontos_meus > pontos_rival then 'vitoria'
           when pontos_meus < pontos_rival then 'derrota'
           else 'empate' end
   where cycle_id = p_cycle_id and desfecho is null;

  -- ── 3.2 Avaliar as missões ────────────────────────────────
  update public.user_missions m
     set progresso_final = public.progresso_missao(m.user_id, m.codigo, p_cycle_id),
         concluida = public.progresso_missao(m.user_id, m.codigo, p_cycle_id) >= m.alvo
   where m.cycle_id = p_cycle_id and m.concluida is null;

  get diagnostics v_missoes = row_count;

  -- Medalha por missão cumprida
  insert into public.user_badges (user_id, slug, label, emoji, descricao, competicao, ordem)
  select m.user_id, 'missao-' || p_cycle_id, 'Missão cumprida', '🎯',
         format('Concluíste o teu desafio de %s.', v_ciclo.label),
         v_ciclo.label, 40
    from public.user_missions m
   where m.cycle_id = p_cycle_id and m.concluida = true
  on conflict (user_id, slug) do nothing;

  -- ── 3.3 Congelar o resumo ─────────────────────────────────
  for u in
    select
      a.user_id,
      sum(a.points)::int                                            as pontos,
      count(*)::int                                                 as previsoes,
      count(distinct a.round_id)::int                               as jornadas,
      (count(*) filter (where a.ok_r90) + count(*) filter (where a.ok_btts)
       + count(*) filter (where a.ok_t25) + count(*) filter (where a.ok_exato))::int as certos,
      (count(a.ok_r90) + count(a.ok_btts)
       + count(a.ok_t25) + count(a.ok_exato))::int                  as tentados,
      count(*) filter (where a.ok_exato)::int                       as exatos
    from public.v_acertos a
    where a.kickoff_at::date between v_ciclo.starts_on and v_ciclo.ends_on
    group by a.user_id
    having count(distinct a.round_id) >= 2          -- atividade mínima
  loop
    insert into public.user_month_snapshot (
      user_id, cycle_id, pontos_total, previsoes, acerto,
      melhor_competicao_id, posicao_final, resumo
    )
    values (
      u.user_id, p_cycle_id, u.pontos, u.previsoes,
      case when u.tentados > 0 then round(u.certos * 100.0 / u.tentados)::int end,
      -- Competição com mais pontos no mês
      (select a.competition_id from public.v_acertos a
        where a.user_id = u.user_id
          and a.kickoff_at::date between v_ciclo.starts_on and v_ciclo.ends_on
        group by a.competition_id order by sum(a.points) desc limit 1),
      -- Posição no mês
      (select count(*) + 1 from (
        select a2.user_id, sum(a2.points) as p from public.v_acertos a2
         where a2.kickoff_at::date between v_ciclo.starts_on and v_ciclo.ends_on
         group by a2.user_id) t
        where t.p > u.pontos),
      jsonb_build_object(
        'nivel',    case when u.jornadas >= 4 then 'completo' else 'reduzido' end,
        'jornadas', u.jornadas,
        'exatos',   u.exatos,
        'competicoes', (
          select coalesce(jsonb_agg(jsonb_build_object(
                   'competition_id', x.competition_id,
                   'pontos', x.pontos, 'previsoes', x.previsoes)), '[]'::jsonb)
            from (select a3.competition_id, sum(a3.points)::int as pontos,
                         count(*)::int as previsoes
                    from public.v_acertos a3
                   where a3.user_id = u.user_id
                     and a3.kickoff_at::date between v_ciclo.starts_on and v_ciclo.ends_on
                   group by a3.competition_id) x
        ),
        'rival', (
          select jsonb_build_object('rival_id', r.rival_id, 'meus', r.pontos_meus,
                                    'dele', r.pontos_rival, 'desfecho', r.desfecho)
            from public.user_rivals r
           where r.cycle_id = p_cycle_id and r.user_id = u.user_id
        ),
        'missao', (
          select jsonb_build_object('codigo', m.codigo, 'alvo', m.alvo,
                                    'progresso', m.progresso_final, 'concluida', m.concluida)
            from public.user_missions m
           where m.cycle_id = p_cycle_id and m.user_id = u.user_id
        )
      )
    )
    on conflict (user_id, cycle_id) do nothing;   -- congelado: nunca se reescreve

    v_snaps := v_snaps + 1;
  end loop;

  update public.monthly_cycles
     set status = 'fechado', fechado_em = now()
   where id = p_cycle_id;

  return json_build_object('ok', true, 'resumos', v_snaps, 'missoes_avaliadas', v_missoes);
end $$;

grant execute on function public.fechar_ciclo_mensal(uuid) to service_role;


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 4 — FECHAR O QUE JÁ ACABOU
-- ════════════════════════════════════════════════════════════

create or replace function public.fechar_ciclos_terminados()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare c record; n int := 0;
begin
  for c in
    select id from public.monthly_cycles
     where status = 'aberto' and ends_on < current_date
     order by ends_on
  loop
    perform public.fechar_ciclo_mensal(c.id);
    n := n + 1;
  end loop;
  return n;
end $$;

grant execute on function public.fechar_ciclos_terminados() to service_role;

-- Às 04:30, entre a fotografia do ranking e a abertura do ciclo novo
select cron.unschedule('fechar-ciclos')
  where exists (select 1 from cron.job where jobname = 'fechar-ciclos');

select cron.schedule('fechar-ciclos', '30 4 * * *',
  $$ select public.fechar_ciclos_terminados(); $$);


-- ════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ════════════════════════════════════════════════════════════
select
  (select count(*) from public.user_month_snapshot)                  as resumos,
  (select count(*) from public.monthly_cycles where status='fechado') as ciclos_fechados,
  (select count(*) from pg_proc where proname='fechar_ciclo_mensal')  as funcao;
-- Esperado agora: 0 | 0 | 1
