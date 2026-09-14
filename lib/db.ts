/**
 * Base de dades: PostgreSQL a Railway (variable DATABASE_URL).
 *
 * - Sense DATABASE_URL, `isDbConfigured` és false i l'app funciona en mode local.
 * - Les taules es creen automàticament la primera vegada (`ensureSchema`), com a aulaia.cat.
 * - Sempre prepared statements (paràmetres $1, $2...). Només s'usa a rutes API (servidor).
 */
import { Pool, type QueryResultRow } from "pg";

const url = process.env.DATABASE_URL ?? "";
export const isDbConfigured = Boolean(url);

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getPool(): Pool | null {
  if (!isDbConfigured) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      max: 5,
      ssl: url.includes("railway") || url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

const SCHEMA = `
create extension if not exists "pgcrypto";
create table if not exists classroom_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  school text not null,
  course text not null,
  teacher text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references classroom_codes(id) on delete cascade,
  username text not null,
  email text,
  joined_at timestamptz not null default now(),
  unique (code_id, username)
);
create table if not exists games (
  id text primary key,
  player_a text not null,
  player_b text,
  status text not null default 'active' check (status in ('waiting','active','finished','abandoned')),
  mode text not null default 'local',
  state jsonb,
  ships_a jsonb, ships_b jsonb, attacks_a jsonb, attacks_b jsonb,
  winner text,
  stats_a jsonb, stats_b jsonb,
  memorable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists games_player_a_idx on games(player_a);
create index if not exists games_player_b_idx on games(player_b);
create index if not exists games_status_idx on games(status);
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references games(id) on delete cascade,
  player_id text not null,
  code_id uuid references classroom_codes(id) on delete set null,
  username text not null,
  won boolean not null,
  accuracy int not null, hits int not null, shots int not null, sunk int not null, unique_xy int not null,
  created_at timestamptz not null default now(),
  unique (game_id, player_id)
);
create index if not exists scores_code_idx on scores(code_id);
insert into classroom_codes (code, school, course, teacher, expires_at)
values ('ESO3A-2026', 'Institut Escola Industrial', '3r ESO A', 'Fabio', now() + interval '1 year')
on conflict (code) do nothing;
`;

/** Crea les taules si no existeixen (una sola vegada per procés). */
export function ensureSchema(): Promise<void> {
  const p = getPool();
  if (!p) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = p.query(SCHEMA).then(() => undefined).catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

/** Executa una consulta amb paràmetres. Retorna [] si no hi ha BD. */
export async function query<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const p = getPool();
  if (!p) return [];
  await ensureSchema();
  const res = await p.query<T>(sql, params);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/* Tipus de les taules */
export interface ClassroomCodeRow {
  id: string;
  code: string;
  school: string;
  course: string;
  teacher: string;
  created_at: string;
  expires_at: string | null;
}

export interface PlayerRow {
  id: string;
  code_id: string;
  username: string;
  email: string | null;
  joined_at: string;
}

export interface GameRow {
  id: string;
  player_a: string;
  player_b: string | null;
  status: "waiting" | "active" | "finished" | "abandoned";
  mode: string;
  state: unknown;
  winner: string | null;
  stats_a: unknown;
  stats_b: unknown;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
}
