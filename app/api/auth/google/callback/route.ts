/**
 * GET /api/auth/google/callback?code=&state= → crea la sessió i torna a /login.
 * Errors: redirigeix a /login?error=<motiu> perquè la pàgina els mostri.
 */
import { NextResponse } from "next/server";
import { SESSION_COOKIE, buildSession, cookieOptions, encodeSession } from "@/lib/auth";
import { GOOGLE_STATE_COOKIE, checkState, exchangeCode, googleConfig, playerForGoogle } from "@/lib/google";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${site}/login?error=${encodeURIComponent(reason)}`);
    res.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  };
  const c = googleConfig();
  if (!c.enabled) return fail("google-off");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.headers.get("cookie")?.match(new RegExp(`${GOOGLE_STATE_COOKIE}=([^;]+)`))?.[1];
  if (!code || !checkState(state, cookieState)) return fail("google-state");
  try {
    const user = await exchangeCode(code);
    const domain = user.email.split("@")[1];
    if (c.hostedDomain && domain !== c.hostedDomain) return fail("google-domain");
    const { player, classroom } = await playerForGoogle(user);
    const session = buildSession(classroom, player);
    const res = NextResponse.redirect(`${site}/login`);
    res.cookies.set(SESSION_COOKIE, encodeSession(session), cookieOptions());
    res.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("google callback", e);
    return fail("google-error");
  }
}
