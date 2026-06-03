-- ============================================================
-- SEED: Voz do Mundial — Mundial 2026
-- Corre este script no SQL Editor do Supabase Dashboard
-- ============================================================

-- Limpar dados existentes (ordem importa por FK)
truncate table predictions restart identity cascade;
truncate table matches restart identity cascade;
truncate table teams restart identity cascade;
truncate table groups restart identity cascade;
truncate table prizes restart identity cascade;

-- ============================================================
-- GRUPOS
-- ============================================================
insert into groups (id, name) values
  ('grp-a', 'Grupo A'),
  ('grp-b', 'Grupo B'),
  ('grp-c', 'Grupo C'),
  ('grp-d', 'Grupo D'),
  ('grp-e', 'Grupo E'),
  ('grp-f', 'Grupo F'),
  ('grp-g', 'Grupo G'),
  ('grp-h', 'Grupo H');

-- ============================================================
-- EQUIPAS (32 equipas, bandeiras emoji)
-- ============================================================
insert into teams (id, name, code, flag, group_id) values
  -- Grupo A
  ('arg', 'Argentina',   'ARG', '🇦🇷', 'grp-a'),
  ('ecu', 'Equador',     'ECU', '🇪🇨', 'grp-a'),
  ('can', 'Canadá',      'CAN', '🇨🇦', 'grp-a'),
  ('mar', 'Marrocos',    'MAR', '🇲🇦', 'grp-a'),

  -- Grupo B
  ('fra', 'França',      'FRA', '🇫🇷', 'grp-b'),
  ('bel', 'Bélgica',     'BEL', '🇧🇪', 'grp-b'),
  ('mex', 'México',      'MEX', '🇲🇽', 'grp-b'),
  ('aus', 'Austrália',   'AUS', '🇦🇺', 'grp-b'),

  -- Grupo C
  ('esp', 'Espanha',     'ESP', '🇪🇸', 'grp-c'),
  ('col', 'Colômbia',    'COL', '🇨🇴', 'grp-c'),
  ('jpn', 'Japão',       'JPN', '🇯🇵', 'grp-c'),
  ('sen', 'Senegal',     'SEN', '🇸🇳', 'grp-c'),

  -- Grupo D
  ('eng', 'Inglaterra',  'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'grp-d'),
  ('ned', 'Holanda',     'NED', '🇳🇱', 'grp-d'),
  ('uru', 'Uruguai',     'URU', '🇺🇾', 'grp-d'),
  ('irn', 'Irão',        'IRN', '🇮🇷', 'grp-d'),

  -- Grupo E
  ('bra', 'Brasil',      'BRA', '🇧🇷', 'grp-e'),
  ('por', 'Portugal',    'POR', '🇵🇹', 'grp-e'),
  ('kor', 'Coreia do Sul','KOR','🇰🇷', 'grp-e'),
  ('civ', 'Costa do Marfim','CIV','🇨🇮', 'grp-e'),

  -- Grupo F
  ('ger', 'Alemanha',    'GER', '🇩🇪', 'grp-f'),
  ('usa', 'EUA',         'USA', '🇺🇸', 'grp-f'),
  ('cro', 'Croácia',     'CRO', '🇭🇷', 'grp-f'),
  ('sau', 'Arábia Saudita','SAU','🇸🇦', 'grp-f'),

  -- Grupo G
  ('ita', 'Itália',      'ITA', '🇮🇹', 'grp-g'),
  ('sui', 'Suíça',       'SUI', '🇨🇭', 'grp-g'),
  ('cmr', 'Camarões',    'CMR', '🇨🇲', 'grp-g'),
  ('srb', 'Sérvia',      'SRB', '🇷🇸', 'grp-g'),

  -- Grupo H
  ('por2', 'Polónia',    'POL', '🇵🇱', 'grp-h'),
  ('den', 'Dinamarca',   'DEN', '🇩🇰', 'grp-h'),
  ('nga', 'Nigéria',     'NGA', '🇳🇬', 'grp-h'),
  ('aut', 'Áustria',     'AUT', '🇦🇹', 'grp-h');

-- Corrigir ID duplicado de Portugal (por2 foi usado para Polónia por conflito)
update teams set id = 'pol' where id = 'por2';

-- ============================================================
-- JOGOS DE TESTE — hoje (3 jun 2026) para ver a homepage já
-- ============================================================
insert into matches (id, home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('test-1', 'bra', 'por', now() + interval '3 hours', 'grupos', 'scheduled', true),
  ('test-2', 'esp', 'fra', now() + interval '6 hours', 'grupos', 'scheduled', true);

-- ============================================================
-- FASE DE GRUPOS — Jornada 1 (11–16 jun 2026)
-- ============================================================

-- Grupo A — Jornada 1
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('arg', 'can', '2026-06-11 18:00:00+00', 'grupos', 'scheduled', false),
  ('ecu', 'mar', '2026-06-11 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo B — Jornada 1
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('fra', 'aus', '2026-06-12 18:00:00+00', 'grupos', 'scheduled', false),
  ('bel', 'mex', '2026-06-12 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo C — Jornada 1
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('esp', 'sen', '2026-06-13 18:00:00+00', 'grupos', 'scheduled', false),
  ('col', 'jpn', '2026-06-13 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo D — Jornada 1
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('eng', 'irn', '2026-06-14 18:00:00+00', 'grupos', 'scheduled', false),
  ('ned', 'uru', '2026-06-14 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo E — Jornada 1
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('bra', 'civ', '2026-06-15 18:00:00+00', 'grupos', 'scheduled', false),
  ('por', 'kor', '2026-06-15 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo F — Jornada 1
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('ger', 'sau', '2026-06-16 18:00:00+00', 'grupos', 'scheduled', false),
  ('usa', 'cro', '2026-06-16 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo G — Jornada 1
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('ita', 'cmr', '2026-06-17 18:00:00+00', 'grupos', 'scheduled', false),
  ('sui', 'srb', '2026-06-17 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo H — Jornada 1
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('den', 'nga', '2026-06-18 18:00:00+00', 'grupos', 'scheduled', false),
  ('pol', 'aut', '2026-06-18 21:00:00+00', 'grupos', 'scheduled', false);

-- ============================================================
-- FASE DE GRUPOS — Jornada 2 (19–24 jun 2026)
-- ============================================================

-- Grupo A
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('arg', 'ecu', '2026-06-19 18:00:00+00', 'grupos', 'scheduled', false),
  ('can', 'mar', '2026-06-19 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo B
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('fra', 'bel', '2026-06-20 18:00:00+00', 'grupos', 'scheduled', false),
  ('aus', 'mex', '2026-06-20 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo C
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('esp', 'jpn', '2026-06-21 18:00:00+00', 'grupos', 'scheduled', false),
  ('col', 'sen', '2026-06-21 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo D
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('eng', 'ned', '2026-06-22 18:00:00+00', 'grupos', 'scheduled', false),
  ('uru', 'irn', '2026-06-22 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo E
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('bra', 'kor', '2026-06-23 18:00:00+00', 'grupos', 'scheduled', false),
  ('por', 'civ', '2026-06-23 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo F
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('ger', 'usa', '2026-06-24 18:00:00+00', 'grupos', 'scheduled', false),
  ('cro', 'sau', '2026-06-24 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo G
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('ita', 'sui', '2026-06-25 18:00:00+00', 'grupos', 'scheduled', false),
  ('cmr', 'srb', '2026-06-25 21:00:00+00', 'grupos', 'scheduled', false);

-- Grupo H
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('den', 'pol', '2026-06-26 18:00:00+00', 'grupos', 'scheduled', false),
  ('nga', 'aut', '2026-06-26 21:00:00+00', 'grupos', 'scheduled', false);

-- ============================================================
-- FASE DE GRUPOS — Jornada 3 (27 jun–2 jul 2026)
-- (jogos simultâneos por grupo)
-- ============================================================

-- Grupo A
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('arg', 'mar', '2026-06-27 20:00:00+00', 'grupos', 'scheduled', false),
  ('can', 'ecu', '2026-06-27 20:00:00+00', 'grupos', 'scheduled', false);

-- Grupo B
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('fra', 'mex', '2026-06-28 20:00:00+00', 'grupos', 'scheduled', false),
  ('bel', 'aus', '2026-06-28 20:00:00+00', 'grupos', 'scheduled', false);

-- Grupo C
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('esp', 'col', '2026-06-29 20:00:00+00', 'grupos', 'scheduled', false),
  ('jpn', 'sen', '2026-06-29 20:00:00+00', 'grupos', 'scheduled', false);

-- Grupo D
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('eng', 'uru', '2026-06-30 20:00:00+00', 'grupos', 'scheduled', false),
  ('ned', 'irn', '2026-06-30 20:00:00+00', 'grupos', 'scheduled', false);

-- Grupo E
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('bra', 'por', '2026-07-01 20:00:00+00', 'grupos', 'scheduled', false),
  ('kor', 'civ', '2026-07-01 20:00:00+00', 'grupos', 'scheduled', false);

-- Grupo F
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('ger', 'cro', '2026-07-02 20:00:00+00', 'grupos', 'scheduled', false),
  ('usa', 'sau', '2026-07-02 20:00:00+00', 'grupos', 'scheduled', false);

-- Grupo G
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('ita', 'srb', '2026-07-03 20:00:00+00', 'grupos', 'scheduled', false),
  ('sui', 'cmr', '2026-07-03 20:00:00+00', 'grupos', 'scheduled', false);

-- Grupo H
insert into matches (home_team_id, away_team_id, kickoff_at, phase, status, voting_open) values
  ('den', 'aut', '2026-07-04 20:00:00+00', 'grupos', 'scheduled', false),
  ('pol', 'nga', '2026-07-04 20:00:00+00', 'grupos', 'scheduled', false);

-- ============================================================
-- PRÉMIOS POR FASE
-- ============================================================
insert into prizes (name, description, phase, position) values
  ('Campeão da Fase de Grupos',    'O adepto com mais pontos na fase de grupos ganha este prémio exclusivo da comunidade.', 'grupos',  1),
  ('Campeão dos Oitavos de Final', 'O adepto com mais pontos nos oitavos ganha este prémio.', 'oitavos', 1),
  ('Campeão dos Quartos de Final', 'O adepto com mais pontos nos quartos ganha este prémio.', 'quartos', 1),
  ('Campeão das Meias-Finais',     'O adepto com mais pontos nas meias-finais ganha este prémio.', 'meias',   1);

-- ============================================================
-- FIM DO SEED
-- ============================================================
