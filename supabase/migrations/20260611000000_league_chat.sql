
-- Chat das ligas
CREATE TABLE public.league_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_code text NOT NULL REFERENCES public.pools(code) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_league_messages_pool ON public.league_messages(pool_code, created_at DESC);

ALTER TABLE public.league_messages ENABLE ROW LEVEL SECURITY;

-- Só membros do pool podem ler mensagens
CREATE POLICY "league_messages_select" ON public.league_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pool_members pm
      JOIN public.pools p ON p.id = pm.pool_id
      WHERE p.code = pool_code AND pm.user_id = auth.uid()
    )
  );

-- Só membros do pool podem escrever mensagens (como o próprio user)
CREATE POLICY "league_messages_insert" ON public.league_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.pool_members pm
      JOIN public.pools p ON p.id = pm.pool_id
      WHERE p.code = pool_code AND pm.user_id = auth.uid()
    )
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.league_messages;
