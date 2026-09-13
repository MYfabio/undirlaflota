/**
 * POST /api/auth/verify-code  { code }
 * Comprova si un codi de classe existeix i no ha caducat (sense crear sessió).
 */
import { NextResponse } from "next/server";
import { findClassroomCode } from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const row = await findClassroomCode(String(body.code ?? ""));
  if (!row) return NextResponse.json({ valid: false }, { status: 404 });
  return NextResponse.json({ valid: true, school: row.school, course: row.course, teacher: row.teacher });
}
