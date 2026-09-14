/**
 * Reptes entre companys de classe (patró MatEscac: challenger → opponent, torn a torn per sondeig).
 *
 * GET  /api/game/challenge            → { classmates, incoming, outgoing }
 * POST /api/game/challenge { opponentId } → crea una partida "waiting" amb player_b = rival
 * POST /api/game/challenge { accept: gameId } → el rival accepta: la partida passa a "active"
 * POST /api/game/challenge { decline: gameId } → es descarta el repte (abandoned)
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createGame, type GameState } from "@/lib/gameEngine";
import { isDbConfigured, query, queryOne } from "@/lib/db";

interface GameLite {
  id: string;
  player_a: string;
  player_b: string | null;
  status: string;
  created_at: string;
  name_a: string | null;
  name_b: string | null;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Cal iniciar sessió" }, { status: 401 });
  if (!isDbConfigured || session.codeId.startsWith("demo-")) return NextResponse.json({ persisted: false, classmates: [], incoming: [], outgoing: [] });
  try {
    const classmates = await query<{ id: string; username: string }>(
      "select id, username from players where code_id = $1 and id <> $2::uuid order by username",
      [session.codeId, session.playerId],
    );
    const rows = await query<GameLite>(
      `select g.id, g.player_a, g.player_b, g.status, g.created_at, pa.username as name_a, pb.username as name_b
       from games g
       left join players pa on pa.id::text = g.player_a
       left join players pb on pb.id::text = g.player_b
       where g.mode = 'online' and g.status = 'waiting' and (g.player_a = $1 or g.player_b = $1)
       order by g.created_at desc limit 20`,
      [session.playerId],
    );
    const incoming = rows.filter((r) => r.player_b === session.playerId).map((r) => ({ id: r.id, from: r.name_a ?? "?", at: r.created_at }));
    const outgoing = rows.filter((r) => r.player_a === session.playerId).map((r) => ({ id: r.id, to: r.name_b ?? "?", at: r.created_at }));
    return NextResponse.json({ persisted: true, classmates, incoming, outgoing });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Cal iniciar sessió" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Sense base de dades" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { opponentId?: string; accept?: string; decline?: string };

  try {
    if (body.accept) {
      const g = await queryOne<{ state: GameState; player_b: string | null }>("select state, player_b from games where id = $1 and status = 'waiting'", [body.accept]);
      if (!g || g.player_b !== session.playerId) return NextResponse.json({ error: "Repte no trobat" }, { status: 404 });
      const state = g.state;
      state.players.b.name = session.username;
      await query("update games set status = 'active', state = $1, updated_at = now() where id = $2", [JSON.stringify(state), body.accept]);
      return NextResponse.json({ state, role: "b" });
    }
    if (body.decline) {
      await query("update games set status = 'abandoned', updated_at = now() where id = $1 and status = 'waiting' and (player_a = $2 or player_b = $2)", [body.decline, session.playerId]);
      return NextResponse.json({ ok: true });
    }
    if (body.opponentId) {
      const opp = await queryOne<{ id: string; username: string }>("select id, username from players where id = $1::uuid and code_id = $2", [body.opponentId, session.codeId]);
      if (!opp) return NextResponse.json({ error: "Aquest company no és de la teva classe" }, { status: 404 });
      if (opp.id === session.playerId) return NextResponse.json({ error: "No et pots reptar a tu mateix" }, { status: 400 });
      // Evitem reptes duplicats
      const dup = await queryOne("select id from games where mode = 'online' and status = 'waiting' and player_a = $1 and player_b = $2", [session.playerId, opp.id]);
      if (dup) return NextResponse.json({ error: "Ja has reptat aquest company", id: dup.id }, { status: 409 });
      const state = createGame("online", session.username, opp.username);
      await query(
        `insert into games (id, player_a, player_b, status, mode, state, ships_a, ships_b, attacks_a, attacks_b)
         values ($1, $2, $3, 'waiting', 'online', $4, '[]', '[]', '[]', '[]')`,
        [state.id, session.playerId, opp.id, JSON.stringify(state)],
      );
      return NextResponse.json({ state, role: "a" });
    }
    return NextResponse.json({ error: "Petició no vàlida" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
