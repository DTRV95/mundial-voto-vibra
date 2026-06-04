-- ============================================================
-- TRIGGER: incrementar predictions_made no perfil
-- Corre no SQL Editor do Supabase.
-- Corrige o bug em que predictions_made ficava sempre a 0.
-- ============================================================

-- Função: incrementa predictions_made quando inserida nova previsão
create or replace function increment_predictions_made()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles
  set
    predictions_made = predictions_made + 1,
    updated_at = now()
  where id = NEW.user_id;
  return NEW;
end;
$$;

-- Trigger: só dispara em INSERT (não em UPDATE do upsert)
drop trigger if exists on_prediction_insert on public.predictions;
create trigger on_prediction_insert
  after insert on public.predictions
  for each row execute function increment_predictions_made();

-- ============================================================
-- CORRIGIR predictions_made existentes (retroativo)
-- Conta as previsões já feitas e atualiza os perfis.
-- ============================================================
update public.profiles p
set predictions_made = sub.total
from (
  select user_id, count(*) as total
  from public.predictions
  group by user_id
) sub
where p.id = sub.user_id;
