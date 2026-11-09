/**
 * Classes del docent.
 * GET  /api/teacher/classes                    → { classes } (les seves; totes si és superadmin)
 * POST /api/teacher/classes { course, school } → crea una classe amb un codi nou
 */
import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireStaff } from "@/lib/roles";

const MAX_CLASSES = 40;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sense 0/O ni 1/I

function newCode(course: string): string {
  const prefix = course.normalize("NFD").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `${prefix.length >= 2 ? prefix : "CLASSE"}-${suffix}`;
}

export async function GET() {
  const staff = await requireStaff();
  if (staff instanceof NextResponse) return staff;
  const all = staff.role === "superadmin";
  const classes = await query(
    `select c.id, c.code, c.school, c.course, c.teacher, c.created_at, c.expires_at,
            (c.expires_at is not null and c.expires_at < now()) as closed,
            (select count(*)::int from players p where p.code_id = c.id) as students,
            (select count(distinct s.game_id)::int from scores s where s.code_id = c.id) as games
     from classroom_codes c
     where ($1::boolean or lower(c.owner_email) = $2)
     order by c.created_at desc`,
    [all, staff.email],
  );
  return NextResponse.json({ classes, role: staff.role });
}

export async function POST(req: Request) {
  const staff = await requireStaff();
  if (staff instanceof NextResponse) return staff;
  const body = (await req.json().catch(() => ({}))) as { course?: string; school?: string };
  const course = String(body.course ?? "").trim();
  const school = String(body.school ?? "").trim();
  if (course.length < 2 || course.length > 40 || school.length < 2 || school.length > 80) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const mine = await queryOne<{ n: number }>("select count(*)::int as n from classroom_codes where lower(owner_email) = $1", [staff.email]);
  if ((mine?.n ?? 0) >= MAX_CLASSES) return NextResponse.json({ error: "limit" }, { status: 409 });
  for (let i = 0; i < 8; i++) {
    const created = await queryOne(
      `insert into classroom_codes (code, school, course, teacher, owner_email, expires_at)
       values ($1, $2, $3, $4, $5, now() + interval '1 year')
       on conflict (code) do nothing
       returning id, code, school, course, teacher, created_at, expires_at`,
      [newCode(course), school, course, staff.session.username, staff.email],
    );
    if (created) return NextResponse.json({ class: created }, { status: 201 });
  }
  return NextResponse.json({ error: "code" }, { status: 500 });
}
