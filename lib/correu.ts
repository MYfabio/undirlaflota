/**
 * Client del servei central de correu d'aulaia.cat (POST /api/correu).
 * Només des del servidor. Mai llança: retorna { sent, error }.
 * No registra destinataris ni enllaços.
 */
const URL_SERVEI = process.env.CORREU_API_URL ?? "https://www.aulaia.cat/api/correu";
const APP = "enfonsar-la-flota";

type Resultat = { sent: boolean; error?: string };

export const enviarEnllacAcces = (per: string, enllac: string, idioma = "ca") => enviar("enllac-acces", per, enllac, idioma);

/** Avís «ja tens compte» amb el primer enllaç. Si el servei no coneix la plantilla, surt l'enllaç d'accés normal. */
export async function enviarCompteLlest(per: string, enllac: string, idioma = "ca"): Promise<Resultat> {
  const r = await enviar("compte-llest", per, enllac, idioma);
  return r.error === "tipus-desconegut" ? enviarEnllacAcces(per, enllac, idioma) : r;
}

async function enviar(tipus: string, per: string, enllac: string, idioma: string): Promise<Resultat> {
  const clau = process.env.CORREU_API_KEY;
  if (!clau) { console.warn("correu: CORREU_API_KEY no configurada; no s'ha enviat"); return { sent: false, error: "sense-clau" }; }
  try {
    const r = await fetch(URL_SERVEI, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-correu-key": clau },
      body: JSON.stringify({ tipus, per, app: APP, dades: { correu: per, enllac, idioma } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (r.ok) return { sent: true };
    const j = (await r.json().catch(() => ({}))) as { motiu?: string };
    console.warn(`correu: no enviat (${r.status} ${j.motiu ?? ""})`);
    return { sent: false, error: j.motiu ?? String(r.status) };
  } catch {
    console.warn("correu: error de xarxa");
    return { sent: false, error: "xarxa" };
  }
}
