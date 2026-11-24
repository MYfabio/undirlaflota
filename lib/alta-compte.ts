import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Ordre «alta de compte» que arriba d'aulaia.cat a través d'n8n quan el
 * propietari valida una sol·licitud al panell (contracte comú de les apps).
 * Lògica pura: ni base de dades ni xarxa.
 *
 * Cos: { id_alta, data (ISO), centre, idioma, usuari: { nom, email } }
 * Capçalera X-Aulaia-Signature: HMAC-SHA256 en hex del cos tal com arriba.
 */
export const FINESTRA_MS = 5 * 60 * 1000;
const CORREU_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

export function signaturaValida(cos: string, rebuda: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 16 || !rebuda) return false;
  const esperada = createHmac("sha256", secret).update(cos).digest("hex");
  const a = Buffer.from(rebuda);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface OrdreAlta { idAlta: string; email: string; nom: string; idioma: "ca" | "es" }

/** Valida l'ordre. Una ordre vella (o del futur) es rebutja: no es pot tornar a enviar una de capturada. */
export function llegirOrdre(cos: string, ara = Date.now()): { ok: true; ordre: OrdreAlta } | { ok: false; error: string } {
  let j: Record<string, unknown>;
  try { j = JSON.parse(cos) as Record<string, unknown>; } catch { return { ok: false, error: "cos no vàlid" }; }
  if (!j || typeof j !== "object") return { ok: false, error: "cos no vàlid" };
  const idAlta = typeof j.id_alta === "string" ? j.id_alta.slice(0, 80) : "";
  if (!idAlta) return { ok: false, error: "cal id_alta" };
  const quan = typeof j.data === "string" ? Date.parse(j.data) : NaN;
  if (!Number.isFinite(quan) || Math.abs(ara - quan) > FINESTRA_MS) return { ok: false, error: "ordre caducada" };
  const u = (j.usuari ?? {}) as Record<string, unknown>;
  const email = typeof u.email === "string" ? u.email.trim().toLowerCase() : "";
  if (email.length > 200 || !CORREU_RE.test(email)) return { ok: false, error: "correu no vàlid" };
  const nom = typeof u.nom === "string" ? u.nom.replace(/[\r\n]+/g, " ").trim().slice(0, 120) : "";
  return { ok: true, ordre: { idAlta, email, nom, idioma: j.idioma === "es" ? "es" : "ca" } };
}
