import type { Metadata } from "next";
import { idiomaActual, metadadesDeClaus } from "@/lib/seo";

// Pàgina pública: canònica i Open Graph propis (la pàgina és un component client).
export async function generateMetadata(): Promise<Metadata> {
  return metadadesDeClaus(await idiomaActual(), "/tutorial", "tut.title", "tut.subtitle");
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}