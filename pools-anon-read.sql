-- Permitir leitura de ligas (pools) para utilizadores não autenticados
DROP POLICY IF EXISTS "pools_select" ON pools;
CREATE POLICY "pools_select" ON pools FOR SELECT USING (true);
