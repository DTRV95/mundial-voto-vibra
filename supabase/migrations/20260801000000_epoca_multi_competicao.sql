-- ============================================================
-- FUNDAÇÃO MULTI-COMPETIÇÃO — Época 2026/27
-- Tudo ADITIVO: não altera nem parte o site live (Mundial).
-- Correr no Supabase SQL Editor.
-- ============================================================

-- 1. Tabela de competições ----------------------------------
CREATE TABLE IF NOT EXISTS public.competitions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  short_name  text,
  emoji       text,
  -- 'liga' = só jornadas | 'liga_mata_mata' = fase liga + eliminatórias (Champions)
  format      text NOT NULL DEFAULT 'liga',
  -- 'upcoming' | 'active' | 'finished'
  status      text NOT NULL DEFAULT 'upcoming',
  season      text,               -- ex: '2026/27'
  sort_order  int DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "competitions_read" ON public.competitions;
CREATE POLICY "competitions_read" ON public.competitions
  FOR SELECT USING (true);

-- 2. Ligar jogos a competições e a jornadas -----------------
-- Colunas nullable: os jogos do Mundial ficam com competition_id NULL
-- e continuam a funcionar exatamente como hoje (via `phase`).
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS competition_id uuid REFERENCES public.competitions(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS round_number int;     -- nº da jornada / ronda
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS round_label  text;    -- ex: "Jornada 8", "Meias-Finais"

CREATE INDEX IF NOT EXISTS idx_matches_competition ON public.matches(competition_id, round_number);

-- 3. Ligar torneios privados a competições ------------------
ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS competition_id uuid REFERENCES public.competitions(id);

-- 4. Seed das competições do lançamento ---------------------
INSERT INTO public.competitions (slug, name, short_name, emoji, format, status, season, sort_order)
VALUES
  ('liga-portugal', 'Liga Portugal',    'Liga',      '🇵🇹', 'liga',           'upcoming', '2026/27', 1),
  ('champions',     'Champions League', 'Champions', '⭐', 'liga_mata_mata', 'upcoming', '2026/27', 2)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Notas:
-- • Nada acima altera dados existentes. O site live não vê estas
--   colunas/tabelas e continua igual.
-- • Quando quisermos, criamos também a competição 'mundial-2026'
--   (status 'finished') e associamos os jogos antigos — mas só
--   no momento do corte, para o Hall of Fame.
-- ============================================================
