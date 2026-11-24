/**
 * Enllaç d'accés per correu per a docents que no tenen el Google del centre
 * (docents d'altres centres). Un sol ús; es desa només l'empremta del token.
 *
 * Només serveix per a correus que ja són docents (taula `users` validada o
 * variables d'entorn): mai dona d'alta ningú.
 */
import { createHash, createHmac, randomBytes } from "crypto";
import { buildSession, type Session } from "./auth";
import { query, type ClassroomCodeRow } from "./db";

const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3215").replace(/\/$/, "");

/** Crea un enllaç per al correu. `minuts`: 20 quan el demana el docent, 7 dies al correu d'alta. */
export async function crearEnllac(email: string, minuts: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await query("insert into enllacos_acces (token_hash, email, expira) values ($1, $2, now() + make_interval(mins => $3))", [hash(token), email, minuts]);
  await query("delete from enllacos_acces where expira < now() - interval '1 day'");
  return `${site()}/login?t=${token}`;
}

/** Enllaços creats per a aquest correu l'última hora (topall contra abusos). */
export async function enllacosRecents(email: string): Promise<number> {
  const r = await query<{ n: string }>("select count(*) as n from enllacos_acces where email = $1 and creat_el > now() - interval '1 hour'", [email]);
  return Number(r[0]?.n ?? 0);
}

/** Gasta el token i retorna el correu, o null si no val (usat, caducat o inventat). */
export async function obrirEnllac(token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const r = await query<{ email: string }>(
    "update enllacos_acces set usat_el = now() where token_hash = $1 and usat_el is null and expira > now() returning email",
    [hash(token)],
  );
  return r[0]?.email ?? null;
}

/**
 * Sessió d'un docent que entra per enllaç. No és jugador de cap classe: porta
 * una classe fictícia (`demo-…`), que les rutes del joc ja tracten com a no
 * desada, i així no comparteix classe amb ningú.
 */
export function sessioDocent(email: string): Session {
  const secret = process.env.SESSION_SECRET ?? "undirlaflota-dev-secret-canvia-me";
  const id = createHmac("sha256", secret).update(`docent:${email}`).digest("hex").slice(0, 16);
  const classe: ClassroomCodeRow = { id: "demo-DOCENT", code: "DOCENT", school: "", course: "", teacher: "", created_at: new Date(0).toISOString(), expires_at: null };
  return buildSession(classe, { id: `local-${id}`, username: email.split("@")[0].slice(0, 24) }, email);
}
