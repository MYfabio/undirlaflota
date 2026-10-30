import type { MetadataRoute } from "next";

const BASE = "https://enfonsarlaflota.aulaia.cat";

// Només pàgines públiques: el joc i l'entrada demanen sessió.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/tutorial`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
  ];
}
