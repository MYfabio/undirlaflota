/**
 * POST /api/game/create  { mode, opponentName? }
 * Crea una partida i la desa a la BD (si està configurada).
 * En mode "online" la partida queda en estat "waiting" fins que un rival
 * de la mateixa classe s'hi uneix via /api/game/load?join=1.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createGame, type GameMode } from "@/lib/gameEngine";
import { isDbConfigured, query } from "@/lib/db";

const MODES: GameMode[] = ["local", "ai", "online", "tutorial"];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Cal iniciar sessió" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { mode?: GameMode; opponentName?: string };
  const mode = MODES.includes(body.mode as GameMode) ? (body.mode as GameMode) : "local";
  const nameB = mode === "ai" ? "Ordinador" : String(body.opponentName ?? "Rival").trim().slice(0, 24) || "Rival";
  const state = createGame(mode, session.username, nameB);

  if (isDbConfigured && mode !== "tutorial") {
    try {
      await query(
        `insert into games (id, player_a, player_b, status, mode, state, ships_a, ships_b, attacks_a, attacks_b)
         values ($1, $2, $3, $4, $5, $6, '[]', '[]', '[]', '[]')`,
        [state.id, session.playerId, mode === "online" ? null : session.playerId, mode === "online" ? "waiting" : "active", mode, JSON.stringify(state)],
      );
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message, state }, { status: 500 });
    }
  }
  return NextResponse.json({ state, persisted: isDbConfigured });
}
