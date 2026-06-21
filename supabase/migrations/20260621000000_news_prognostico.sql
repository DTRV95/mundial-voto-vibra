-- Adiciona suporte a prognósticos na tabela de notícias
-- match_id liga o prognóstico a um jogo específico (aparece na página de votação)
ALTER TABLE news ADD COLUMN IF NOT EXISTS match_id uuid REFERENCES matches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS news_match_id_idx ON news(match_id) WHERE match_id IS NOT NULL;
