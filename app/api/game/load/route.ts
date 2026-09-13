/**
 * GET /api/game/load            → última partida activa del jugador
 * GET /api/game/load?id=g-xxx   → una partida concreta
 * GET /api/game/load?join=1     → s'uneix a una partida "waiting" de la mateixa classe
 * GET /api/game/load?list=1     → llista de partides del jugador (últimes 20)
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import type { GameState } from "@/lib/gameEngine";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Cal iniciar sessió" }, { status: 401 });
  const sb = supabaseServer();
  if (!sb) return NextResponse.json({ persisted: false, state: null });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const me = session.playerId;

  if (url.searchParams.get("list")) {
    const { data } = await sb
      .from("games")
      .select("id, mode, status, winner, created_at, finished_at, stats_a, stats_b, player_a, player_b")
      .or(`player_a.eq.${me},player_b.eq.${me}`)
      .order("created_at", { ascending: false })
      .limit(20);
    return NextResponse.json({ games: data ?? [] });
  }

  if (url.searchParams.get("join")) {
    // Rival de la mateixa classe: busquem jugadors amb el mateix code_id
    const { data: mates } = await sb.from("players").select("id").eq("code_id", session.codeId);
    const ids = (mates ?? []).map((m) => m.id as string).filter((x) => x !== me);
    if (!ids.length) return NextResponse.json({ state: null, reason: "Cap partida en espera" });
    const { data: waiting } = await sb
      .from("games")
      .select("*")
      .eq("status", "waiting")
      .in("player_a", ids)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!waiting) return NextResponse.json({ state: null, reason: "Cap partida en espera" });
    const state = waiting.state as GameState;
    state.players.b.name = session.username;
    await sb.from("games").update({ player_b: me, status: "active", state, updated_at: new Date().toISOString() }).eq("id", waiting.id);
    return NextResponse.json({ state, role: "b" });
  }

  let query = sb.from("games").select("*").or(`player_a.eq.${me},player_b.eq.${me}`);
  query = id ? query.eq("id", id) : query.in("status", ["active", "waiting"]).order("updated_at", { ascending: false });
  const { data } = await query.limit(1).maybeSingle();
  if (!data) return NextResponse.json({ state: null });
  const role = data.player_a === me ? "a" : "b";
  return NextResponse.json({ state: data.state as GameState, role, status: data.status });
}
