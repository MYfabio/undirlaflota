import type { Metadata } from "next";
import Landing from "@/components/Landing";
import { APP_NAME } from "@/lib/config";
import { FAQ_CLAUS, translate, type Lang } from "@/lib/i18n";
import { IMATGE_OG, META, NOM_JOC, URL_PUBLICA, idiomaActual, jsonLdSegur, metadadesPublica } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await idiomaActual();
  return metadadesPublica({ titol: META[lang].title, descripcio: META[lang].description, cami: "/", lang, titolAbsolut: true });
}

const IDIOMES: Lang[] = ["ca", "es", "en"];
const NIVELLS_EDUCATIUS: Record<Lang, string[]> = { ca: ["ESO", "Batxillerat"], es: ["ESO", "Bachillerato"], en: ["Secondary school"] };
const PUBLIC_DOCENT: Record<Lang, string> = { ca: "Professorat", es: "Profesorado", en: "Teachers" };

/** Dades estructurades de la portada: tot surt dels mateixos textos que es veuen a la pàgina. */
function dadesEstructurades(l: Lang) {
  const t = (k: string) => translate(l, k);
  const url = `${URL_PUBLICA}/`;
  const preguntes: [string, string][] = [
    [t("landing.whatIs"), t("landing.whatIsText")],
    [t("landing.forWho"), t("landing.forWhoText")],
    ...FAQ_CLAUS.map((k): [string, string] => [t(`landing.${k}.q`), t(`landing.${k}.a`)]),
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite", "@id": `${URL_PUBLICA}/#web`, url, name: NOM_JOC, alternateName: APP_NAME, inLanguage: IDIOMES,
        publisher: { "@id": "https://www.aulaia.cat/#organitzacio" },
      },
      {
        "@type": "WebApplication", "@id": `${URL_PUBLICA}/#app`, name: NOM_JOC, alternateName: APP_NAME, url,
        description: t("landing.whatIsText"), applicationCategory: "EducationalApplication", operatingSystem: "Web",
        inLanguage: IDIOMES, educationalLevel: NIVELLS_EDUCATIUS[l],
        audience: { "@type": "EducationalAudience", educationalRole: "teacher", audienceType: PUBLIC_DOCENT[l] },
        image: `${URL_PUBLICA}${IMATGE_OG.url}`,
        provider: { "@type": "Organization", "@id": "https://www.aulaia.cat/#organitzacio", name: "aulaia.cat", url: "https://www.aulaia.cat" },
      },
      {
        "@type": "FAQPage", "@id": `${url}#preguntes`, url, inLanguage: l,
        mainEntity: preguntes.map(([q, r]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: r } })),
      },
    ],
  };
}

/** Portada: metadades i JSON-LD al servidor; el contingut és Landing (client, pintat al servidor). */
export default async function Inici() {
  const lang = await idiomaActual();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSegur(dadesEstructurades(lang)) }} />
      <Landing />
    </>
  );
}
