import { query } from "./db";
import { construirDominis, dominiCentre, hiHaActivitat, horesTancades, type Domini, type FilaActius } from "./activitat-xifres";

/**
 * Informe d'activitat cap a aulaia.cat (docs/informe-activitat.md d'aulaia-cat):
 * cada hora, quanta gent ha jugat o ha fet alguna cosa a Enfonsar la Flota, per
 * domini del docent propietari de la classe. L'alumnat no té compte: compta
 * per jugador de cada classe. Només recomptes. Sense AULAIA_ACTIVITAT_CLAU no fa res.
 */
const URL_INFORME = process.env.AULAIA_ACTIVITAT_URL || "https://www.aulaia.cat/api/activitat";
const HORA_MS = 3_600_000;

/** Les 0:00 de Catalunya del dia de `inici`. */
export function iniciDia(inici: Date): Date {
  const local = new Date(inici.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const desfasament = local.getTime() - inici.getTime();
  local.setHours(0, 0, 0, 0);
  return new Date(local.getTime() - desfasament);
}

export const CONSULTA_ACTIUS = `
  WITH accions AS (
    SELECT 'j:' || s.player_id AS qui, s.code_id, s.created_at AS quan FROM scores s WHERE s.created_at >= $2 AND s.created_at < $3
    UNION ALL SELECT 'j:' || p.id::text, p.code_id, p.joined_at FROM players p WHERE p.joined_at >= $2 AND p.joined_at < $3
    UNION ALL SELECT 'd:' || c.owner_email, c.id, c.created_at FROM classroom_codes c WHERE c.owner_email IS NOT NULL AND c.created_at >= $2 AND c.created_at < $3
  )
  SELECT c.owner_email AS email,
         (count(DISTINCT a.qui) FILTER (WHERE a.quan >= $1))::int AS hora,
         count(DISTINCT a.qui)::int AS dia
  FROM accions a LEFT JOIN classroom_codes c ON c.id = a.code_id
  GROUP BY c.owner_email`;

export async function xifresDeLHora(consulta: typeof query, inici: Date): Promise<Domini[]> {
  const fi = new Date(inici.getTime() + HORA_MS);
  const files = await consulta<{ email: string | null; hora: number; dia: number }>(CONSULTA_ACTIUS, [inici, iniciDia(inici), fi]);
  const perDomini = new Map<string, FilaActius>();
  for (const r of files) {
    const domini = dominiCentre(r.email);
    const f = perDomini.get(domini) ?? { domini, actiusHora: 0, actiusDia: 0 };
    f.actiusHora += Number(r.hora);
    f.actiusDia += Number(r.dia);
    perDomini.set(domini, f);
  }
  return construirDominis([...perDomini.values()], []);
}

/** `inici`: inici d'una hora ja tancada. No llança mai. */
export async function enviarInformeActivitat(inici: Date): Promise<string> {
  const clau = process.env.AULAIA_ACTIVITAT_CLAU;
  if (!clau) return "sense-clau";
  try {
    const dominis = await xifresDeLHora(query, inici);
    if (!hiHaActivitat(dominis)) return "sense-activitat";
    const r = await fetch(URL_INFORME, {
      method: "POST",
      headers: { Authorization: `Bearer ${clau}`, "Content-Type": "application/json" },
      body: JSON.stringify({ versio: 1, app: "enfonsar-la-flota", hora: inici.toISOString(), dominis }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) console.warn("Informe d'activitat rebutjat:", r.status);
    return r.ok ? "enviat" : "rebutjat";
  } catch (e) {
    console.warn("Informe d'activitat no enviat:", e instanceof Error ? e.name : "error");
    return "error";
  }
}

let engegat = false;

/** Cada 10 minuts mira les 3 darreres hores tancades. Reenviar una hora la substitueix. */
export function iniciarInformeActivitat() {
  if (engegat || !process.env.AULAIA_ACTIVITAT_CLAU) return;
  engegat = true;
  const fetes = new Set<number>();
  const tic = async () => {
    for (const hora of horesTancades(new Date(), 3)) {
      if (fetes.has(hora.getTime())) continue;
      if ((await enviarInformeActivitat(hora)) !== "error") fetes.add(hora.getTime());
    }
    for (const t of fetes) if (Date.now() - t > 6 * HORA_MS) fetes.delete(t);
  };
  setTimeout(() => void tic(), 60_000).unref?.();
  setInterval(() => void tic(), 10 * 60_000).unref?.();
}
