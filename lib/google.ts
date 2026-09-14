/**
 * Entrada amb compte de Google (OAuth 2.0, sense llibreries externes).
 *
 * Flux: /api/auth/google → accounts.google.com → /api/auth/google/callback
 * Es demana només `openid email profile`. Si GOOGLE_HOSTED_DOMAIN està definit,
 * només s'accepten comptes d'aquest domini (ex. escolaindustrial.org).
 *
 * L'usuari de Google es registra com a jugador dins d'una classe automàtica
 * per domini (codi GOOGLE-<DOMINI>), de manera que pot reptar companys del
 * mateix centre. Si ja existia un jugador amb aquest correu, es reutilitza.
 */
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { isDbConfigured, query, queryOne, type ClassroomCodeRow } from "./db";

export const GOOGLE_STATE_COOKIE = "undirlaflota_gstate";

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const hostedDomain = (process.env.GOOGLE_HOSTED_DOMAIN ?? "").trim().toLowerCase();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3215";
  return { clientId, clientSecret, hostedDomain, redirectUri: `${site.replace(/\/$/, "")}/api/auth/google/callback`, enabled: Boolean(clientId && clientSecret) };
}

const SECRET = process.env.SESSION_SECRET ?? "undirlaflota-dev-secret-canvia-me";

/** Estat anti-CSRF signat: nonce.signatura */
export function newState(): string {
  const nonce = randomBytes(16).toString("hex");
  return `${nonce}.${createHmac("sha256", SECRET).update(nonce).digest("hex")}`;
}
export function checkState(state: string | null, cookie: string | undefined): boolean {
  if (!state || !cookie || state !== cookie) return false;
  const [nonce, sig] = state.split(".");
  if (!nonce || !sig) return false;
  const expected = createHmac("sha256", SECRET).update(nonce).digest("hex");
  return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function authUrl(state: string): string {
  const c = googleConfig();
  const p = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: c.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    ...(c.hostedDomain ? { hd: c.hostedDomain } : {}),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

export interface GoogleUser {
  email: string;
  name: string;
  hd?: string;
}

/** Intercanvia el codi per un token i retorna el perfil bàsic. */
export async function exchangeCode(code: string): Promise<GoogleUser> {
  const c = googleConfig();
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: c.clientId, client_secret: c.clientSecret, redirect_uri: c.redirectUri, grant_type: "authorization_code" }),
  });
  if (!tokenRes.ok) throw new Error(`Google token: ${tokenRes.status}`);
  const tok = (await tokenRes.json()) as { access_token: string };
  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tok.access_token}` } });
  if (!infoRes.ok) throw new Error(`Google userinfo: ${infoRes.status}`);
  const info = (await infoRes.json()) as { email?: string; email_verified?: boolean; name?: string; hd?: string };
  if (!info.email || info.email_verified === false) throw new Error("Correu no verificat");
  return { email: info.email.toLowerCase(), name: info.name ?? info.email.split("@")[0], hd: info.hd };
}

/** Classe automàtica per domini de correu (es crea si no existeix). */
export async function classroomForDomain(domain: string): Promise<ClassroomCodeRow> {
  const code = `GOOGLE-${domain.split(".")[0].toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "CENTRE"}`;
  if (!isDbConfigured) {
    return { id: `demo-${code}`, code, school: domain, course: "Google", teacher: "—", created_at: new Date(0).toISOString(), expires_at: null };
  }
  const existing = await queryOne<ClassroomCodeRow>("select * from classroom_codes where code = $1", [code]);
  if (existing) return existing;
  const created = await queryOne<ClassroomCodeRow>(
    "insert into classroom_codes (code, school, course, teacher) values ($1, $2, $3, $4) on conflict (code) do update set code = excluded.code returning *",
    [code, domain, "Google", "—"],
  );
  if (!created) throw new Error("No s'ha pogut crear la classe");
  return created;
}

/** Jugador per correu: si ja existeix (a qualsevol classe) el reutilitza; si no, el crea a la classe del domini. */
export async function playerForGoogle(user: GoogleUser): Promise<{ player: { id: string; username: string }; classroom: ClassroomCodeRow }> {
  const domain = user.email.split("@")[1];
  if (isDbConfigured) {
    const found = await queryOne<{ id: string; username: string; code_id: string }>("select id, username, code_id from players where lower(email) = $1 order by joined_at desc limit 1", [user.email]);
    if (found) {
      const classroom = await queryOne<ClassroomCodeRow>("select * from classroom_codes where id = $1", [found.code_id]);
      if (classroom) return { player: { id: found.id, username: found.username }, classroom };
    }
    const classroom = await classroomForDomain(domain);
    // Nom d'usuari únic dins la classe: nom de Google, amb sufix si cal
    const base = user.name.trim().slice(0, 20) || user.email.split("@")[0];
    for (let i = 0; i < 20; i++) {
      const username = i === 0 ? base : `${base} ${i + 1}`;
      const row = await queryOne<{ id: string; username: string }>(
        "insert into players (code_id, username, email) values ($1, $2, $3) on conflict (code_id, username) do nothing returning id, username",
        [classroom.id, username, user.email],
      );
      if (row) return { player: row, classroom };
    }
    throw new Error("No s'ha pogut crear el jugador");
  }
  const classroom = await classroomForDomain(domain);
  const id = createHmac("sha256", SECRET).update(`google:${user.email}`).digest("hex").slice(0, 16);
  return { player: { id: `local-${id}`, username: user.name }, classroom };
}

/** Consulta auxiliar per a proves. */
export const _query = query;
