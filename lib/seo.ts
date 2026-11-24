import type { Metadata } from "next";
import { cookies } from "next/headers";
import { APP_DOMAIN, APP_NAME, APP_TAGLINE } from "@/lib/config";
import { DEFAULT_LANG, LANG_COOKIE, isLang, translate, type Lang } from "@/lib/i18n";

/**
 * Adreça pública canònica. Les URL canòniques, l'og:url i el sitemap en depenen.
 * És fixa (no ve de NEXT_PUBLIC_SITE_URL) perquè una instal·lació de prova o el domini
 * tècnic de Railway no s'anunciïn mai als cercadors com a adreça bona.
 */
export const URL_PUBLICA = `https://${APP_DOMAIN}`;

/** Nom del joc tal com surt al títol de la portada (APP_NAME és el nom de l'aplicació). */
export const NOM_JOC = "Enfonsar la flota";

/** Imatge del hero de la portada. */
export const IMATGE_OG = { url: "/images/hero.jpg", width: 1408, height: 768, alt: "Batalla naval 3D amb un grid de coordenades sobre el mar" };

const LOCALE_OG: Record<Lang, string> = { ca: "ca_ES", es: "es_ES", en: "en_GB" };

/**
 * Idioma de la petició (cookie `lang`, la mateixa que llegeix LangProvider).
 * L'idioma no va a l'URL: cada pàgina té una sola adreça i, per tant, no hi ha hreflang.
 */
export async function idiomaActual(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(c) ? c : DEFAULT_LANG;
}

/**
 * Metadades d'una pàgina pública: canònica, Open Graph i targeta de X/Twitter.
 * Next.js substitueix (no fusiona) l'objecte openGraph del layout quan una pàgina en defineix un,
 * per això cada pàgina el rep sencer des d'aquí. El layout arrel no en posa cap, perquè les
 * pàgines privades (joc, entrada, panell de docent) no heretin canònica ni og:url.
 */
export function metadadesPublica({ titol, descripcio, cami, lang, titolAbsolut = false }: {
  titol: string; descripcio: string; cami: string; lang: Lang; titolAbsolut?: boolean;
}): Metadata {
  return {
    title: titolAbsolut ? { absolute: titol } : titol,
    description: descripcio,
    alternates: { canonical: cami },
    openGraph: {
      title: titol,
      description: descripcio,
      url: cami,
      siteName: `${NOM_JOC} · ${APP_NAME}`,
      images: [IMATGE_OG],
      locale: LOCALE_OG[lang],
      alternateLocale: (Object.keys(LOCALE_OG) as Lang[]).filter((l) => l !== lang).map((l) => LOCALE_OG[l]),
      type: "website",
    },
    twitter: { card: "summary_large_image", title: titol, description: descripcio, images: [IMATGE_OG.url] },
  };
}

/** Metadades d'una pàgina privada: fora dels cercadors (a més del Disallow de robots.txt). */
export const metadadesPrivada = (titol: string): Metadata => ({ title: titol, robots: { index: false, follow: false } });

/** Títol i descripció del lloc en cada idioma: portada i valors per defecte del layout. */
export const META: Record<Lang, { title: string; description: string }> = {
  ca: {
    title: `${APP_NAME} · ${APP_TAGLINE}`,
    description: "Joc de batalla naval 3D per aprendre coordenades cartesianes i sistema dièdric a l'ESO. Matemàtiques, dibuix tècnic i estratègia.",
  },
  es: {
    title: `${APP_NAME} · Hundir la flota en 3D`,
    description: "Juego de batalla naval 3D para aprender coordenadas cartesianas y sistema diédrico en la ESO. Matemáticas, dibujo técnico y estrategia.",
  },
  en: {
    title: `${APP_NAME} · Sink the fleet in 3D`,
    description: "3D battleship game to learn Cartesian coordinates and orthographic projection in secondary school. Maths, technical drawing and strategy.",
  },
};

/** Metadades públiques a partir de dues claus d'i18n (títol i descripció). */
export const metadadesDeClaus = (lang: Lang, cami: string, clauTitol: string, clauDescripcio: string) =>
  metadadesPublica({ titol: translate(lang, clauTitol), descripcio: translate(lang, clauDescripcio), cami, lang });

/** JSON-LD dins un <script> sense risc d'injecció d'HTML. */
export const jsonLdSegur = (dades: unknown) => JSON.stringify(dades).replace(/</g, "\\u003c");
