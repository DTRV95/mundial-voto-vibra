-- Garantir que predictions tem created_at (caso não exista)
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Para previsões existentes sem data, usar now() como fallback (já foi feito pelo DEFAULT)
-- Índice para performance nas queries de liga
CREATE INDEX IF NOT EXISTS idx_predictions_user_created ON predictions(user_id, created_at);
