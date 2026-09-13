-- Esquema Supabase per a Undirlaflota
-- Executa aquest fitxer a l'SQL Editor del projecte Supabase.

create extension if not exists "pgcrypto";

-- Codis de classe (els crea el docent)
create table if not exists classroom_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,            -- ex: ESO3A-2026
  school text not null,                 -- ex: Institut Escola Industrial
  course text not null,                 -- ex: 3r ESO B
  teacher text not null,                -- ex: Fabio
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- Alumnat registrat amb un codi
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references classroom_codes(id) on delete cascade,
  username text not null,
  email text,
  joined_at timestamptz not null default now(),
  unique (code_id, username)
);

-- Partides
create table if not exists games (
  id text primary key,                  -- id generat pel motor (g-xxxx)
  player_a text not null,               -- id del jugador (uuid o local-xxx)
  player_b text,                        -- null mentre s'espera rival (online)
  status text not null default 'active' check (status in ('waiting','active','finished','abandoned')),
  mode text not null default 'local',   -- local | ai | online | tutorial
  state jsonb,                          -- GameState complet
  ships_a jsonb,
  ships_b jsonb,
  attacks_a jsonb,
  attacks_b jsonb,
  winner text,
  stats_a jsonb,
  stats_b jsonb,
  memorable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists games_player_a_idx on games(player_a);
create index if not exists games_player_b_idx on games(player_b);
create index if not exists games_status_idx on games(status);

-- Puntuacions agregades (una fila per partida acabada i jugador)
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references games(id) on delete cascade,
  player_id text not null,
  code_id uuid references classroom_codes(id) on delete set null,
  username text not null,
  won boolean not null,
  accuracy int not null,
  hits int not null,
  shots int not null,
  sunk int not null,
  unique_xy int not null,
  created_at timestamptz not null default now()
);

create index if not exists scores_code_idx on scores(code_id);

-- RLS: les rutes API usen la clau de servei; el client anònim no toca res.
alter table classroom_codes enable row level security;
alter table players enable row level security;
alter table games enable row level security;
alter table scores enable row level security;

-- Codi de demostració
insert into classroom_codes (code, school, course, teacher, expires_at)
values ('ESO3A-2026', 'Institut Escola Industrial', '3r ESO A', 'Fabio', now() + interval '1 year')
on conflict (code) do nothing;
