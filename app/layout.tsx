import type { Metadata, Viewport } from "next";
import { Nunito, Geist_Mono } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/config";
import { META, URL_PUBLICA, idiomaActual } from "@/lib/seo";
import LangProvider from "@/components/LangProvider";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Sense canònica ni Open Graph globals: només les posen les pàgines públiques (lib/seo.ts),
// perquè cap pàgina privada n'hereti una que apunti a la portada.
export async function generateMetadata(): Promise<Metadata> {
  const m = META[await idiomaActual()];
  return {
    metadataBase: new URL(URL_PUBLICA),
    title: { default: m.title, template: `%s · ${APP_NAME}` },
    description: m.description,
    keywords: ["batalla naval 3D", "coordenades cartesianes", "sistema dièdric", "ESO", "matemàtiques", "dibuix tècnic", "aulaia", "battleship 3D", "coordinates"],
    icons: { icon: "/favicon.svg" },
  };
}

export const viewport: Viewport = { themeColor: "#0b2540" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await idiomaActual();
  return (
    <html lang={lang} className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <LangProvider initial={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
