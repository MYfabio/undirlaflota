import type { Metadata } from "next";
import { translate } from "@/lib/i18n";
import { idiomaActual, metadadesPrivada } from "@/lib/seo";

// Pàgina privada: sense canònica i fora dels cercadors (a més del Disallow de robots.txt).
export async function generateMetadata(): Promise<Metadata> {
  return metadadesPrivada(translate(await idiomaActual(), "login.title"));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}