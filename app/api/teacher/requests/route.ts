/**
 * Sol·licituds d'accés com a docent.
 * POST  /api/teacher/requests                    → l'usuari de Google demana ser docent (queda pendent)
 * GET   /api/teacher/requests                    → (superadmin) llista de sol·licituds i docents
 * PATCH /api/teacher/requests { email, status }  → (superadmin) 'active' o 'rejected'
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isDbConfigured, query } from "@/lib/db";
import { requireStaff, roleForEmail } from "@/lib/roles";
import { dominiDe, enviarAvis, rolComu } from "@/lib/avisos";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Cal iniciar sessió" }, { status: 401 });
  if (!session.email) return NextResponse.json({ error: "Cal entrar amb Google" }, { status: 403 });
  if (!isDbConfigured) return NextResponse.json({ error: "Base de dades no configurada" }, { status: 503 });
  const current = await roleForEmail(session.email);
  if (current.role !== "student") return NextResponse.json({ teacherStatus: "active" });
  // Una sol·licitud rebutjada no es torna a obrir sola: "do nothing" conserva l'estat.
  const nova = await query("insert into users (email, name) values ($1, $2) on conflict (email) do nothing returning email", [session.email.toLowerCase(), session.username]);
  if (nova.length) void enviarAvis({ tipus: "alta.solicitud", centre: dominiDe(session.email), datos: { rol: rolComu("docent") } });
  const after = await roleForEmail(session.email);
  return NextResponse.json({ teacherStatus: after.teacherStatus });
}

export async function GET() {
  const staff = await requireStaff(true);
  if (staff instanceof NextResponse) return staff;
  const users = await query(
    `select u.email, u.name, u.status, u.created_at, u.decided_at,
            (select count(*)::int from classroom_codes c where lower(c.owner_email) = u.email) as classes
     from users u
     order by (u.status = 'pending') desc, u.created_at desc
     limit 200`,
  );
  return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
  const staff = await requireStaff(true);
  if (staff instanceof NextResponse) return staff;
  const body = (await req.json().catch(() => ({}))) as { email?: string; status?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || (body.status !== "active" && body.status !== "rejected")) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const rows = await query(
    "update users u set status = $2, decided_by = $3, decided_at = now() from (select email, status as abans from users where email = $1) a where u.email = a.email returning a.abans",
    [email, body.status, staff.email],
  );
  if (!rows.length) return NextResponse.json({ error: "No trobat" }, { status: 404 });
  // Només quan canvia de debò: validar una sol·licitud = alta; treure l'accés a un docent actiu = baixa.
  const abans = (rows[0] as { abans?: string }).abans;
  if (body.status === "active" && abans !== "active") void enviarAvis({ tipus: "alta.validada", centre: dominiDe(email), datos: { rol: rolComu("docent") } });
  if (body.status === "rejected" && abans === "active") void enviarAvis({ tipus: "baixa", centre: dominiDe(email), datos: { rol: rolComu("docent") } });
  return NextResponse.json({ ok: true });
}
