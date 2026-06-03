-- ============================================================
-- Adicionar tabela match_analysis (probabilidades ScoreLab)
-- Corre no SQL Editor do Supabase
-- ============================================================

create table match_analysis (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references matches(id) on delete cascade,
  -- Resultado 90 min
  prob_home  int not null default 0,
  prob_draw  int not null default 0,
  prob_away  int not null default 0,
  -- Ambas marcam
  prob_btts_yes  int not null default 0,
  prob_btts_no   int not null default 0,
  -- Total 2.5
  prob_over25    int not null default 0,
  prob_under25   int not null default 0,
  -- Total 3.5
  prob_over35    int not null default 0,
  prob_under35   int not null default 0,
  -- Dupla hipótese
  prob_1x   int not null default 0,
  prob_x2   int not null default 0,
  -- Combo 1.5
  prob_combo15_1x_over   int not null default 0,
  prob_combo15_1x_under  int not null default 0,
  prob_combo15_x2_over   int not null default 0,
  prob_combo15_x2_under  int not null default 0,
  -- Combo 3.5
  prob_combo35_1x_over   int not null default 0,
  prob_combo35_1x_under  int not null default 0,
  prob_combo35_x2_over   int not null default 0,
  prob_combo35_x2_under  int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(match_id)
);

alter table match_analysis enable row level security;
create policy "analysis_select" on match_analysis for select using (true);
create policy "analysis_admin"  on match_analysis for all using (has_role('admin', auth.uid()));
