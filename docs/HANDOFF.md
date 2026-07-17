# Contexto do Projeto — Geração 2026 (handoff entre sessões)

> Documento de passagem de contexto. Última atualização: 17 julho 2026 (semana da final do Mundial).

## O que é

App de previsões do Mundial 2026 ("Uma Geração" / Geração 2026) em **https://geracao2026.com**.
- ~100+ utilizadores registados; núcleo do produto: **torneios privados entre amigos** com prémios (jantar, grade de cerveja...).
- Stack: TanStack Start + React Query + Supabase (projeto "Mundial", id `gtyelmajxifazhvqmlch`) + Cloudflare Workers.
- Deploy: **automático via GitHub Actions ao fazer push para `main`** (`.github/workflows/deploy.yml`, secret `CLOUDFLARE_API_TOKEN`).

## Como funciona hoje

- Tabelas principais: `matches` (com `phase` enum: grupos|ronda32|oitavos|quartos|meias|final, e coluna `qualifier` text para quem passa em empates), `predictions` (mercados: result_90, btts, total_25, double_chance, combo_15, exact_home/away, qualifier; coluna `points`), `profiles` (total_points, predictions_correct, predictions_made), `pools`/`pool_members` (torneios privados), `league_messages` (chat; votos de sondagem usam prefixo `POLL_VOTE:` no body), `match_analysis` (análises ScoreLab), `season_interest` (pré-registo época 26/27: competitions text[], answers jsonb).
- **Cálculo de pontos**: função SQL `calculate_match_points(match_id)` (ficheiro `supabase-score-function.sql`). Idempotente: recalcula `predictions.points` do jogo e depois recalcula `profiles.total_points`/`predictions_correct` **do zero via SUM(predictions.points)** — nunca duplica. Qualifier automático quando há vencedor aos 90 min; manual (admin) em empates. Pontuação: 90min 3/4, btts 2, 2.5 golos 2, dupla 1, combo1.5 4, exato 10, qualificar 4. Mercado 3.5 foi REMOVIDO.
- Fase de grupos: pontos foram reiniciados no início do mata-mata (predictions da fase grupos têm points=0). Rankings atuais = só mata-mata.
- Admin (`/admin`): criar jogos, meter resultados (com dropdown de qualificado se empate em mata-mata), "Calcular pts" por jogo, filtro por fase.
- Jogos são inseridos manualmente (admin ou SQL). Resultados idem. **Dor operacional nº 1 — automatizar na próxima época.**

## Estado atual (semana da final)

- Meias feitas; faltam: 3º lugar **França–Inglaterra sáb 18/07 22h00** e final **Espanha–Argentina dom 19/07 20h00** (ambos phase `final`, já inseridos).
- No card do 3º lugar o label mostra "3º Lugar" (detecção hardcoded França+Inglaterra em `MatchCard.tsx` e `jogo.$id.tsx`); mercado qualifier chama-se "Ficar em 3º lugar" (3º lugar), "Campeão do Mundo" (final), "Qualificar" (resto).
- Homepage: hero com stats ao vivo, card "Os meus pontos" por jogo (com drawer de detalhe por mercado), lembrete "jogos por votar" com urgência, banner "A GRANDE FINAL" (liga ao jogo da final), card "A tua jornada" (agradecimento + partilha), **pop-up de pré-registo da época 26/27** (questionário 4 passos, grava em `season_interest`, reaparece até ser completado).
- Após a final: prometido ao utilizador um "encerramento" (pódio final, hall of fame, despedida) — ainda não construído.

## Plano acordado para a época 2026/27

Decisões de estratégia (conversadas com o David):
1. **Menos research, mais construção.** Lançar meados de agosto com **Liga Portugal + Champions apenas**.
2. **Nada visível no site** até decidirmos lançar — construir fundação por baixo do capô.
3. Feature de lançamento: **palpites de época** (campeão, top 4, artilheiro).
4. **Automatizar jogos/resultados via API** (football-data.org vs API-Football — por decidir).
5. Modelo multi-competição proposto (por implementar): tabela `competitions` (slug, name, format, status), `matches.competition_id` + `round_number`/`round_label` (substitui enum de fases), `user_competition_stats` (pontos por competição, recalculados do zero), `pools.competition_id`, Mundial arquivado como competição `mundial-2026` (Hall of Fame). Selector de competição no frontend (quando lançar).
6. Referência de produto que o David gosta: **academiadasapostas.com** (estatísticas + antevisões + prognósticos por competição).

## ScoreLab

- Repositório: `dtrv95/scorelab-analytics` (explorar nesta sessão nova).
- No site atual: "Previsão ScoreLab" na página de jogo (colapsável, via `match_analysis`), análises nas notícias, branding "Powered by ScoreLab".
- Objetivo: perceber o que o ScoreLab faz e desenhar pipeline: API de resultados → ScoreLab gera análise/estatísticas → publica no site automaticamente. Potencial hub de estatísticas por equipa/competição estilo Academia das Apostas.

## Notas operacionais

- Supabase MCP às vezes está ligado nesta plataforma (permite executar SQL direto); caso contrário, dar SQL ao David para correr no SQL Editor.
- Emails dos utilizadores existem na base (auth.users) — interesse futuro em newsletter semanal por jornada.
- Instagram do projeto: ~80 seguidores. Decisão: não anunciar a época publicamente até ter produto; no domingo da final só celebração + teaser.
- Ver respostas do pré-registo: `SELECT pr.display_name, si.competitions, si.answers FROM season_interest si JOIN profiles pr ON pr.id = si.user_id ORDER BY si.created_at DESC;`
