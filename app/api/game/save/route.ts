/**
 * POST /api/game/save  { state, memorable? }
 * Desa l'estat complet d'una partida. Si ha acabat, també registra la puntuació.
 * Sense BD retorna { persisted: false } i el client desa a localStorage.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { computeStats, type GameState } from "@/lib/gameEngine";
import { isDbConfigured, query, queryOne } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Cal iniciar sessió" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { state?: GameState; memorable?: boolean };
  const state = body.state;
  if (!state || typeof state.id !== "string" || !state.players) {
    return NextResponse.json({ error: "Estat no vàlid" }, { status: 400 });
  }
  if (!isDbConfigured || state.mode === "tutorial") return NextResponse.json({ persisted: false });

  try {
    const existing = await queryOne<{ player_a: string; player_b: string | null }>("select player_a, player_b from games where id = $1", [state.id]);
    if (existing && existing.player_a !== session.playerId && existing.player_b !== session.playerId) {
      return NextResponse.json({ error: "No ets jugador d'aquesta partida" }, { status: 403 });
    }
    const finished = state.phase === "finished";
    const statsA = computeStats(state, "a");
    const statsB = computeStats(state, "b");
    const playerA = existing?.player_a ?? session.playerId;
    const playerB = existing?.player_b ?? session.playerId;
    const finishedAt = finished ? new Date(state.finishedAt ?? Date.now()).toISOString() : null;

    await query(
      `insert into games (id, player_a, player_b, status, mode, state, ships_a, ships_b, attacks_a, attacks_b, winner, stats_a, stats_b, memorable, updated_at, finished_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,coalesce($14,false),now(),$15)
       on conflict (id) do update set
         status = excluded.status, state = excluded.state, ships_a = excluded.ships_a, ships_b = excluded.ships_b,
         attacks_a = excluded.attacks_a, attacks_b = excluded.attacks_b, winner = excluded.winner,
         stats_a = excluded.stats_a, stats_b = excluded.stats_b,
         memorable = coalesce($14, games.memorable), updated_at = now(), finished_at = excluded.finished_at`,
      [
        state.id, playerA, playerB, finished ? "finished" : "active", state.mode, JSON.stringify(state),
        JSON.stringify(state.players.a.fleet), JSON.stringify(state.players.b.fleet),
        JSON.stringify(state.players.a.attacks), JSON.stringify(state.players.b.attacks),
        state.winner, JSON.stringify(statsA), JSON.stringify(statsB),
        body.memorable === undefined ? null : Boolean(body.memorable), finishedAt,
      ],
    );

    if (finished) {
      const me = existing?.player_b === session.playerId ? "b" : "a";
      const st = me === "a" ? statsA : statsB;
      await query(
        `insert into scores (game_id, player_id, code_id, username, won, accuracy, hits, shots, sunk, unique_xy)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (game_id, player_id) do nothing`,
        [state.id, session.playerId, session.codeId.startsWith("demo-") ? null : session.codeId, session.username,
          state.winner === me, st.accuracy, st.hits, st.shots, st.sunk, st.uniqueXY],
      );
    }
    return NextResponse.json({ persisted: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
