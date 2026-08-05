-- ============================================================
-- FASE 6 — Duelos 1 contra 1
--
-- Regras combinadas:
--   Tipos:  jogo (peso 2) · jornada (peso 3) · mês (peso 6)
--   Pontos: vitória 3 · empate 1 · derrota 0, multiplicado pelo peso
--   Contexto: dentro de ligas privadas e também livres
--   Limite: no máximo 2 duelos pontuados por adversário por mês
--   Ranking de duelos separado, com reinício mensal
--   Histórico de rivalidade permanente
--
-- PRINCÍPIO DE SEMPRE: os pontos do ranking de duelos NÃO são
-- guardados. Guarda-se o RESULTADO (quem ganhou); os pontos são
-- somados na leitura, por uma vista. Impossível dobrar.
-- ============================================================

-- ── 1. Tabela de duelos ──────────────────────────────────────
create table if not exists public.duels (
  id              uuid primary key default gen_random_uuid(),

  desafiante_id   uuid not null references auth.users(id) on delete cascade,
  adversario_id   uuid not null references auth.users(id) on delete cascade,

  tipo            text not null check (tipo in ('jogo', 'jornada', 'mes')),
  competition_id  uuid not null references public.competitions(id) on delete cascade,

  -- O alvo do duelo — exatamente um destes, conforme o tipo
  match_id        uuid references public.matches(id) on delete cascade,
  round_id        uuid references public.rounds(id)  on delete cascade,
  month_id        uuid references public.competition_months(id) on delete cascade,

  -- Liga privada onde nasceu, ou nulo se foi um desafio livre
  pool_id         uuid references public.pools(id) on delete set null,

  estado          text not null default 'pendente'
                    check (estado in ('pendente','aceite','recusado','resolvido','expirado')),

  -- Preenchidos na resolução
  pontos_desafiante int,
  pontos_adversario int,
  resultado       text check (resultado in ('desafiante','adversario','empate')),
  -- false quando o duelo passou do limite de 2 por adversário nesse mês:
  -- joga-se na mesma, mas não conta para o ranking
  vale_pontos     boolean not null default true,

  criado_em       timestamptz not null default now(),
  respondido_em   timestamptz,
  resolvido_em    timestamptz,

  -- Ninguém se desafia a si próprio
  constraint duelo_contra_outro check (desafiante_id <> adversario_id),
  -- O alvo tem de bater certo com o tipo
  constraint alvo_coerente check (
    (tipo = 'jogo'    and match_id is not null and round_id is null and month_id is null) or
    (tipo = 'jornada' and round_id is not null and match_id is null and month_id is null) or
    (tipo = 'mes'     and month_id is not null and match_id is null and round_id is null)
  )
);

-- Impede o mesmo desafio duas vezes enquanto estiver por resolver
create unique index if not exists idx_duelo_unico_jogo
  on public.duels (least(desafiante_id, adversario_id), greatest(desafiante_id, adversario_id), match_id)
  where tipo = 'jogo' and estado in ('pendente','aceite');
create unique index if not exists idx_duelo_unico_jornada
  on public.duels (least(desafiante_id, adversario_id), greatest(desafiante_id, adversario_id), round_id)
  where tipo = 'jornada' and estado in ('pendente','aceite');
create unique index if not exists idx_duelo_unico_mes
  on public.duels (least(desafiante_id, adversario_id), greatest(desafiante_id, adversario_id), month_id)
  where tipo = 'mes' and estado in ('pendente','aceite');

create index if not exists idx_duels_desafiante on public.duels (desafiante_id, estado);
create index if not exists idx_duels_adversario on public.duels (adversario_id, estado);
create index if not exists idx_duels_por_resolver on public.duels (estado) where estado = 'aceite';

-- ── 2. Segurança ─────────────────────────────────────────────
alter table public.duels enable row level security;

drop policy if exists "duelos visiveis para todos" on public.duels;
create policy "duelos visiveis para todos"
  on public.duels for select using (true);

drop policy if exists "desafiar em meu nome" on public.duels;
create policy "desafiar em meu nome"
  on public.duels for insert to authenticated
  with check (
    desafiante_id = auth.uid()
    and estado = 'pendente'
    and resultado is null
    and pontos_desafiante is null
    and pontos_adversario is null
  );

-- O adversário aceita ou recusa; o desafiante pode retirar o desafio.
-- Em qualquer dos casos só se muda o estado de 'pendente'.
drop policy if exists "responder ao desafio" on public.duels;
create policy "responder ao desafio"
  on public.duels for update to authenticated
  using (estado = 'pendente' and (adversario_id = auth.uid() or desafiante_id = auth.uid()))
  with check (estado in ('aceite','recusado'));

-- ── 3. Peso de cada tipo de duelo ────────────────────────────
create or replace function public.peso_duelo(tipo text)
returns int language sql immutable as $$
  select case tipo when 'jogo' then 2 when 'jornada' then 3 when 'mes' then 6 else 0 end;
$$;

-- ── 4. Resolver os duelos cujo alvo já terminou ──────────────
create or replace function public.resolver_duelos()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  d           record;
  p_desafiante int;
  p_adversario int;
  pronto      boolean;
  ja_pontuados int;
  resolvidos  int := 0;
begin
  for d in
    select * from public.duels where estado = 'aceite' order by criado_em
  loop
    pronto := false;

    if d.tipo = 'jogo' then
      select (m.status = 'finished') into pronto
        from public.matches m where m.id = d.match_id;

      select coalesce(sum(p.points), 0) into p_desafiante
        from public.predictions p
        where p.match_id = d.match_id and p.user_id = d.desafiante_id;
      select coalesce(sum(p.points), 0) into p_adversario
        from public.predictions p
        where p.match_id = d.match_id and p.user_id = d.adversario_id;

    elsif d.tipo = 'jornada' then
      -- Pronto quando todos os jogos oficiais da jornada terminaram
      select bool_and(m.status = 'finished') into pronto
        from public.matches m
        where m.round_id = d.round_id and m.is_official = true;

      select coalesce(pontos, 0) into p_desafiante
        from public.pontos_por_jornada
        where round_id = d.round_id and user_id = d.desafiante_id;
      select coalesce(pontos, 0) into p_adversario
        from public.pontos_por_jornada
        where round_id = d.round_id and user_id = d.adversario_id;

    else -- 'mes'
      select (cm.ends_on < current_date) into pronto
        from public.competition_months cm where cm.id = d.month_id;

      select coalesce(pontos, 0) into p_desafiante
        from public.pontos_por_mes
        where month_id = d.month_id and user_id = d.desafiante_id;
      select coalesce(pontos, 0) into p_adversario
        from public.pontos_por_mes
        where month_id = d.month_id and user_id = d.adversario_id;
    end if;

    if not coalesce(pronto, false) then
      continue;
    end if;

    p_desafiante := coalesce(p_desafiante, 0);
    p_adversario := coalesce(p_adversario, 0);

    -- Limite: no máximo 2 duelos pontuados com o mesmo adversário por mês.
    -- Os que passam do limite jogam-se na mesma, mas não contam.
    select count(*) into ja_pontuados
      from public.duels x
      where x.estado = 'resolvido'
        and x.vale_pontos = true
        and date_trunc('month', x.resolvido_em) = date_trunc('month', now())
        and least(x.desafiante_id, x.adversario_id) = least(d.desafiante_id, d.adversario_id)
        and greatest(x.desafiante_id, x.adversario_id) = greatest(d.desafiante_id, d.adversario_id);

    update public.duels set
      estado            = 'resolvido',
      pontos_desafiante = p_desafiante,
      pontos_adversario = p_adversario,
      resultado         = case
                            when p_desafiante > p_adversario then 'desafiante'
                            when p_adversario > p_desafiante then 'adversario'
                            else 'empate' end,
      vale_pontos       = (ja_pontuados < 2),
      resolvido_em      = now()
    where id = d.id;

    resolvidos := resolvidos + 1;
  end loop;

  return resolvidos;
end;
$$;

grant execute on function public.resolver_duelos() to authenticated, service_role;

-- ── 5. Uma linha por participante, já com os pontos do duelo ──
create or replace view public.duelos_pontos as
select
  d.id                                as duel_id,
  d.desafiante_id                     as user_id,
  d.adversario_id                     as adversario,
  d.tipo, d.competition_id, d.pool_id,
  d.resolvido_em,
  d.vale_pontos,
  case d.resultado when 'desafiante' then 'vitoria'
                   when 'empate'     then 'empate'
                   else 'derrota' end as desfecho,
  case d.resultado when 'desafiante' then 3
                   when 'empate'     then 1
                   else 0 end * public.peso_duelo(d.tipo) as pontos
from public.duels d
where d.estado = 'resolvido'
union all
select
  d.id,
  d.adversario_id,
  d.desafiante_id,
  d.tipo, d.competition_id, d.pool_id,
  d.resolvido_em,
  d.vale_pontos,
  case d.resultado when 'adversario' then 'vitoria'
                   when 'empate'     then 'empate'
                   else 'derrota' end,
  case d.resultado when 'adversario' then 3
                   when 'empate'     then 1
                   else 0 end * public.peso_duelo(d.tipo)
from public.duels d
where d.estado = 'resolvido';

grant select on public.duelos_pontos to anon, authenticated;

-- ── 6. Ranking de duelos, por mês (reinicia todos os meses) ───
create or replace view public.ranking_duelos as
select
  user_id,
  to_char(resolvido_em, 'YYYY-MM')                            as mes,
  sum(pontos)::int                                            as pontos,
  count(*)::int                                               as duelos,
  count(*) filter (where desfecho = 'vitoria')::int            as vitorias,
  count(*) filter (where desfecho = 'empate')::int             as empates,
  count(*) filter (where desfecho = 'derrota')::int            as derrotas
from public.duelos_pontos
where vale_pontos = true
group by user_id, to_char(resolvido_em, 'YYYY-MM');

grant select on public.ranking_duelos to anon, authenticated;

-- ── 7. Rivalidades — o confronto direto, para sempre ─────────
--    Conta todos os duelos resolvidos, mesmo os que não deram pontos.
create or replace view public.rivalidades as
select
  user_id,
  adversario,
  count(*)::int                                    as duelos,
  count(*) filter (where desfecho = 'vitoria')::int as vitorias,
  count(*) filter (where desfecho = 'empate')::int  as empates,
  count(*) filter (where desfecho = 'derrota')::int as derrotas,
  max(resolvido_em)                                as ultimo_duelo
from public.duelos_pontos
group by user_id, adversario;

grant select on public.rivalidades to anon, authenticated;

-- ── 8. Resolver automaticamente, de hora a hora ──────────────
select cron.unschedule('resolver-duelos')
  where exists (select 1 from cron.job where jobname = 'resolver-duelos');

select cron.schedule(
  'resolver-duelos',
  '15 * * * *',
  $$ select public.resolver_duelos(); $$
);

-- ── Verificação ──────────────────────────────────────────────
select
  (select count(*) from public.duels)           as duelos,
  (select count(*) from public.ranking_duelos)  as linhas_ranking,
  (select public.peso_duelo('mes'))             as peso_mes;
-- Esperado: 0 | 0 | 6
