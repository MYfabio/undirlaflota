/**
 * GET /api/game/load            → última partida activa del jugador
 * GET /api/game/load?id=g-xxx   → una partida concreta
 * GET /api/game/load?join=1     → s'uneix a una partida "waiting" de la mateixa classe
 * GET /api/game/load?list=1     → llista de partides del jugador (últimes 20)
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isDbConfigured, query, queryOne, type GameRow } from "@/lib/db";
import type { GameState } from "@/lib/gameEngine";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Cal iniciar sessió" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ persisted: false, state: null });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const me = session.playerId;

  try {
    if (url.searchParams.get("list")) {
      const games = await query(
        `select id, mode, status, winner, created_at, finished_at, stats_a, stats_b, player_a, player_b
         from games where player_a = $1 or player_b = $1 order by created_at desc limit 20`,
        [me],
      );
      return NextResponse.json({ games });
    }

    if (url.searchParams.get("join")) {
      // Partida en espera creada per un company de la mateixa classe
      const waiting = await queryOne<GameRow>(
        `select g.* from games g join players p on p.id::text = g.player_a
         where g.status = 'waiting' and p.code_id = $1 and g.player_a <> $2
         order by g.created_at asc limit 1`,
        [session.codeId, me],
      );
      if (!waiting) return NextResponse.json({ state: null, reason: "Cap partida en espera" });
      const state = waiting.state as GameState;
      state.players.b.name = session.username;
      await query("update games set player_b = $1, status = 'active', state = $2, updated_at = now() where id = $3", [me, JSON.stringify(state), waiting.id]);
      return NextResponse.json({ state, role: "b" });
    }

    const row = id
      ? await queryOne<GameRow>("select * from games where id = $1 and (player_a = $2 or player_b = $2)", [id, me])
      : await queryOne<GameRow>(
          "select * from games where (player_a = $1 or player_b = $1) and status in ('active','waiting') order by updated_at desc limit 1",
          [me],
        );
    if (!row) return NextResponse.json({ state: null });
    const role = row.player_a === me ? "a" : "b";
    return NextResponse.json({ state: row.state as GameState, role, status: row.status });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, state: null }, { status: 500 });
  }
}
