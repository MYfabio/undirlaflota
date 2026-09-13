/**
 * Autenticació per codi de classe (patró MatEscac / aulaia).
 *
 * No hi ha contrasenyes: el docent crea un codi (ex. ESO3A-2026) i l'alumne
 * entra amb codi + nom d'usuari. La sessió es guarda en una cookie signada
 * (HMAC) que conté { playerId, username, codeId, code, school, course }.
 *
 * Sense Supabase: s'accepten els codis de la variable DEMO_CLASS_CODES
 * (o "DEMO-2026" per defecte) i el playerId és derivat del nom.
 */
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { supabaseServer, type ClassroomCodeRow } from "./supabase";

export const SESSION_COOKIE = "undirlaflota_session";
const SECRET = process.env.SESSION_SECRET ?? "undirlaflota-dev-secret-canvia-me";
const SESSION_DAYS = 30;

export interface Session {
  playerId: string;
  username: string;
  codeId: string;
  code: string;
  school: string;
  course: string;
  teacher: string;
  exp: number;
}

export const CODE_REGEX = /^[A-Z0-9]{2,10}-[A-Z0-9]{2,8}$/;
export const USERNAME_REGEX = /^[\p{L}\p{N} _.-]{2,24}$/u;

export function normalizeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function demoCodes(): ClassroomCodeRow[] {
  const list = (process.env.DEMO_CLASS_CODES ?? "DEMO-2026").split(",").map(normalizeCode).filter(Boolean);
  return list.map((code) => ({
    id: `demo-${code}`,
    code,
    school: "Institut Escola Industrial",
    course: "Demo",
    teacher: "Docent",
    created_at: new Date(0).toISOString(),
    expires_at: null,
  }));
}

/** Busca un codi de classe vàlid i no caducat. */
export async function findClassroomCode(raw: string): Promise<ClassroomCodeRow | null> {
  const code = normalizeCode(raw);
  if (!CODE_REGEX.test(code)) return null;
  const sb = supabaseServer();
  if (sb) {
    const { data } = await sb.from("classroom_codes").select("*").eq("code", code).maybeSingle();
    if (data) {
      const row = data as ClassroomCodeRow;
      if (row.expires_at && new Date(row.expires_at) < new Date()) return null;
      return row;
    }
  }
  return demoCodes().find((c) => c.code === code) ?? null;
}

/** Registra (o recupera) el jugador dins la classe. */
export async function upsertPlayer(codeRow: ClassroomCodeRow, username: string): Promise<{ id: string; username: string }> {
  const name = username.trim();
  const sb = supabaseServer();
  if (sb && !codeRow.id.startsWith("demo-")) {
    const { data: existing } = await sb
      .from("players")
      .select("id, username")
      .eq("code_id", codeRow.id)
      .ilike("username", name)
      .maybeSingle();
    if (existing) return existing as { id: string; username: string };
    const { data, error } = await sb.from("players").insert({ code_id: codeRow.id, username: name }).select("id, username").single();
    if (error) throw new Error(error.message);
    return data as { id: string; username: string };
  }
  // Mode local: id determinista a partir del codi i el nom
  const id = createHmac("sha256", SECRET).update(`${codeRow.code}:${name.toLowerCase()}`).digest("hex").slice(0, 16);
  return { id: `local-${id}`, username: name };
}

/* ───────────── Cookie signada ───────────── */

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function encodeSession(s: Session): string {
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (s.exp < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

export function buildSession(codeRow: ClassroomCodeRow, player: { id: string; username: string }): Session {
  return {
    playerId: player.id,
    username: player.username,
    codeId: codeRow.id,
    code: codeRow.code,
    school: codeRow.school,
    course: codeRow.course,
    teacher: codeRow.teacher,
    exp: Date.now() + SESSION_DAYS * 86400_000,
  };
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  };
}
