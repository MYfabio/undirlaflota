/**
 * GET /api/scores → rànquing de la classe del jugador (top 20 per precisió i victòries)
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Cal iniciar sessió" }, { status: 401 });
  const sb = supabaseServer();
  if (!sb || session.codeId.startsWith("demo-")) return NextResponse.json({ scores: [], persisted: false });

  const { data } = await sb
    .from("scores")
    .select("username, won, accuracy, hits, shots, sunk, unique_xy, created_at")
    .eq("code_id", session.codeId)
    .order("created_at", { ascending: false })
    .limit(500);

  // Agregat per alumne
  const byUser = new Map<string, { username: string; games: number; wins: number; hits: number; shots: number; sunk: number }>();
  for (const r of data ?? []) {
    const u = byUser.get(r.username) ?? { username: r.username, games: 0, wins: 0, hits: 0, shots: 0, sunk: 0 };
    u.games++;
    u.wins += r.won ? 1 : 0;
    u.hits += r.hits;
    u.shots += r.shots;
    u.sunk += r.sunk;
    byUser.set(r.username, u);
  }
  const scores = Array.from(byUser.values())
    .map((u) => ({ ...u, accuracy: u.shots ? Math.round((u.hits / u.shots) * 100) : 0 }))
    .sort((a, b) => b.wins - a.wins || b.accuracy - a.accuracy)
    .slice(0, 20);
  return NextResponse.json({ scores, persisted: true });
}
