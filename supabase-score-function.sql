-- ============================================================
-- FUNÇÃO: calculate_match_points
-- Idempotente — pode correr várias vezes sem duplicar pontos.
-- Qualifier automático quando há vencedor direto (não empate).
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_match_points(p_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_match     record;
  v_pred      record;
  v_pts       int;
  v_correct   int;
  v_home      int;
  v_away      int;
  v_total     int;
  v_res90     text;
  v_btts      text;
  v_t25       text;
  v_d1x       bool;
  v_dx2       bool;
  v_qualifier text;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  IF v_match IS NULL THEN RAISE EXCEPTION 'Jogo não encontrado'; END IF;
  IF v_match.home_score IS NULL THEN RAISE EXCEPTION 'Resultado não inserido'; END IF;

  v_home  := v_match.home_score;
  v_away  := v_match.away_score;
  v_total := v_home + v_away;

  -- Resultado e qualifier
  IF v_home > v_away THEN
    v_res90     := 'home';
    v_qualifier := 'home';         -- vitória direta: qualifier óbvio
  ELSIF v_home < v_away THEN
    v_res90     := 'away';
    v_qualifier := 'away';         -- vitória direta: qualifier óbvio
  ELSE
    v_res90     := 'draw';
    v_qualifier := v_match.qualifier; -- empate: definido manualmente no admin
  END IF;

  v_btts := CASE WHEN v_home > 0 AND v_away > 0 THEN 'yes' ELSE 'no' END;
  v_t25  := CASE WHEN v_total > 2 THEN 'over' ELSE 'under' END;
  v_d1x  := v_res90 IN ('home','draw');
  v_dx2  := v_res90 IN ('draw','away');

  -- Subtrair pontos antigos deste jogo dos perfis (revert idempotente)
  UPDATE profiles p
  SET total_points        = GREATEST(0, p.total_points - COALESCE(pr.points, 0)),
      predictions_correct = GREATEST(0, p.predictions_correct - CASE WHEN COALESCE(pr.points,0) > 0 THEN 1 ELSE 0 END),
      updated_at          = now()
  FROM predictions pr
  WHERE pr.match_id = p_match_id AND pr.user_id = p.id AND COALESCE(pr.points, 0) != 0;

  -- Zerar previsões deste jogo
  UPDATE predictions SET points = 0 WHERE match_id = p_match_id;

  FOR v_pred IN SELECT * FROM predictions WHERE match_id = p_match_id LOOP
    v_pts := 0; v_correct := 0;

    -- Resultado 90 min: vitória = 3 pts, empate = 4 pts
    IF v_pred.result_90 IS NOT NULL AND v_pred.result_90 = v_res90 THEN
      v_correct := v_correct + 1;
      IF v_res90 = 'draw' THEN v_pts := v_pts + 4; ELSE v_pts := v_pts + 3; END IF;
    END IF;

    -- Ambas marcam: 2 pts
    IF v_pred.btts IS NOT NULL AND v_pred.btts = v_btts THEN
      v_correct := v_correct + 1; v_pts := v_pts + 2;
    END IF;

    -- Mais/Menos 2.5: 2 pts
    IF v_pred.total_25 IS NOT NULL AND v_pred.total_25 = v_t25 THEN
      v_correct := v_correct + 1; v_pts := v_pts + 2;
    END IF;

    -- Dupla hipótese: 1 pt
    IF v_pred.double_chance IS NOT NULL THEN
      IF (v_pred.double_chance = '1x' AND v_d1x) OR (v_pred.double_chance = 'x2' AND v_dx2) THEN
        v_correct := v_correct + 1; v_pts := v_pts + 1;
      END IF;
    END IF;

    -- Resultado exato: 10 pts
    IF v_pred.exact_home IS NOT NULL AND v_pred.exact_away IS NOT NULL THEN
      IF v_pred.exact_home = v_home AND v_pred.exact_away = v_away THEN
        v_correct := v_correct + 1; v_pts := v_pts + 10;
      END IF;
    END IF;

    -- Combinação 1X/X2 + 1.5 golos: 4 pts
    IF v_pred.combo_15 IS NOT NULL THEN
      DECLARE v_ok bool := false; v_o15 bool := v_total > 1;
      BEGIN
        CASE v_pred.combo_15
          WHEN '1x_over'  THEN v_ok := v_d1x AND v_o15;
          WHEN '1x_under' THEN v_ok := v_d1x AND NOT v_o15;
          WHEN 'x2_over'  THEN v_ok := v_dx2 AND v_o15;
          WHEN 'x2_under' THEN v_ok := v_dx2 AND NOT v_o15;
          ELSE NULL;
        END CASE;
        IF v_ok THEN v_correct := v_correct + 1; v_pts := v_pts + 4; END IF;
      END;
    END IF;

    -- Qualificar: 4 pts
    -- Automático se há vencedor direto; manual se empate (definido no admin)
    IF v_qualifier IS NOT NULL AND v_pred.qualifier IS NOT NULL AND v_pred.qualifier = v_qualifier THEN
      v_correct := v_correct + 1; v_pts := v_pts + 4;
    END IF;

    UPDATE predictions SET points = v_pts WHERE id = v_pred.id;
    UPDATE profiles SET
      total_points        = total_points + v_pts,
      predictions_correct = predictions_correct + v_correct,
      updated_at          = now()
    WHERE id = v_pred.user_id;
  END LOOP;

  UPDATE matches SET status = 'finished', voting_open = false WHERE id = p_match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_match_points(uuid) TO service_role;
