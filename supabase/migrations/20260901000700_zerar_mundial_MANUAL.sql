-- ============================================================
-- FASE 9b — Zerar os pontos do Mundial (época 2026/27 a começar)
--
-- ⚠️  NÃO CORRAS ISTO ANTES DE:
--     1. Teres corrido `sql-epoca-fase9-arquivo-mundial.sql`
--     2. Confirmares que o pódio ficou lá (a verificação abaixo)
--
-- Depois disto, `profiles.total_points` fica a zero. A história do
-- Mundial NÃO se perde — vive em `mundial_2026_classificacao`,
-- `hall_of_fame`, `phase_results` e nas medalhas.
-- ============================================================

-- ── 1. Travão de segurança ───────────────────────────────────
--    Recusa-se a zerar se o arquivo estiver vazio.
do $$
declare arquivados int;
begin
  select count(*) into arquivados from public.mundial_2026_classificacao;
  if arquivados = 0 then
    raise exception
      'ARQUIVO VAZIO — corre primeiro sql-epoca-fase9-arquivo-mundial.sql. Nada foi alterado.';
  end if;
  raise notice 'Arquivo com % adeptos. A prosseguir.', arquivados;
end $$;

-- ── 2. Cópia de segurança dos perfis, tal como estão agora ───
create table if not exists public.backup_profiles_pre_epoca_2027 as
  select *, now() as copiado_em from public.profiles;

-- ── 3. Zerar os contadores da época ──────────────────────────
--    As previsões e os pontos de cada previsão NÃO são apagados.
--    Só se zeram os contadores acumulados no perfil.
update public.profiles set
  total_points        = 0,
  predictions_made    = 0,
  predictions_correct = 0,
  previous_rank       = null;

-- ── 4. Conferir ──────────────────────────────────────────────
select
  (select count(*) from public.profiles where total_points > 0)       as perfis_com_pontos,
  (select count(*) from public.mundial_2026_classificacao)            as mundial_arquivado,
  (select count(*) from public.user_badges)                           as medalhas,
  (select count(*) from public.backup_profiles_pre_epoca_2027)        as copia_seguranca;
-- Esperado: 0 | >0 | >0 | >0
