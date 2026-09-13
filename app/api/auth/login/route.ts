/**
 * POST /api/auth/login  { code, username }  → crea la cookie de sessió
 * GET  /api/auth/login                       → retorna la sessió actual (o null)
 * DELETE /api/auth/login                     → tanca la sessió
 */
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  USERNAME_REGEX,
  buildSession,
  cookieOptions,
  encodeSession,
  findClassroomCode,
  getSession,
  upsertPlayer,
} from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { code?: string; username?: string };
  const username = String(body.username ?? "").trim();
  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({ error: "Nom d'usuari no vàlid (2-24 lletres o números)" }, { status: 400 });
  }
  const row = await findClassroomCode(String(body.code ?? ""));
  if (!row) {
    return NextResponse.json({ error: "Codi de classe no vàlid o caducat. Demana'l al teu docent." }, { status: 401 });
  }
  try {
    const player = await upsertPlayer(row, username);
    const session = buildSession(row, player);
    const res = NextResponse.json({ ok: true, session: { ...session, exp: undefined } });
    res.cookies.set(SESSION_COOKIE, encodeSession(session), cookieOptions());
    return res;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET() {
  const s = await getSession();
  return NextResponse.json({ session: s ? { ...s, exp: undefined } : null });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  return res;
}
