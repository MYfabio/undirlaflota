import type { Metadata, Viewport } from "next";
import { Nunito, Geist_Mono } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://undirlaflota.cat";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${APP_NAME} · ${APP_TAGLINE}`, template: `%s · ${APP_NAME}` },
  description:
    "Joc de batalla naval 3D per aprendre coordenades cartesianes i sistema dièdric a l'ESO. Matemàtiques, dibuix tècnic i estratègia.",
  keywords: ["batalla naval 3D", "coordenades cartesianes", "sistema dièdric", "ESO", "matemàtiques", "dibuix tècnic", "aulaia"],
  openGraph: {
    title: `${APP_NAME} · ${APP_TAGLINE}`,
    description: "Enfonsa la flota amb coordenades (x, y, z). Joc educatiu de l'Institut Escola Industrial.",
    images: ["/images/hero.png"],
    locale: "ca_ES",
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#0b2540" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca" className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
