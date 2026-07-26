-- ============================================================
-- INSCRIÇÃO EM COMPETIÇÕES — Época 2026/27
-- Cada utilizador escolhe as competições que quer seguir.
-- Aditivo: não afeta nada do que já existe.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_competitions (
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, competition_id)
);

CREATE INDEX IF NOT EXISTS idx_user_competitions_user ON public.user_competitions(user_id);

ALTER TABLE public.user_competitions ENABLE ROW LEVEL SECURITY;

-- Cada utilizador gere apenas as suas inscrições
DROP POLICY IF EXISTS "uc_select_own" ON public.user_competitions;
CREATE POLICY "uc_select_own" ON public.user_competitions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "uc_insert_own" ON public.user_competitions;
CREATE POLICY "uc_insert_own" ON public.user_competitions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "uc_delete_own" ON public.user_competitions;
CREATE POLICY "uc_delete_own" ON public.user_competitions
  FOR DELETE USING (user_id = auth.uid());
