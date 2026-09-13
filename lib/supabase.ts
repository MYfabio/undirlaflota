/**
 * Client de Supabase.
 *
 * - `supabaseBrowser()` usa la clau anònima pública (només lectura restringida per RLS).
 * - `supabaseServer()` usa la clau de servei (només en rutes API, mai al client).
 *
 * Si no hi ha variables d'entorn, `isSupabaseConfigured` és false i l'app
 * funciona en mode local (partides al navegador, sense persistència).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && anonKey);

let browserClient: SupabaseClient | null = null;
export function supabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!browserClient) browserClient = createClient(url, anonKey);
  return browserClient;
}

let serverClient: SupabaseClient | null = null;
export function supabaseServer(): SupabaseClient | null {
  if (!url || !(serviceKey || anonKey)) return null;
  if (!serverClient) {
    serverClient = createClient(url, serviceKey || anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverClient;
}

/* Tipus de les taules (veure supabase/schema.sql) */
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
  state: unknown; // GameState complet (JSON)
  ships_a: unknown;
  ships_b: unknown;
  attacks_a: unknown;
  attacks_b: unknown;
  winner: string | null;
  stats_a: unknown;
  stats_b: unknown;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
}
