-- ============================================================
-- O TEU DNA — FASE B: atribuição de perfis
--
-- Duas vistas que faltavam ao motor:
--   · a média da comunidade, para saber o que é "acima do normal"
--   · o desempenho nos jogos do clube favorito, respeitando o
--     clube que estava em vigor à data do JOGO
--
-- Continua tudo calculado. Nada é guardado.
-- Idempotente.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 1 — MÉDIA DA COMUNIDADE
-- ════════════════════════════════════════════════════════════

-- Serve de referência: sem ela, chamaríamos "forte" a um valor
-- que é simplesmente o normal. Uma linha por mercado.
create or replace view public.v_media_comunidade as
select 'r90'::text as mercado,
       count(ok_r90)::int as tentativas,
       count(*) filter (where ok_r90)::int as certos,
       round(count(*) filter (where ok_r90) * 100.0
             / nullif(count(ok_r90), 0), 1) as taxa
from public.v_acertos
union all
select 'btts', count(ok_btts), count(*) filter (where ok_btts),
       round(count(*) filter (where ok_btts) * 100.0 / nullif(count(ok_btts), 0), 1)
from public.v_acertos
union all
select 't25', count(ok_t25), count(*) filter (where ok_t25),
       round(count(*) filter (where ok_t25) * 100.0 / nullif(count(ok_t25), 0), 1)
from public.v_acertos
union all
select 'exato', count(ok_exato), count(*) filter (where ok_exato),
       round(count(*) filter (where ok_exato) * 100.0 / nullif(count(ok_exato), 0), 1)
from public.v_acertos;

grant select on public.v_media_comunidade to anon, authenticated;


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 2 — DESEMPENHO PERANTE O CLUBE DO CORAÇÃO
-- ════════════════════════════════════════════════════════════

-- O clube usado é o que estava em vigor à DATA DO JOGO, não o
-- atual. É isso que permite mudar de clube sem reescrever o
-- passado.
create or replace view public.v_metricas_clube as
with com_clube as (
  select
    a.*,
    h.team_id as clube_da_altura,
    (h.team_id is not null
     and h.team_id in (a.home_team_id, a.away_team_id))          as e_do_meu_clube,
    -- O meu clube perdeu ou empatou neste jogo?
    case
      when h.team_id = a.home_team_id then a.res_real <> 'home'
      when h.team_id = a.away_team_id then a.res_real <> 'away'
      else null
    end                                                          as clube_nao_venceu
  from public.v_acertos a
  left join public.user_favourite_team_history h
    on h.user_id = a.user_id
   and a.kickoff_at >= h.valido_de
   and (h.valido_ate is null or a.kickoff_at < h.valido_ate)
)
select
  user_id,
  e_do_meu_clube,
  count(*)::int                                                  as jogos,
  (count(ok_r90) + count(ok_btts) + count(ok_t25) + count(ok_exato))::int
                                                                 as mercados_tentados,
  (count(*) filter (where ok_r90)   + count(*) filter (where ok_btts)
   + count(*) filter (where ok_t25) + count(*) filter (where ok_exato))::int
                                                                 as mercados_certos,
  -- Só faz sentido no bloco do clube: acertaste o 1X2 quando o teu
  -- clube não ganhou? É a medida de não deixar o coração decidir.
  count(*) filter (where clube_nao_venceu)::int                  as jogos_sem_vitoria,
  count(*) filter (where clube_nao_venceu and ok_r90)::int       as acertos_sem_vitoria
from com_clube
where e_do_meu_clube is not null
group by user_id, e_do_meu_clube;

grant select on public.v_metricas_clube to authenticated;


-- ════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ════════════════════════════════════════════════════════════
select
  (select count(*) from public.v_media_comunidade) as linhas_media,   -- 4 sempre
  (select count(*) from public.v_metricas_clube)   as linhas_clube;   -- 0 por agora
