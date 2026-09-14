/**
 * GET /api/auth/google → redirigeix a Google (o 503 si no està configurat).
 */
import { NextResponse } from "next/server";
import { GOOGLE_STATE_COOKIE, authUrl, googleConfig, newState } from "@/lib/google";

export async function GET() {
  const c = googleConfig();
  if (!c.enabled) return NextResponse.json({ error: "Entrada amb Google no configurada" }, { status: 503 });
  const state = newState();
  const res = NextResponse.redirect(authUrl(state));
  res.cookies.set(GOOGLE_STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return res;
}
