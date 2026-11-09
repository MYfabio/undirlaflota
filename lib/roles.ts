/**
 * Rols: alumne (per defecte), docent i superadmin.
 *
 * - Superadmin: correu a la variable SUPERADMIN_EMAILS (separats per comes).
 * - Docent: correu a TEACHER_EMAILS, o fila a la taula `users` amb status 'active'
 *   (l'ha validat un superadmin des del panell).
 * - El rol es calcula al servidor a cada petició a partir del correu de la sessió
 *   (que només posa l'entrada amb Google, dins la cookie signada). Així una
 *   validació o una baixa té efecte immediat, sense tornar a entrar.
 */
import { NextResponse } from "next/server";
import { getSession, type Session } from "./auth";
import { isDbConfigured, queryOne } from "./db";

export type Role = "student" | "teacher" | "superadmin";
export type TeacherStatus = "none" | "pending" | "active" | "rejected";

function envList(name: string): string[] {
  return (process.env[name] ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export async function roleForEmail(email: string | null | undefined): Promise<{ role: Role; teacherStatus: TeacherStatus }> {
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return { role: "student", teacherStatus: "none" };
  if (envList("SUPERADMIN_EMAILS").includes(e)) return { role: "superadmin", teacherStatus: "active" };
  if (envList("TEACHER_EMAILS").includes(e)) return { role: "teacher", teacherStatus: "active" };
  if (!isDbConfigured) return { role: "student", teacherStatus: "none" };
  const row = await queryOne<{ status: TeacherStatus }>("select status from users where email = $1", [e]);
  if (!row) return { role: "student", teacherStatus: "none" };
  return { role: row.status === "active" ? "teacher" : "student", teacherStatus: row.status };
}

export interface Staff {
  session: Session;
  email: string;
  role: "teacher" | "superadmin";
}

/** Retorna el docent autenticat o una resposta d'error (401/403/503). */
export async function requireStaff(onlySuperadmin = false): Promise<Staff | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Cal iniciar sessió" }, { status: 401 });
  if (!session.email) return NextResponse.json({ error: "Cal entrar amb Google" }, { status: 403 });
  const { role } = await roleForEmail(session.email);
  if (role === "student" || (onlySuperadmin && role !== "superadmin")) {
    return NextResponse.json({ error: "Sense permís" }, { status: 403 });
  }
  if (!isDbConfigured) return NextResponse.json({ error: "Base de dades no configurada" }, { status: 503 });
  return { session, email: session.email.toLowerCase(), role };
}

/** Classe que el docent pot gestionar (seva, o qualsevol si és superadmin). */
export async function ownedClass(staff: Staff, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const row = await queryOne<{ id: string; code: string; school: string; course: string; teacher: string; owner_email: string | null; expires_at: string | null; created_at: string }>(
    "select id, code, school, course, teacher, owner_email, expires_at, created_at from classroom_codes where id = $1",
    [id],
  );
  if (!row) return null;
  if (staff.role !== "superadmin" && (row.owner_email ?? "").toLowerCase() !== staff.email) return null;
  return row;
}
