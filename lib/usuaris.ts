/**
 * Alta i baixa de docents (superadministració). Funcions de servei: el panell
 * les crida per a una persona i el canvi de curs automatitzat les podrà cridar
 * en bloc. Totes dues són idempotents.
 *
 * Model: l'alumnat no té compte (entra amb codi de classe i nom); els docents
 * són files de `users`. Les classes guarden el docent per correu
 * (`classroom_codes.owner_email`, sense FK).
 */
import { query, withTransaction } from "./db";
import { dominiDe, enviarAvis, rolComu } from "./avisos";

const CORREU = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalitzaCorreu(raw: unknown): string | null {
  const email = String(raw ?? "").trim().toLowerCase();
  return email.length <= 254 && CORREU.test(email) ? email : null;
}

/**
 * Alta prèvia d'un docent: queda validat abans que entri amb Google. Si el
 * correu ja té fila (pendent, validat o rebutjat) no es toca res i retorna
 * `creat: false`: canviar-li l'estat en silenci seria un canvi de permisos
 * que ningú ha vist.
 */
export async function altaPreviaDocent(email: string, nom: string, decidedBy: string): Promise<{ creat: boolean }> {
  const rows = await query(
    `insert into users (email, name, status, decided_by, decided_at) values ($1, $2, 'active', $3, now())
     on conflict (email) do nothing returning email`,
    [email, nom.trim().slice(0, 120), decidedBy],
  );
  // Avís a aulaia.cat (només el domini del correu i el rol, mai el correu sencer).
  if (rows.length > 0) void enviarAvis({ tipus: "alta.validada", centre: dominiDe(email), datos: { rol: rolComu("docent") } });
  return { creat: rows.length > 0 };
}

/**
 * Baixa d'un docent: les seves classes passen a `transferTo` (l'alumnat, les
 * partides i les puntuacions es conserven) i s'esborra la seva fila. Si ja no
 * existeix, retorna `esborrat: false` sense tocar res.
 */
export async function baixaDocent(email: string, transferTo: string): Promise<{ esborrat: boolean; classesTransferides: number }> {
  const out = await withTransaction(async (tx) => {
    const existeix = await tx.query("select email from users where email = $1 for update", [email]);
    if (!existeix.length) return { esborrat: false, classesTransferides: 0 };
    const classes = await tx.query("update classroom_codes set owner_email = $2 where lower(owner_email) = $1 returning id", [email, transferTo]);
    await tx.query("delete from users where email = $1", [email]);
    return { esborrat: true, classesTransferides: classes.length };
  });
  if (out?.esborrat) void enviarAvis({ tipus: "baixa", centre: dominiDe(email), datos: { rol: rolComu("docent") } });
  return out ?? { esborrat: false, classesTransferides: 0 };
}
