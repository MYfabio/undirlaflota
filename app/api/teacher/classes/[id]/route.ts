/**
 * Una classe del docent.
 * GET    /api/teacher/classes/:id             → { class, students } amb estadístiques
 * GET    /api/teacher/classes/:id?format=csv  → el mateix en CSV (Excel)
 * PATCH  /api/teacher/classes/:id { open }    → tanca (caduca ara) o reobre (un any més)
 * DELETE /api/teacher/classes/:id?player=<id> → treu un alumne i les seves puntuacions
 */
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ownedClass, requireStaff } from "@/lib/roles";

type Ctx = { params: Promise<{ id: string }> };

interface StudentRow {
  id: string;
  username: string;
  joined_at: string;
  games: number;
  wins: number;
  hits: number;
  shots: number;
  sunk: number;
  accuracy: number;
  unique_xy: number;
  last_played: string | null;
}

/** Evita que Excel interpreti una cel·la com a fórmula. */
function csvCell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

const day = (d: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export async function GET(req: Request, { params }: Ctx) {
  const staff = await requireStaff();
  if (staff instanceof NextResponse) return staff;
  const cls = await ownedClass(staff, (await params).id);
  if (!cls) return NextResponse.json({ error: "No trobada" }, { status: 404 });
  const students = await query<StudentRow>(
    `select p.id, p.username, p.joined_at,
            coalesce(s.games, 0) as games, coalesce(s.wins, 0) as wins, coalesce(s.hits, 0) as hits,
            coalesce(s.shots, 0) as shots, coalesce(s.sunk, 0) as sunk, coalesce(s.unique_xy, 0) as unique_xy,
            case when coalesce(s.shots, 0) > 0 then round(100.0 * s.hits / s.shots)::int else 0 end as accuracy,
            s.last_played
     from players p
     left join (
       select player_id, count(*)::int as games, sum(case when won then 1 else 0 end)::int as wins,
              sum(hits)::int as hits, sum(shots)::int as shots, sum(sunk)::int as sunk,
              round(avg(unique_xy))::int as unique_xy, max(created_at) as last_played
       from scores where code_id = $1 group by player_id
     ) s on s.player_id = p.id::text
     where p.code_id = $1
     order by lower(p.username)`,
    [cls.id],
  );
  if (new URL(req.url).searchParams.get("format") === "csv") {
    const head = ["alumne", "partides", "victories", "precisio_%", "impactes", "trets", "enfonsats", "columnes_xy_mitjana", "ultima_partida", "alta"];
    const lines = students.map((s) =>
      [s.username, s.games, s.wins, s.accuracy, s.hits, s.shots, s.sunk, s.unique_xy, day(s.last_played), day(s.joined_at)].map(csvCell).join(";"),
    );
    const csv = "﻿" + [head.map(csvCell).join(";"), ...lines].join("\r\n");
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${cls.code}.csv"`, "Cache-Control": "no-store" },
    });
  }
  const closed = Boolean(cls.expires_at && new Date(cls.expires_at) < new Date());
  return NextResponse.json({ class: { ...cls, owner_email: undefined, closed }, students });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const staff = await requireStaff();
  if (staff instanceof NextResponse) return staff;
  const cls = await ownedClass(staff, (await params).id);
  if (!cls) return NextResponse.json({ error: "No trobada" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { open?: boolean };
  if (typeof body.open !== "boolean") return NextResponse.json({ error: "invalid" }, { status: 400 });
  await query(
    body.open
      ? "update classroom_codes set expires_at = now() + interval '1 year' where id = $1"
      : "update classroom_codes set expires_at = now() where id = $1",
    [cls.id],
  );
  return NextResponse.json({ ok: true, closed: !body.open });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const staff = await requireStaff();
  if (staff instanceof NextResponse) return staff;
  const cls = await ownedClass(staff, (await params).id);
  if (!cls) return NextResponse.json({ error: "No trobada" }, { status: 404 });
  const player = new URL(req.url).searchParams.get("player") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(player)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const gone = await query("delete from players where id = $1 and code_id = $2 returning id", [player, cls.id]);
  if (!gone.length) return NextResponse.json({ error: "No trobat" }, { status: 404 });
  await query("delete from scores where player_id = $1 and code_id = $2", [player, cls.id]);
  return NextResponse.json({ ok: true });
}
