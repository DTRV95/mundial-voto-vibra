CREATE TABLE IF NOT EXISTS prognosticos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  suggestion      text NOT NULL,
  summary         text,
  bullet_points   jsonb DEFAULT '[]',
  main_trend      text,
  attention_point text,
  published       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prognosticos_match_id_idx ON prognosticos(match_id);

ALTER TABLE prognosticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerir prognósticos"
  ON prognosticos FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Prognósticos publicados são públicos"
  ON prognosticos FOR SELECT
  USING (published = true);
