-- Ligas privadas criadas pelos utilizadores
CREATE TABLE IF NOT EXISTS pools (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  code       TEXT UNIQUE NOT NULL,   -- código de convite curto ex: "XK92PL"
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Membros das ligas
CREATE TABLE IF NOT EXISTS pool_members (
  pool_id   UUID REFERENCES pools(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (pool_id, user_id)
);

-- RLS
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_members ENABLE ROW LEVEL SECURITY;

-- Qualquer utilizador autenticado pode ver ligas
CREATE POLICY "pools_select" ON pools FOR SELECT TO authenticated USING (true);

-- Só o criador pode criar
CREATE POLICY "pools_insert" ON pools FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Só o criador pode apagar
CREATE POLICY "pools_delete" ON pools FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Membros: qualquer um pode ver
CREATE POLICY "pool_members_select" ON pool_members FOR SELECT TO authenticated USING (true);

-- Qualquer utilizador pode entrar numa liga (inserir-se a si próprio)
CREATE POLICY "pool_members_insert" ON pool_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Só o próprio pode sair
CREATE POLICY "pool_members_delete" ON pool_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_pool_members_pool ON pool_members(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_members_user ON pool_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pools_code ON pools(code);
ALTER TABLE pools ADD COLUMN IF NOT EXISTS prize TEXT;
