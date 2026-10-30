import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/game", "/login"] },
    sitemap: "https://enfonsarlaflota.aulaia.cat/sitemap.xml",
  };
}
