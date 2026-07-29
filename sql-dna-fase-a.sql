-- ============================================================
-- O TEU DNA — FASE A: fundação estatística
--
-- Prepara a recolha. Não implementa rival, missões, momentos
-- decisivos, previsões raras nem resumo mensal.
--
-- PRINCÍPIO DE SEMPRE: a previsão e o resultado do jogo são a
-- fonte de verdade. Os acertos por mercado são CALCULADOS, nunca
-- guardados — é o que torna impossível haver dados a divergir.
--
-- Idempotente: pode correr as vezes que forem precisas.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 1 — ALTERAÇÕES A TABELAS EXISTENTES
-- ════════════════════════════════════════════════════════════

-- Clube favorito (opcional). Atalho de leitura; a fonte para
-- métricas retroativas é o histórico criado na secção 2.
alter table public.profiles
  add column if not exists favourite_team_id text
    references public.teams(id) on delete set null;

comment on column public.profiles.favourite_team_id is
  'Clube favorito atual. Para métricas passadas usar user_favourite_team_history.';

-- Consulta da bancada: estado, não derivável de mais nada.
alter table public.predictions
  add column if not exists bancada_vista_em timestamptz;

comment on column public.predictions.bancada_vista_em is
  'Quando o utilizador consultou a distribuição da comunidade. Não nulo = previsão informada, deixa de contar para o Índice Contra a Bancada.';

-- Ligação de cada mês de competição ao ciclo mensal global.
alter table public.competition_months
  add column if not exists cycle_id uuid;


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 2 — TABELAS NOVAS
-- ════════════════════════════════════════════════════════════

-- ── 2.1 Ciclo mensal global ─────────────────────────────────
-- competition_months é por competição: Setembro existe duas
-- vezes, uma por competição. O rival e a missão são globais e
-- precisam de um mês só.
create table if not exists public.monthly_cycles (
  id         uuid primary key default gen_random_uuid(),
  year       int  not null,
  month      int  not null check (month between 1 and 12),
  label      text not null,
  starts_on  date not null,
  ends_on    date not null,
  status     text not null default 'aberto'
             check (status in ('aberto', 'fechado')),
  fechado_em timestamptz,
  unique (year, month)
);

-- ── 2.2 Histórico do clube favorito ─────────────────────────
-- Mudar de clube não pode reescrever o passado: as métricas de
-- clubismo usam o clube que estava em vigor à data do JOGO.
create table if not exists public.user_favourite_team_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  team_id    text references public.teams(id) on delete set null,  -- null = removeu
  season_id  uuid references public.seasons(id) on delete set null,
  valido_de  timestamptz not null default now(),
  valido_ate timestamptz,                     -- null = em vigor
  inicial    boolean not null default false,  -- a primeira escolha não conta como alteração
  criado_em  timestamptz not null default now()
);

-- Só pode haver um clube em vigor de cada vez
create unique index if not exists idx_clube_favorito_em_vigor
  on public.user_favourite_team_history (user_id) where valido_ate is null;

create index if not exists idx_clube_favorito_periodo
  on public.user_favourite_team_history (user_id, valido_de desc);

-- ── 2.3 Preferências de privacidade ─────────────────────────
create table if not exists public.user_prefs (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  dna_publico     boolean not null default true,
  talisma_publico boolean not null default true,
  aceita_rival    boolean not null default true,
  atualizado_em   timestamptz not null default now()
);

-- ── 2.4 Descobertas já vistas ───────────────────────────────
-- NÃO guarda as descobertas — essas vivem nas tabelas de origem.
-- Guarda apenas o que a pessoa já viu, que é a única coisa que
-- não se consegue derivar de mais lado nenhum.
create table if not exists public.user_discovery_seen (
  user_id  uuid not null references auth.users(id) on delete cascade,
  chave    text not null,   -- determinística: 'momento:<round_id>', 'resumo:<cycle_id>'
  vista_em timestamptz not null default now(),
  primary key (user_id, chave)
);


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 3 — MIGRAÇÃO E ASSOCIAÇÃO DE DADOS
-- ════════════════════════════════════════════════════════════

-- ── 3.1 Criar os ciclos globais a partir dos meses existentes ─
insert into public.monthly_cycles (year, month, label, starts_on, ends_on)
select distinct on (cm.year, cm.month)
  cm.year, cm.month, cm.label,
  make_date(cm.year, cm.month, 1),
  (make_date(cm.year, cm.month, 1) + interval '1 month - 1 day')::date
from public.competition_months cm
on conflict (year, month) do nothing;

-- ── 3.2 Ligar cada mês de competição ao seu ciclo ───────────
update public.competition_months cm
set cycle_id = mc.id
from public.monthly_cycles mc
where mc.year = cm.year and mc.month = cm.month
  and cm.cycle_id is distinct from mc.id;

-- ── 3.3 Preferências para quem já tem conta ─────────────────
insert into public.user_prefs (user_id)
select p.id from public.profiles p
on conflict (user_id) do nothing;

-- ── 3.4 Histórico para quem já tenha clube definido ─────────
-- (hoje ninguém tem; fica aqui para a migração ser repetível)
insert into public.user_favourite_team_history (user_id, team_id, valido_de, inicial)
select p.id, p.favourite_team_id, now(), true
from public.profiles p
where p.favourite_team_id is not null
  and not exists (
    select 1 from public.user_favourite_team_history h where h.user_id = p.id
  );


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 4 — VISTAS
-- ════════════════════════════════════════════════════════════

-- ── 4.1 v_acertos — a pedra angular ─────────────────────────
-- Recalcula, previsão a previsão, o que foi acertado em cada
-- mercado. NADA disto é guardado.
--
-- Só jogos oficiais e terminados. Os mercados do Mundial
-- (total_35, combo_15, combo_35, double_chance, qualifier)
-- são deliberadamente ignorados: não fazem parte desta época.
create or replace view public.v_acertos as
select
  p.id                        as prediction_id,
  p.user_id,
  p.match_id,
  p.points,
  p.created_at,
  (p.bancada_vista_em is not null) as informada,
  m.competition_id,
  m.round_id,
  m.home_team_id,
  m.away_team_id,
  m.highlight_tag,
  m.kickoff_at,
  r.month_id,
  r.number                    as jornada,

  -- Resultado real
  case when m.home_score > m.away_score then 'home'
       when m.home_score < m.away_score then 'away'
       else 'draw' end        as res_real,
  p.result_90                 as res_escolhido,

  -- Acerto por mercado: null = não preencheu
  case when p.result_90 is null then null
       else p.result_90 = (case when m.home_score > m.away_score then 'home'
                                when m.home_score < m.away_score then 'away'
                                else 'draw' end) end               as ok_r90,
  case when p.btts is null then null
       else p.btts = (case when m.home_score > 0 and m.away_score > 0
                           then 'yes' else 'no' end) end           as ok_btts,
  case when p.total_25 is null then null
       else p.total_25 = (case when m.home_score + m.away_score > 2
                               then 'over' else 'under' end) end   as ok_t25,
  case when p.exact_home is null or p.exact_away is null then null
       else (p.exact_home = m.home_score
             and p.exact_away = m.away_score) end                  as ok_exato

from public.predictions p
join public.matches m on m.id = p.match_id
join public.rounds   r on r.id = m.round_id
where m.is_official = true
  and m.status = 'finished'
  and m.home_score is not null
  and m.away_score is not null;

-- ── 4.2 Progresso do DNA ────────────────────────────────────
create or replace view public.v_dna_progresso as
select
  user_id,
  count(*)::int                                              as previsoes_avaliadas,
  (count(ok_r90) + count(ok_btts) + count(ok_t25)
   + count(ok_exato))::int                                   as mercados_tentados,
  (count(*) filter (where ok_r90)   + count(*) filter (where ok_btts)
   + count(*) filter (where ok_t25) + count(*) filter (where ok_exato))::int
                                                             as mercados_certos,
  coalesce(sum(points), 0)::int                              as pontos
from public.v_acertos
group by user_id;

-- ── 4.3 Métricas por mercado ────────────────────────────────
create or replace view public.v_metricas_mercado as
select user_id, competition_id, 'r90'::text as mercado,
       count(ok_r90)::int as tentativas,
       count(*) filter (where ok_r90)::int as certos
from public.v_acertos group by user_id, competition_id
union all
select user_id, competition_id, 'btts',
       count(ok_btts), count(*) filter (where ok_btts)
from public.v_acertos group by user_id, competition_id
union all
select user_id, competition_id, 't25',
       count(ok_t25), count(*) filter (where ok_t25)
from public.v_acertos group by user_id, competition_id
union all
select user_id, competition_id, 'exato',
       count(ok_exato), count(*) filter (where ok_exato)
from public.v_acertos group by user_id, competition_id;

-- ── 4.4 Métricas por competição ─────────────────────────────
create or replace view public.v_metricas_competicao as
select
  user_id, competition_id,
  count(*)::int                                                  as previsoes,
  coalesce(sum(points), 0)::int                                  as pontos,
  (count(ok_r90) + count(ok_btts) + count(ok_t25) + count(ok_exato))::int
                                                                 as mercados_tentados,
  (count(*) filter (where ok_r90)   + count(*) filter (where ok_btts)
   + count(*) filter (where ok_t25) + count(*) filter (where ok_exato))::int
                                                                 as mercados_certos
from public.v_acertos
group by user_id, competition_id;

-- ── 4.5 Métricas por equipa ─────────────────────────────────
-- Cada jogo conta para as duas equipas.
create or replace view public.v_metricas_equipa as
with por_equipa as (
  select user_id, home_team_id as team_id, points,
         ok_r90, ok_btts, ok_t25, ok_exato from public.v_acertos
  union all
  select user_id, away_team_id, points,
         ok_r90, ok_btts, ok_t25, ok_exato from public.v_acertos
)
select
  user_id, team_id,
  count(*)::int                                                  as jogos,
  coalesce(sum(points), 0)::int                                  as pontos,
  round(coalesce(avg(points), 0)::numeric, 2)                    as pontos_media,
  (count(ok_r90) + count(ok_btts) + count(ok_t25) + count(ok_exato))::int
                                                                 as mercados_tentados,
  (count(*) filter (where ok_r90)   + count(*) filter (where ok_btts)
   + count(*) filter (where ok_t25) + count(*) filter (where ok_exato))::int
                                                                 as mercados_certos
from por_equipa
group by user_id, team_id;

-- ── 4.6 Métricas em jogos de destaque ───────────────────────
create or replace view public.v_metricas_destaque as
select
  user_id,
  (highlight_tag is not null)                                    as destaque,
  count(*)::int                                                  as previsoes,
  (count(ok_r90) + count(ok_btts) + count(ok_t25) + count(ok_exato))::int
                                                                 as mercados_tentados,
  (count(*) filter (where ok_r90)   + count(*) filter (where ok_btts)
   + count(*) filter (where ok_t25) + count(*) filter (where ok_exato))::int
                                                                 as mercados_certos
from public.v_acertos
group by user_id, (highlight_tag is not null);

-- ── 4.7 Distribuição da comunidade ──────────────────────────
-- Contagens em bruto. A regra de amostra mínima (10 previsões)
-- aplica-se na leitura, não aqui.
create or replace view public.v_distribuicao as
select match_id, 'r90'::text as mercado, result_90 as escolha, count(*)::int as total
from public.predictions where result_90 is not null group by match_id, result_90
union all
select match_id, 'btts', btts, count(*)::int
from public.predictions where btts is not null group by match_id, btts
union all
select match_id, 't25', total_25, count(*)::int
from public.predictions where total_25 is not null group by match_id, total_25;

-- ── 4.8 Estilo de escolha ───────────────────────────────────
-- Usa TODAS as previsões em jogos oficiais, mesmo antes de o
-- jogo acontecer. É o que permite dar uma observação verdadeira
-- ao utilizador antes de existirem resultados.
create or replace view public.v_estilo as
select
  p.user_id,
  count(*)::int                                                  as previsoes_feitas,
  count(*) filter (where p.result_90 = 'draw')::int              as empates,
  count(*) filter (where p.result_90 = 'home')::int              as casa,
  count(*) filter (where p.result_90 = 'away')::int              as fora,
  count(*) filter (where p.exact_home is not null)::int          as com_exato,
  count(*) filter (where p.btts is not null
                     and p.total_25 is not null)::int            as com_golos,
  count(*) filter (where p.bancada_vista_em is not null)::int    as informadas
from public.predictions p
join public.matches m on m.id = p.match_id
where m.is_official = true
group by p.user_id;

-- ── 4.9 DNA público ─────────────────────────────────────────
-- Respeita as preferências. Fica preparada para a Fase B, onde
-- passa a ler o snapshot mensal.
create or replace view public.v_dna_publico as
select
  pr.user_id,
  pr.dna_publico,
  pr.talisma_publico
from public.user_prefs pr;


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 5 — ÍNDICES
-- ════════════════════════════════════════════════════════════

create index if not exists idx_predictions_match_user
  on public.predictions (match_id, user_id);
create index if not exists idx_predictions_user
  on public.predictions (user_id);
create index if not exists idx_matches_oficiais_terminados
  on public.matches (competition_id, status) where is_official;
create index if not exists idx_matches_round_oficial
  on public.matches (round_id) where is_official;
create index if not exists idx_cycles_periodo
  on public.monthly_cycles (starts_on, ends_on);


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 6 — POLÍTICAS RLS
-- ════════════════════════════════════════════════════════════

-- ── monthly_cycles: leitura para todos ──────────────────────
alter table public.monthly_cycles enable row level security;
drop policy if exists "ciclos visiveis para todos" on public.monthly_cycles;
create policy "ciclos visiveis para todos"
  on public.monthly_cycles for select using (true);

-- ── user_prefs: só o próprio ────────────────────────────────
alter table public.user_prefs enable row level security;

drop policy if exists "ver as minhas preferencias" on public.user_prefs;
create policy "ver as minhas preferencias"
  on public.user_prefs for select to authenticated using (user_id = auth.uid());

drop policy if exists "criar as minhas preferencias" on public.user_prefs;
create policy "criar as minhas preferencias"
  on public.user_prefs for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "mudar as minhas preferencias" on public.user_prefs;
create policy "mudar as minhas preferencias"
  on public.user_prefs for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── user_discovery_seen: só o próprio ───────────────────────
alter table public.user_discovery_seen enable row level security;

drop policy if exists "ver o que ja vi" on public.user_discovery_seen;
create policy "ver o que ja vi"
  on public.user_discovery_seen for select to authenticated using (user_id = auth.uid());

drop policy if exists "marcar como visto" on public.user_discovery_seen;
create policy "marcar como visto"
  on public.user_discovery_seen for insert to authenticated
  with check (user_id = auth.uid());

-- ── user_favourite_team_history ─────────────────────────────
-- Leitura pública: o clube favorito é informação de perfil.
-- Escrita só do próprio, e a regra de "uma vez por época" é
-- aplicada pela função da secção 7.
alter table public.user_favourite_team_history enable row level security;

drop policy if exists "historico de clube visivel" on public.user_favourite_team_history;
create policy "historico de clube visivel"
  on public.user_favourite_team_history for select using (true);

-- ── Leitura das vistas ──────────────────────────────────────
-- Agregados por utilizador: alimentam o DNA, incluindo o público.
grant select on public.v_dna_progresso      to anon, authenticated;
grant select on public.v_metricas_mercado   to anon, authenticated;
grant select on public.v_metricas_competicao to anon, authenticated;
grant select on public.v_metricas_equipa    to anon, authenticated;
grant select on public.v_metricas_destaque  to anon, authenticated;
grant select on public.v_distribuicao       to anon, authenticated;
grant select on public.v_estilo             to anon, authenticated;
grant select on public.v_dna_publico        to anon, authenticated;

-- v_acertos expõe acerto previsão a previsão: só a quem tem sessão.
grant select on public.v_acertos            to authenticated;


-- ════════════════════════════════════════════════════════════
-- SECÇÃO 7 — CLUBE FAVORITO: ESCOLHER E ALTERAR
-- ════════════════════════════════════════════════════════════

-- Aplica a regra de uma alteração por época e mantém o histórico
-- coerente. Remover o clube CONTA como alteração.
create or replace function public.definir_clube_favorito(p_team_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user      uuid := auth.uid();
  v_season    uuid;
  v_atual     record;
  v_alteracoes int;
begin
  if v_user is null then
    return json_build_object('ok', false, 'erro', 'Sem sessão iniciada.');
  end if;

  select id into v_season from public.seasons where is_current = true limit 1;

  select * into v_atual from public.user_favourite_team_history
   where user_id = v_user and valido_ate is null;

  -- Primeira escolha: não conta como alteração
  if v_atual is null then
    insert into public.user_favourite_team_history (user_id, team_id, season_id, inicial)
    values (v_user, p_team_id, v_season, true);
    update public.profiles set favourite_team_id = p_team_id where id = v_user;
    return json_build_object('ok', true, 'inicial', true);
  end if;

  if v_atual.team_id is not distinct from p_team_id then
    return json_build_object('ok', true, 'sem_alteracao', true);
  end if;

  select count(*) into v_alteracoes
    from public.user_favourite_team_history
   where user_id = v_user and season_id = v_season and inicial = false;

  if v_alteracoes >= 1 then
    return json_build_object('ok', false,
      'erro', 'Já alteraste o teu clube favorito esta época.');
  end if;

  update public.user_favourite_team_history
     set valido_ate = now()
   where user_id = v_user and valido_ate is null;

  insert into public.user_favourite_team_history (user_id, team_id, season_id, inicial)
  values (v_user, p_team_id, v_season, false);

  update public.profiles set favourite_team_id = p_team_id where id = v_user;
  return json_build_object('ok', true, 'alterado', true);
end $$;

grant execute on public.definir_clube_favorito(text) to authenticated;


-- ════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ════════════════════════════════════════════════════════════
select
  (select count(*) from public.monthly_cycles)                          as ciclos_globais,
  (select count(*) from public.competition_months where cycle_id is null) as meses_por_ligar,
  (select count(*) from public.user_prefs)                              as preferencias,
  (select count(*) from public.v_acertos)                               as previsoes_avaliadas,
  (select count(*) from public.v_estilo)                                as utilizadores_com_previsoes;
-- Esperado agora: nº de meses distintos | 0 | nº de utilizadores | 0 | 0
-- As duas últimas ficam a 0 até haver jogos oficiais terminados.
