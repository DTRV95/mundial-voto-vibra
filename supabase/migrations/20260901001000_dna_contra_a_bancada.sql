-- ============================================================
-- O TEU DNA — FASE C: Contra a Bancada
--
-- A previsão faz-se às cegas. Depois de guardar, o utilizador
-- pode consultar a opinião da comunidade — mas essa consulta
-- marca a previsão como INFORMADA, em definitivo, para todo o
-- jogo, mesmo que a altere a seguir.
--
-- A distribuição só é acessível através da função ver_bancada().
-- Não há forma de a ler sem ficar marcado — é isso que torna o
-- índice honesto.
--
-- Idempotente.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 1 — VER A BANCADA
-- ════════════════════════════════════════════════════════════

-- Marca primeiro, devolve depois. Amostra mínima de 10 previsões:
-- abaixo disso não se devolve nada e nada é marcado.
create or replace function public.ver_bancada(p_match_id uuid)
returns table (
  mercado     text,
  escolha     text,
  votos       int,
  total       int,
  percentagem int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_total int;
begin
  if v_user is null then
    raise exception 'Sem sessão iniciada.';
  end if;

  -- Amostra mínima: sem ela, não se mostra nem se marca
  select count(*) into v_total
    from public.predictions
   where match_id = p_match_id and result_90 is not null;

  if v_total < 10 then
    return;
  end if;

  -- A partir daqui a previsão fica informada, para sempre.
  -- coalesce preserva a data da primeira consulta.
  update public.predictions
     set bancada_vista_em = coalesce(bancada_vista_em, now())
   where match_id = p_match_id and user_id = v_user;

  return query
  with contagens as (
    select 'r90'::text as m, p.result_90 as e, count(*)::int as n
      from public.predictions p
     where p.match_id = p_match_id and p.result_90 is not null
     group by p.result_90
    union all
    select 'btts', p.btts, count(*)::int
      from public.predictions p
     where p.match_id = p_match_id and p.btts is not null
     group by p.btts
    union all
    select 't25', p.total_25, count(*)::int
      from public.predictions p
     where p.match_id = p_match_id and p.total_25 is not null
     group by p.total_25
  ),
  totais as (
    select m, sum(n)::int as t from contagens group by m
  )
  select c.m, c.e, c.n, t.t, round(c.n * 100.0 / nullif(t.t, 0))::int
    from contagens c join totais t on t.m = c.m
   order by c.m, c.n desc;
end $$;

grant execute on function public.ver_bancada(uuid) to authenticated;


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 2 — ÍNDICE CONTRA A BANCADA
-- ════════════════════════════════════════════════════════════

-- Uma escolha é "contra a bancada" quando não é a opção mais
-- votada do jogo. Só contam previsões NÃO informadas e jogos com
-- pelo menos 10 previsões — o resto seria ruído.
create or replace view public.v_bancada as
with votos as (
  select
    p.match_id,
    p.result_90                                             as escolha,
    count(*)::int                                           as n,
    sum(count(*)) over (partition by p.match_id)::int       as total,
    max(count(*)) over (partition by p.match_id)::int       as mais_votada
  from public.predictions p
  where p.result_90 is not null
  group by p.match_id, p.result_90
),
minhas as (
  select
    a.user_id,
    a.match_id,
    a.ok_r90,
    a.informada,
    v.n, v.total, v.mais_votada,
    round(v.n * 100.0 / nullif(v.total, 0))::int            as percentagem_comigo
  from public.v_acertos a
  join votos v on v.match_id = a.match_id and v.escolha = a.res_escolhido
  where a.res_escolhido is not null
    and v.total >= 10
)
select
  user_id,
  count(*) filter (where not informada)::int                          as avaliadas,
  count(*) filter (where not informada and n < mais_votada)::int      as contra_bancada,
  count(*) filter (where not informada and n < mais_votada and ok_r90)::int
                                                                      as contra_e_certas,
  count(*) filter (where not informada and n = mais_votada)::int      as com_a_maioria,
  count(*) filter (where not informada and n = mais_votada and ok_r90)::int
                                                                      as maioria_e_certas,
  count(*) filter (where informada)::int                              as informadas,
  min(percentagem_comigo) filter (where not informada and ok_r90)::int
                                                                      as menor_percentagem_certa
from minhas
group by user_id;

grant select on public.v_bancada to anon, authenticated;


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 3 — A BANCADA DE UM JOGO JÁ FECHADO
-- ════════════════════════════════════════════════════════════

-- Depois do apito inicial a distribuição deixa de poder
-- influenciar seja o que for, por isso é leitura livre.
create or replace view public.v_bancada_fechada as
select
  p.match_id, 'r90'::text as mercado, p.result_90 as escolha,
  count(*)::int as votos,
  round(count(*) * 100.0 / nullif(sum(count(*)) over (partition by p.match_id), 0))::int as percentagem
from public.predictions p
join public.matches m on m.id = p.match_id
where p.result_90 is not null
  and (m.voting_open = false or m.kickoff_at < now())
group by p.match_id, p.result_90
union all
select
  p.match_id, 'btts', p.btts, count(*)::int,
  round(count(*) * 100.0 / nullif(sum(count(*)) over (partition by p.match_id), 0))::int
from public.predictions p
join public.matches m on m.id = p.match_id
where p.btts is not null
  and (m.voting_open = false or m.kickoff_at < now())
group by p.match_id, p.btts
union all
select
  p.match_id, 't25', p.total_25, count(*)::int,
  round(count(*) * 100.0 / nullif(sum(count(*)) over (partition by p.match_id), 0))::int
from public.predictions p
join public.matches m on m.id = p.match_id
where p.total_25 is not null
  and (m.voting_open = false or m.kickoff_at < now())
group by p.match_id, p.total_25;

grant select on public.v_bancada_fechada to anon, authenticated;


-- ════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ════════════════════════════════════════════════════════════
select
  (select count(*) from pg_proc where proname = 'ver_bancada')      as funcao_criada,
  (select count(*) from public.v_bancada)                           as linhas_indice,
  (select count(*) from public.predictions
    where bancada_vista_em is not null)                             as previsoes_informadas;
-- Esperado agora: 1 | 0 | 0
