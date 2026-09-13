/**
 * POST /api/game/create  { mode, opponentName? }
 * Crea una partida i la desa a Supabase (si està configurat).
 * En mode "online" la partida queda en estat "waiting" fins que un rival
 * de la mateixa classe s'hi uneix via /api/game/load?join=1.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createGame, type GameMode } from "@/lib/gameEngine";
import { supabaseServer } from "@/lib/supabase";

const MODES: GameMode[] = ["local", "ai", "online", "tutorial"];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Cal iniciar sessió" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { mode?: GameMode; opponentName?: string };
  const mode = MODES.includes(body.mode as GameMode) ? (body.mode as GameMode) : "local";
  const nameB = mode === "ai" ? "Ordinador" : String(body.opponentName ?? "Rival").trim().slice(0, 24) || "Rival";
  const state = createGame(mode, session.username, nameB);

  const sb = supabaseServer();
  if (sb && mode !== "tutorial") {
    const { error } = await sb.from("games").insert({
      id: state.id,
      player_a: session.playerId,
      player_b: mode === "online" ? null : session.playerId,
      status: mode === "online" ? "waiting" : "active",
      mode,
      state,
      ships_a: [],
      ships_b: [],
      attacks_a: [],
      attacks_b: [],
    });
    if (error) return NextResponse.json({ error: error.message, state }, { status: 500 });
  }
  return NextResponse.json({ state, persisted: Boolean(sb) });
}
