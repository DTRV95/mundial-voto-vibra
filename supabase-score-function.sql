-- ============================================================
-- FUNÇÃO: calculate_match_points
-- Corre no SQL Editor do Supabase depois de inserir resultados.
-- Chama: select calculate_match_points('<match-uuid>');
-- ============================================================

create or replace function calculate_match_points(p_match_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_match        record;
  v_pred         record;
  v_pts          int;
  v_correct      int;
  v_home_goals   int;
  v_away_goals   int;
  v_result_90    text; -- 'home' | 'draw' | 'away'
  v_btts         text; -- 'yes' | 'no'
  v_total_25     text; -- 'over' | 'under'
  v_total_35     text; -- 'over' | 'under'
  v_double_1x    bool;
  v_double_x2    bool;
  v_total_goals  int;
begin
  -- Buscar o jogo e validar resultado
  select * into v_match from matches where id = p_match_id;
  if v_match is null then
    raise exception 'Jogo não encontrado: %', p_match_id;
  end if;
  if v_match.home_score is null or v_match.away_score is null then
    raise exception 'Resultado ainda não inserido para o jogo %', p_match_id;
  end if;

  v_home_goals  := v_match.home_score;
  v_away_goals  := v_match.away_score;
  v_total_goals := v_home_goals + v_away_goals;

  -- Calcular valores reais
  if v_home_goals > v_away_goals then
    v_result_90 := 'home';
  elsif v_home_goals = v_away_goals then
    v_result_90 := 'draw';
  else
    v_result_90 := 'away';
  end if;

  v_btts     := case when v_home_goals > 0 and v_away_goals > 0 then 'yes' else 'no' end;
  v_total_25 := case when v_total_goals > 2 then 'over' else 'under' end;
  v_total_35 := case when v_total_goals > 3 then 'over' else 'under' end;
  v_double_1x := v_result_90 in ('home', 'draw');
  v_double_x2 := v_result_90 in ('draw', 'away');

  -- Percorrer todas as previsões deste jogo
  for v_pred in
    select * from predictions where match_id = p_match_id
  loop
    v_pts     := 0;
    v_correct := 0;

    -- Resultado 90 min: vitória = 3 pts, empate correto = 4 pts
    if v_pred.result_90 is not null and v_pred.result_90 = v_result_90 then
      v_correct := v_correct + 1;
      if v_result_90 = 'draw' then
        v_pts := v_pts + 4;
      else
        v_pts := v_pts + 3;
      end if;
    end if;

    -- Ambas marcam: 2 pts
    if v_pred.btts is not null and v_pred.btts = v_btts then
      v_correct := v_correct + 1;
      v_pts     := v_pts + 2;
    end if;

    -- Mais/Menos 2.5: 2 pts
    if v_pred.total_25 is not null and v_pred.total_25 = v_total_25 then
      v_correct := v_correct + 1;
      v_pts     := v_pts + 2;
    end if;

    -- Mais/Menos 3.5: 3 pts
    if v_pred.total_35 is not null and v_pred.total_35 = v_total_35 then
      v_correct := v_correct + 1;
      v_pts     := v_pts + 3;
    end if;

    -- Dupla hipótese: 1 pt
    if v_pred.double_chance is not null then
      if (v_pred.double_chance = '1x' and v_double_1x) or
         (v_pred.double_chance = 'x2' and v_double_x2) then
        v_correct := v_correct + 1;
        v_pts     := v_pts + 1;
      end if;
    end if;

    -- Resultado exato: 10 pts
    if v_pred.exact_home is not null and v_pred.exact_away is not null then
      if v_pred.exact_home = v_home_goals and v_pred.exact_away = v_away_goals then
        v_correct := v_correct + 1;
        v_pts     := v_pts + 10;
      end if;
    end if;

    -- Combinação 1X/X2 + 1.5 golos: 4 pts
    if v_pred.combo_15 is not null then
      declare
        v_combo_ok bool := false;
        v_over_15  bool := v_total_goals > 1;
      begin
        case v_pred.combo_15
          when '1x_over'  then v_combo_ok := v_double_1x and v_over_15;
          when '1x_under' then v_combo_ok := v_double_1x and not v_over_15;
          when 'x2_over'  then v_combo_ok := v_double_x2 and v_over_15;
          when 'x2_under' then v_combo_ok := v_double_x2 and not v_over_15;
          else null;
        end case;
        if v_combo_ok then
          v_correct := v_correct + 1;
          v_pts     := v_pts + 4;
        end if;
      end;
    end if;

    -- Combinação 1X/X2 + 3.5 golos: 5 pts
    if v_pred.combo_35 is not null then
      declare
        v_combo_ok bool := false;
        v_over_35  bool := v_total_goals > 3;
      begin
        case v_pred.combo_35
          when '1x_over'  then v_combo_ok := v_double_1x and v_over_35;
          when '1x_under' then v_combo_ok := v_double_1x and not v_over_35;
          when 'x2_over'  then v_combo_ok := v_double_x2 and v_over_35;
          when 'x2_under' then v_combo_ok := v_double_x2 and not v_over_35;
          else null;
        end case;
        if v_combo_ok then
          v_correct := v_correct + 1;
          v_pts     := v_pts + 5;
        end if;
      end;
    end if;

    -- Atualizar previsão com pontos
    update predictions
    set points = v_pts
    where id = v_pred.id;

    -- Atualizar perfil do utilizador
    update profiles
    set
      total_points       = total_points + v_pts,
      predictions_correct = predictions_correct + v_correct,
      updated_at         = now()
    where id = v_pred.user_id;

  end loop;

  -- Marcar o jogo como terminado
  update matches
  set status = 'finished', voting_open = false
  where id = p_match_id;

end;
$$;

-- Permissão para o service_role (usado pelo admin)
grant execute on function calculate_match_points(uuid) to service_role;
