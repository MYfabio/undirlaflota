/**
 * Comptes de docent (només superadministració).
 * POST   /api/teacher/accounts { email, name }      → alta prèvia (validat abans que entri)
 * DELETE /api/teacher/accounts { email, confirm }   → esborra el docent; les seves classes passen a qui l'esborra
 */
import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/roles";
import { altaPreviaDocent, baixaDocent, normalitzaCorreu } from "@/lib/usuaris";

function envList(name: string): string[] {
  return (process.env[name] ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export async function POST(req: Request) {
  const staff = await requireStaff(true);
  if (staff instanceof NextResponse) return staff;
  const body = (await req.json().catch(() => ({}))) as { email?: string; name?: string };
  const email = normalitzaCorreu(body.email);
  if (!email) return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  if (envList("SUPERADMIN_EMAILS").includes(email) || envList("TEACHER_EMAILS").includes(email)) {
    return NextResponse.json({ error: "env_access" }, { status: 409 });
  }
  const { creat } = await altaPreviaDocent(email, String(body.name ?? ""), staff.email);
  if (!creat) return NextResponse.json({ error: "exists" }, { status: 409 });
  console.info("[admin] alta previa docent");
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const staff = await requireStaff(true);
  if (staff instanceof NextResponse) return staff;
  const body = (await req.json().catch(() => ({}))) as { email?: string; confirm?: boolean };
  const email = normalitzaCorreu(body.email);
  if (!email || body.confirm !== true) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (email === staff.email) return NextResponse.json({ error: "self" }, { status: 400 });
  if (envList("SUPERADMIN_EMAILS").includes(email)) return NextResponse.json({ error: "superadmin" }, { status: 400 });
  // Un docent de TEACHER_EMAILS continuaria entrant: cal treure'l de la variable.
  if (envList("TEACHER_EMAILS").includes(email)) return NextResponse.json({ error: "env_access" }, { status: 400 });
  const r = await baixaDocent(email, staff.email);
  if (!r.esborrat) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // Auditoria sense nom ni correu.
  console.info(`[admin] baixa docent classes_transferides=${r.classesTransferides}`);
  return NextResponse.json({ ok: true, classes: r.classesTransferides });
}
