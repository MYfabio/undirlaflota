/**
 * POST /api/alta-compte — alta d'un docent demanada des del panell d'aulaia.cat
 * (via n8n), no des de la sessió d'un usuari. Només accepta ordres signades amb
 * AULAIA_WEBHOOK_SECRET i de menys de 5 minuts; sense la variable, ho rebutja
 * tot. No registra correus ni noms.
 *
 * Fa el mateix que l'alta prèvia del panell de superadmin i envia el correu
 * «ja tens compte» amb el primer enllaç. Si el correu ja té fila pendent o
 * rebutjada no toca res: canviar-li l'estat és cosa del superadmin.
 */
import { NextResponse } from "next/server";
import { llegirOrdre, signaturaValida } from "@/lib/alta-compte";
import { enviarCompteLlest } from "@/lib/correu";
import { ensureSchema, isDbConfigured, queryOne } from "@/lib/db";
import { crearEnllac } from "@/lib/enllac";
import { roleForEmail } from "@/lib/roles";
import { altaPreviaDocent } from "@/lib/usuaris";

export async function POST(req: Request) {
  const cos = await req.text();
  if (cos.length > 4000 || !signaturaValida(cos, req.headers.get("x-aulaia-signature"), process.env.AULAIA_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "signatura no vàlida" }, { status: 401 });
  }
  const r = llegirOrdre(cos);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  if (!isDbConfigured) return NextResponse.json({ error: "sense base de dades" }, { status: 503 });
  await ensureSchema();
  const { idAlta, email, nom, idioma } = r.ordre;

  if ((await roleForEmail(email)).role !== "student") return NextResponse.json({ id_alta: idAlta, resultat: "ja-existia", correu: false });
  const fila = await queryOne<{ status: string }>("select status from users where email = $1", [email]);
  if (fila) return NextResponse.json({ error: "el correu ja consta com a pendent o rebutjat: cal decidir-ho al panell de l'app" }, { status: 409 });

  const { creat } = await altaPreviaDocent(email, nom, "aulaia.cat");
  if (!creat) return NextResponse.json({ id_alta: idAlta, resultat: "ja-existia", correu: false });
  const correu = (await enviarCompteLlest(email, await crearEnllac(email, 7 * 24 * 60), idioma)).sent;
  return NextResponse.json({ id_alta: idAlta, resultat: "creat", correu });
}
