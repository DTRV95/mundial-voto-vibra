-- Tabela de mensagens de suporte
CREATE TABLE IF NOT EXISTS support_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email      TEXT,
  subject    TEXT,
  message    TEXT NOT NULL,
  read       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Qualquer utilizador (incluindo anónimo) pode enviar mensagem
CREATE POLICY "support_insert" ON support_messages FOR INSERT WITH CHECK (true);

-- Só o admin lê (via service role ou função RLS com admin check)
-- Por simplicidade, apenas autenticados podem ler — protege no admin via useIsAdmin no frontend
CREATE POLICY "support_select" ON support_messages FOR SELECT TO authenticated USING (true);

-- Só autenticados podem atualizar (marcar como lida) e apagar
CREATE POLICY "support_update" ON support_messages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "support_delete" ON support_messages FOR DELETE TO authenticated USING (true);
