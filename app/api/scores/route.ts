/**
 * GET /api/scores → rànquing de la classe del jugador (top 20 per victòries i precisió)
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isDbConfigured, query } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Cal iniciar sessió" }, { status: 401 });
  if (!isDbConfigured || session.codeId.startsWith("demo-")) return NextResponse.json({ scores: [], persisted: false });

  try {
    const scores = await query(
      `select username,
              count(*)::int as games,
              sum(case when won then 1 else 0 end)::int as wins,
              sum(hits)::int as hits,
              sum(shots)::int as shots,
              sum(sunk)::int as sunk,
              case when sum(shots) > 0 then round(100.0 * sum(hits) / sum(shots))::int else 0 end as accuracy
       from scores where code_id = $1
       group by username
       order by wins desc, accuracy desc
       limit 20`,
      [session.codeId],
    );
    return NextResponse.json({ scores, persisted: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, scores: [] }, { status: 500 });
  }
}
