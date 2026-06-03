-- ============================================================
-- SCHEMA: Voz do Mundial
-- Corre este script PRIMEIRO no SQL Editor do Supabase
-- ============================================================

-- Enums
create type app_role    as enum ('admin', 'user');
create type match_phase as enum ('grupos', 'oitavos', 'quartos', 'meias', 'final');
create type match_status as enum ('scheduled', 'live', 'finished');

-- Grupos
create table groups (
  id         text primary key default gen_random_uuid()::text,
  name       text not null,
  created_at timestamptz default now()
);

-- Equipas
create table teams (
  id         text primary key default gen_random_uuid()::text,
  name       text not null,
  code       text,
  flag       text,
  group_id   text references groups(id) on delete set null,
  created_at timestamptz default now()
);

-- Jogos
create table matches (
  id           uuid primary key default gen_random_uuid(),
  home_team_id text not null references teams(id),
  away_team_id text not null references teams(id),
  kickoff_at   timestamptz not null,
  phase        match_phase not null default 'grupos',
  status       match_status not null default 'scheduled',
  voting_open  boolean not null default false,
  home_score   int,
  away_score   int,
  created_at   timestamptz default now()
);

-- Perfis de utilizador
create table profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text,
  username            text unique,
  avatar_url          text,
  total_points        int not null default 0,
  predictions_made    int not null default 0,
  predictions_correct int not null default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Previsões
create table predictions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  match_id      uuid not null references matches(id) on delete cascade,
  result_90     text,
  btts          text,
  total_25      text,
  total_35      text,
  double_chance text,
  exact_home    int,
  exact_away    int,
  combo_15      text,
  combo_35      text,
  points        int not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id, match_id)
);

-- Prémios
create table prizes (
  id          uuid primary key default gen_random_uuid(),
  phase       match_phase not null,
  position    int not null default 1,
  name        text not null,
  description text,
  image_url   text,
  created_at  timestamptz default now()
);

-- Roles de admin
create table user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       app_role not null default 'user',
  created_at timestamptz default now(),
  unique(user_id, role)
);

-- ============================================================
-- FUNÇÃO: verificar se utilizador é admin
-- ============================================================
create or replace function has_role(_role app_role, _user_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- ============================================================
-- TRIGGER: criar perfil automaticamente ao registar
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- FUNÇÃO: calcular pontos de um jogo
-- ============================================================
create or replace function calculate_match_points(p_match_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_match        record;
  v_pred         record;
  v_pts          int;
  v_correct      int;
  v_home_goals   int;
  v_away_goals   int;
  v_result_90    text;
  v_btts         text;
  v_total_25     text;
  v_total_35     text;
  v_double_1x    bool;
  v_double_x2    bool;
  v_total_goals  int;
begin
  select * into v_match from matches where id = p_match_id;
  if v_match is null then raise exception 'Jogo não encontrado: %', p_match_id; end if;
  if v_match.home_score is null or v_match.away_score is null then
    raise exception 'Resultado ainda não inserido para o jogo %', p_match_id;
  end if;

  v_home_goals  := v_match.home_score;
  v_away_goals  := v_match.away_score;
  v_total_goals := v_home_goals + v_away_goals;

  if v_home_goals > v_away_goals then v_result_90 := 'home';
  elsif v_home_goals = v_away_goals then v_result_90 := 'draw';
  else v_result_90 := 'away'; end if;

  v_btts     := case when v_home_goals > 0 and v_away_goals > 0 then 'yes' else 'no' end;
  v_total_25 := case when v_total_goals > 2 then 'over' else 'under' end;
  v_total_35 := case when v_total_goals > 3 then 'over' else 'under' end;
  v_double_1x := v_result_90 in ('home', 'draw');
  v_double_x2 := v_result_90 in ('draw', 'away');

  for v_pred in select * from predictions where match_id = p_match_id loop
    v_pts     := 0;
    v_correct := 0;

    if v_pred.result_90 is not null and v_pred.result_90 = v_result_90 then
      v_correct := v_correct + 1;
      v_pts := v_pts + case when v_result_90 = 'draw' then 4 else 3 end;
    end if;

    if v_pred.btts is not null and v_pred.btts = v_btts then
      v_correct := v_correct + 1; v_pts := v_pts + 2;
    end if;

    if v_pred.total_25 is not null and v_pred.total_25 = v_total_25 then
      v_correct := v_correct + 1; v_pts := v_pts + 2;
    end if;

    if v_pred.total_35 is not null and v_pred.total_35 = v_total_35 then
      v_correct := v_correct + 1; v_pts := v_pts + 3;
    end if;

    if v_pred.double_chance is not null then
      if (v_pred.double_chance = '1x' and v_double_1x) or (v_pred.double_chance = 'x2' and v_double_x2) then
        v_correct := v_correct + 1; v_pts := v_pts + 1;
      end if;
    end if;

    if v_pred.exact_home is not null and v_pred.exact_away is not null then
      if v_pred.exact_home = v_home_goals and v_pred.exact_away = v_away_goals then
        v_correct := v_correct + 1; v_pts := v_pts + 10;
      end if;
    end if;

    if v_pred.combo_15 is not null then
      declare v_ok bool := false; v_over15 bool := v_total_goals > 1; begin
        case v_pred.combo_15
          when '1x_over'  then v_ok := v_double_1x and v_over15;
          when '1x_under' then v_ok := v_double_1x and not v_over15;
          when 'x2_over'  then v_ok := v_double_x2 and v_over15;
          when 'x2_under' then v_ok := v_double_x2 and not v_over15;
          else null; end case;
        if v_ok then v_correct := v_correct + 1; v_pts := v_pts + 4; end if;
      end;
    end if;

    if v_pred.combo_35 is not null then
      declare v_ok bool := false; v_over35 bool := v_total_goals > 3; begin
        case v_pred.combo_35
          when '1x_over'  then v_ok := v_double_1x and v_over35;
          when '1x_under' then v_ok := v_double_1x and not v_over35;
          when 'x2_over'  then v_ok := v_double_x2 and v_over35;
          when 'x2_under' then v_ok := v_double_x2 and not v_over35;
          else null; end case;
        if v_ok then v_correct := v_correct + 1; v_pts := v_pts + 5; end if;
      end;
    end if;

    update predictions set points = v_pts where id = v_pred.id;
    update profiles set
      total_points        = total_points + v_pts,
      predictions_correct = predictions_correct + v_correct,
      updated_at          = now()
    where id = v_pred.user_id;
  end loop;

  update matches set status = 'finished', voting_open = false where id = p_match_id;
end;
$$;

grant execute on function calculate_match_points(uuid) to service_role;

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table profiles     enable row level security;
alter table predictions  enable row level security;
alter table matches      enable row level security;
alter table teams        enable row level security;
alter table groups       enable row level security;
alter table prizes       enable row level security;
alter table user_roles   enable row level security;

-- Profiles: utilizador vê e edita o seu próprio
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Predictions: utilizador gere as suas
create policy "predictions_select" on predictions for select using (true);
create policy "predictions_insert" on predictions for insert with check (auth.uid() = user_id);
create policy "predictions_update" on predictions for update using (auth.uid() = user_id);

-- Matches, Teams, Groups, Prizes: leitura pública
create policy "matches_select" on matches for select using (true);
create policy "teams_select"   on teams   for select using (true);
create policy "groups_select"  on groups  for select using (true);
create policy "prizes_select"  on prizes  for select using (true);

-- Admin pode escrever em tudo
create policy "matches_admin" on matches for all using (has_role('admin', auth.uid()));
create policy "teams_admin"   on teams   for all using (has_role('admin', auth.uid()));
create policy "groups_admin"  on groups  for all using (has_role('admin', auth.uid()));
create policy "prizes_admin"  on prizes  for all using (has_role('admin', auth.uid()));
create policy "user_roles_admin" on user_roles for all using (has_role('admin', auth.uid()));
