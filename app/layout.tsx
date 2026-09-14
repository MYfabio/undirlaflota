import type { Metadata, Viewport } from "next";
import { Nunito, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from "@/lib/i18n";
import LangProvider from "@/components/LangProvider";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://enfonsarlaflota.aulaia.cat";

const META: Record<Lang, { title: string; description: string; og: string }> = {
  ca: {
    title: `${APP_NAME} · ${APP_TAGLINE}`,
    description: "Joc de batalla naval 3D per aprendre coordenades cartesianes i sistema dièdric a l'ESO. Matemàtiques, dibuix tècnic i estratègia.",
    og: "Enfonsa la flota amb coordenades (x, y, z). Joc educatiu de l'Institut Escola Industrial.",
  },
  es: {
    title: `${APP_NAME} · Hundir la flota en 3D`,
    description: "Juego de batalla naval 3D para aprender coordenadas cartesianas y sistema diédrico en la ESO. Matemáticas, dibujo técnico y estrategia.",
    og: "Hunde la flota con coordenadas (x, y, z). Juego educativo del Institut Escola Industrial.",
  },
  en: {
    title: `${APP_NAME} · Sink the fleet in 3D`,
    description: "3D battleship game to learn Cartesian coordinates and orthographic projection in secondary school. Maths, technical drawing and strategy.",
    og: "Sink the fleet with (x, y, z) coordinates. Educational game by Institut Escola Industrial.",
  },
};

async function currentLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(c) ? c : DEFAULT_LANG;
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await currentLang();
  const m = META[lang];
  return {
    metadataBase: new URL(siteUrl),
    title: { default: m.title, template: `%s · ${APP_NAME}` },
    description: m.description,
    keywords: ["batalla naval 3D", "coordenades cartesianes", "sistema dièdric", "ESO", "matemàtiques", "dibuix tècnic", "aulaia", "battleship 3D", "coordinates"],
    alternates: { canonical: siteUrl, languages: { ca: siteUrl, es: siteUrl, en: siteUrl } },
    openGraph: { title: m.title, description: m.og, images: ["/images/hero.jpg"], locale: lang === "ca" ? "ca_ES" : lang === "es" ? "es_ES" : "en_GB", type: "website" },
    icons: { icon: "/favicon.svg" },
  };
}

export const viewport: Viewport = { themeColor: "#0b2540" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await currentLang();
  return (
    <html lang={lang} className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <LangProvider initial={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
