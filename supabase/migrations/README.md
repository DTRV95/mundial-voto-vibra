# Migrações

Estado da base de dados, por ordem de aplicação.

Até agosto de 2026 os ficheiros SQL viviam soltos na raiz do projeto e
o registo do que tinha sido aplicado existia só na cabeça de quem os
correu. Foram movidos para aqui com prefixo de data, na ordem em que
foram efetivamente executados.

## Aplicadas

| Ficheiro | O quê |
|---|---|
| `…000000_user_competitions` | Inscrição em competições |
| `…000100_pontos_por_competicao` | Vistas de pontos por competição, mês e jornada |
| `…000200_tendencia_ranking` | Fotografia diária da posição, para a seta de tendência |
| `…000300_duelos` | Duelos 1v1, ranking mensal e rivalidades |
| `…000400_ligas_configuraveis` | Regras por liga; pontuação a partir de `conta_desde` |
| `…000500_classificacao_rotacao` | Classificação real e rotação de equipas |
| `…000600_arquivo_mundial` | Classificação final do Mundial e medalhas |
| `…000800_dna_fundacao` | `v_acertos` e vistas derivadas; ciclos mensais; clube favorito |
| `…000900_dna_perfis` | Média da comunidade e métricas de clubismo |
| `…001000_dna_contra_a_bancada` | `ver_bancada()` e o índice |
| `…001100_dna_narrativa_jornada` | Momento decisivo, previsão rara, Visionário |
| `…001200_dna_rival_missoes` | Rival simétrico e missões mensais |
| `…001300_dna_fecho_mensal` | Snapshot congelado e resumo do mês |

## Por aplicar, de propósito

**`…000700_zerar_mundial_MANUAL`** — zera `profiles.total_points`.
Não é uma migração automática: só deve correr quando a época nova
arrancar, e **depois** de `…000600_arquivo_mundial` ter guardado o
Mundial. Tem um travão que se recusa a correr sem esse arquivo.

Desde que nenhuma página lê `profiles.total_points`, correr isto passou
a ser seguro.

## Princípio

Quase tudo aqui são **vistas**, não tabelas. Os pontos, os rankings, o
DNA e as estatísticas são somados na leitura a partir de
`predictions.points`, que é a única fonte de verdade. As três exceções,
todas deliberadas:

- `ranking_snapshots` — a posição de ontem, para a seta de tendência
- `round_moments` / `round_visionaries` — apuramento da jornada, recalculável
- `user_month_snapshot` — o resumo do mês, congelado para nunca mudar

Esta regra nasceu do Mundial, onde uma coluna acumulada fez os pontos
dobrarem. Se acrescentares algo aqui, pergunta primeiro se não pode ser
calculado.

## Idempotência

Todas as migrações podem correr mais do que uma vez sem duplicar nada:
`create table if not exists`, `create or replace view`, `on conflict do
nothing`. A única com efeito destrutivo é a de zerar, e essa é manual.
