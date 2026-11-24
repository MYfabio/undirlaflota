import type { MetadataRoute } from "next";
import { URL_PUBLICA } from "@/lib/seo";

// Només pàgines públiques: el joc, l'entrada i el panell de docent demanen sessió.
// L'idioma va per cookie (no per URL), així que cada pàgina té una sola entrada.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${URL_PUBLICA}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${URL_PUBLICA}/tutorial`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${URL_PUBLICA}/about`, changeFrequency: "yearly", priority: 0.6 },
  ];
}
