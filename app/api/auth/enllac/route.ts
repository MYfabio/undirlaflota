/**
 * POST /api/auth/enllac
 *   { email } → envia un enllaç d'accés si el correu és d'un docent. La resposta
 *               és sempre la mateixa: no revela si el correu és docent.
 *   { t }     → obre l'enllaç (un sol ús) i crea la sessió. Es fa per POST des
 *               d'un botó: els antivirus del correu obren els enllaços amb GET
 *               i gastarien el token.
 */
import { NextResponse } from "next/server";
import { SESSION_COOKIE, cookieOptions, encodeSession } from "@/lib/auth";
import { enviarEnllacAcces } from "@/lib/correu";
import { ensureSchema, isDbConfigured } from "@/lib/db";
import { crearEnllac, enllacosRecents, obrirEnllac, sessioDocent } from "@/lib/enllac";
import { roleForEmail } from "@/lib/roles";
import { normalitzaCorreu } from "@/lib/usuaris";

export async function POST(req: Request) {
  if (!isDbConfigured) return NextResponse.json({ error: "no_db" }, { status: 503 });
  await ensureSchema();
  const body = (await req.json().catch(() => ({}))) as { email?: string; t?: string; lang?: string };

  if (typeof body.t === "string") {
    const email = await obrirEnllac(body.t);
    // El rol es torna a mirar ara: una baixa feta després d'enviar l'enllaç ha de valer.
    if (!email || (await roleForEmail(email)).role === "student") return NextResponse.json({ error: "enllac" }, { status: 401 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, encodeSession(sessioDocent(email)), cookieOptions());
    return res;
  }

  const ok = NextResponse.json({ ok: true });
  const email = normalitzaCorreu(body.email);
  if (!email) return ok;
  if ((await roleForEmail(email)).role === "student") return ok;
  if ((await enllacosRecents(email)) >= 5) return ok;
  await enviarEnllacAcces(email, await crearEnllac(email, 20), body.lang === "es" ? "es" : "ca");
  return ok;
}
