"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FEATURES = [
  {
    icon: "📐",
    title: "Coordenades 3D cartesianes",
    text: "Cada tret és un punt (x, y, z). Localitzar, comparar i predir posicions a l'espai és el cor del joc.",
    color: "text-mar-300",
  },
  {
    icon: "📏",
    title: "Sistema dièdric",
    text: "Planta, alçat i perfil: les tres vistes ortogonals del dibuix tècnic ajuden a llegir el mar en 3D.",
    color: "text-estrategia",
  },
  {
    icon: "🧠",
    title: "Estratègia i lògica",
    text: "Patrons de cerca, deduccions i gestió de munició limitada: 20 torpedes i 6 atacs aeris.",
    color: "text-batalla",
  },
  {
    icon: "⚔️",
    title: "Multijugador per torns",
    text: "Juga contra un company al mateix dispositiu, contra l'ordinador o en línia amb la teva classe.",
    color: "text-perill",
  },
];

const CONCEPTS = [
  {
    n: "01",
    title: "El punt a l'espai",
    text: "Un submarí a (3, 7, -2) està a 3 unitats en X, 7 en Y i 2 nivells sota la superfície. Sense les tres coordenades, no hi ha objectiu.",
  },
  {
    n: "02",
    title: "Projeccions ortogonals",
    text: "Per visualitzar un vaixell amagat, l'alumne projecta el que sap sobre la planta (X-Y) i l'alçat (X-Z), igual que als plànols de dibuix tècnic.",
  },
  {
    n: "03",
    title: "Distàncies i patrons",
    text: "Quants trets calen per cobrir un pla? Quina distància hi ha entre dos impactes? Les preguntes del joc són preguntes de geometria.",
  },
];

export default function Landing() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4">
        {/* HERO */}
        <section className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
          <motion.div variants={fade} initial="hidden" animate="show">
            <span className="chip border-batalla/40 text-batalla">ESO 3r-4t · Matemàtiques + Dibuix tècnic</span>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              La Guerra Submarina <span className="text-batalla">en 3D</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-mar-100/85">
              Enfonsa la flota rival apuntant amb coordenades <span className="coord font-bold text-mar-300">(x, y, z)</span>.
              Un joc de batalla naval amb profunditat real, on cada torn és un exercici de geometria a l&apos;espai.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary text-base">
                Jugar ara →
              </Link>
              <Link href="/tutorial" className="btn-secondary text-base">
                Veure tutorial
              </Link>
            </div>
            <p className="mt-4 text-xs text-mar-300/70">
              Grid de 10 × 10 × 5 · 7 vaixells · 2 visors 3D · sense instal·lar res
            </p>
          </motion.div>
          <motion.div
            variants={fade}
            custom={2}
            initial="hidden"
            animate="show"
            className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-mar-300/20 shadow-2xl shadow-mar-900"
          >
            <Image src="/images/hero.png" alt="Batalla naval 3D amb un grid de coordenades sobre el mar" fill priority className="object-cover" />
          </motion.div>
        </section>

        {/* ABOUT */}
        <section className="card grid gap-6 md:grid-cols-[1fr_2fr]">
          <h2 className="text-2xl font-extrabold">Per què Undirlaflota?</h2>
          <div className="space-y-3 text-mar-100/85">
            <p>
              El joc clàssic d&apos;<em>enfonsar la flota</em> ja treballa coordenades en dues dimensions. Undirlaflota hi afegeix la
              tercera: <strong>profunditat</strong>. Els submarins s&apos;amaguen sota l&apos;aigua i els atacs aeris només toquen la
              superfície, així que pensar en 2D ja no serveix.
            </p>
            <p>
              Connecta directament amb el currículum de <strong>Matemàtiques</strong> (geometria a l&apos;espai, vectors, distàncies) i
              d&apos;<strong>Educació Visual i Plàstica</strong> (sistema dièdric, vistes ortogonals), i entrena l&apos;estratègia i el
              pensament lògic amb recursos limitats.
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-16">
          <h2 className="text-center text-3xl font-black">Què hi ha dins</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.article
                key={f.title}
                variants={fade}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                className="card"
              >
                <div className="text-3xl">{f.icon}</div>
                <h3 className={`mt-3 text-lg font-extrabold ${f.color}`}>{f.title}</h3>
                <p className="mt-2 text-sm text-mar-100/80">{f.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* PEDAGOGY */}
        <section className="grid gap-8 py-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black">Com aprenen els alumnes?</h2>
            <p className="mt-3 text-mar-100/85">
              Tres conceptes clau apareixen a cada partida sense que calgui cap fitxa. El docent pot afegir-hi reflexió amb el
              tutorial i l&apos;anàlisi final de cada partida.
            </p>
            <ol className="mt-8 space-y-5">
              {CONCEPTS.map((c) => (
                <li key={c.n} className="flex gap-4">
                  <span className="coord shrink-0 text-2xl font-black text-estrategia">{c.n}</span>
                  <div>
                    <h3 className="font-extrabold">{c.title}</h3>
                    <p className="text-sm text-mar-100/80">{c.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/tutorial" className="btn-success mt-8">
              Obrir el tutorial interactiu
            </Link>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-mar-300/20 bg-mar-900/40">
            <Image src="/images/schema.png" alt="Diagrama del sistema dièdric: planta, alçat i perfil d'un vaixell" fill className="object-contain p-4" />
          </div>
        </section>

        {/* CTA */}
        <section className="card mt-12 flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-black">A punt per submergir-te?</h2>
          <p className="max-w-xl text-mar-100/85">
            Entra amb el codi que t&apos;ha donat el docent. Si encara no en tens, pots practicar en mode tutorial sense guardar res.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/login" className="btn-primary">
              Entra amb codi de classe
            </Link>
            <Link href="/tutorial" className="btn-secondary">
              Veure tutorial
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
