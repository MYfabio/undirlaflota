/**
 * POST /api/game/save  { state, memorable? }
 * Desa l'estat complet d'una partida. Si ha acabat, també registra puntuacions.
 * Sense Supabase retorna { persisted: false } i el client desa a localStorage.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { computeStats, type GameState } from "@/lib/gameEngine";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Cal iniciar sessió" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { state?: GameState; memorable?: boolean };
  const state = body.state;
  if (!state || typeof state.id !== "string" || !state.players) {
    return NextResponse.json({ error: "Estat no vàlid" }, { status: 400 });
  }
  const sb = supabaseServer();
  if (!sb || state.mode === "tutorial") return NextResponse.json({ persisted: false });

  const { data: existing } = await sb.from("games").select("player_a, player_b, status").eq("id", state.id).maybeSingle();
  if (existing && existing.player_a !== session.playerId && existing.player_b !== session.playerId) {
    return NextResponse.json({ error: "No ets jugador d'aquesta partida" }, { status: 403 });
  }

  const finished = state.phase === "finished";
  const statsA = computeStats(state, "a");
  const statsB = computeStats(state, "b");
  const row = {
    id: state.id,
    player_a: existing?.player_a ?? session.playerId,
    player_b: existing?.player_b ?? session.playerId,
    status: finished ? "finished" : "active",
    mode: state.mode,
    state,
    ships_a: state.players.a.fleet,
    ships_b: state.players.b.fleet,
    attacks_a: state.players.a.attacks,
    attacks_b: state.players.b.attacks,
    winner: state.winner,
    stats_a: statsA,
    stats_b: statsB,
    updated_at: new Date().toISOString(),
    finished_at: finished ? new Date(state.finishedAt ?? Date.now()).toISOString() : null,
    ...(body.memorable !== undefined ? { memorable: Boolean(body.memorable) } : {}),
  };
  const { error } = await sb.from("games").upsert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Puntuació del jugador que desa (una sola vegada per partida)
  if (finished) {
    const me = existing?.player_b === session.playerId ? "b" : "a";
    const st = me === "a" ? statsA : statsB;
    const { data: already } = await sb.from("scores").select("id").eq("game_id", state.id).eq("player_id", session.playerId).maybeSingle();
    if (!already) {
      await sb.from("scores").insert({
        game_id: state.id,
        player_id: session.playerId,
        code_id: session.codeId.startsWith("demo-") ? null : session.codeId,
        username: session.username,
        won: state.winner === me,
        accuracy: st.accuracy,
        hits: st.hits,
        shots: st.shots,
        sunk: st.sunk,
        unique_xy: st.uniqueXY,
      });
    }
  }
  return NextResponse.json({ persisted: true });
}
