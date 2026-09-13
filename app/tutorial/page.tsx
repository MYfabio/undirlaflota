"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import DiedricViews from "@/components/DiedricViews";
import { SHIPS, SHIP_ORDER, WEAPONS } from "@/lib/ships";
import { GRID_SIZE, Z_MAX, Z_MIN } from "@/lib/config";
import { distance, zLabel, type Coord } from "@/lib/grid";

const SECTIONS = ["Context", "Controls", "Elements", "Estratègia", "Escenari"] as const;

/** Tutorial interactiu en 5 seccions amb un explorador de coordenades i vistes dièdriques. */
export default function TutorialPage() {
  const [section, setSection] = useState(0);
  const [target, setTarget] = useState<Coord>({ x: 3, y: 7, z: -2 });
  const [second, setSecond] = useState<Coord>({ x: 8, y: 2, z: 0 });

  const set = (k: keyof Coord, v: number) => setTarget((t) => ({ ...t, [k]: v }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-black sm:text-4xl">Tutorial interactiu</h1>
        <p className="mt-2 text-mar-100/80">Cinc passos per dominar el mar en tres dimensions.</p>

        <nav className="mt-6 flex flex-wrap gap-2">
          {SECTIONS.map((s, i) => (
            <button
              key={s}
              onClick={() => setSection(i)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                i === section ? "bg-batalla text-mar-950" : "bg-mar-900/60 text-mar-100 hover:bg-mar-700"
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          <motion.section
            key={section}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="mt-8 space-y-6"
          >
            {section === 0 && (
              <>
                <h2 className="text-2xl font-extrabold">Matemàtiques dins la batalla</h2>
                <p className="text-mar-100/85">
                  El mar és un grid de <span className="coord font-bold">{GRID_SIZE.x} × {GRID_SIZE.y} × {GRID_SIZE.z}</span>. Cada
                  cel·la té una adreça única: <span className="coord font-bold text-batalla">(x, y, z)</span>. X i Y van de 0 a 9; Z va
                  de {Z_MIN} (fons) a +{Z_MAX} (aire). La superfície és z = 0.
                </p>
                <div className="card grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                  <div className="space-y-4">
                    <p className="font-bold">Mou el punt i mira com canvien les tres vistes:</p>
                    {(["x", "y", "z"] as const).map((k) => (
                      <label key={k} className="block">
                        <span className="coord flex justify-between text-sm">
                          <span className="font-bold uppercase">{k}</span>
                          <span className="text-batalla">{target[k]}{k === "z" ? ` · ${zLabel(target.z)}` : ""}</span>
                        </span>
                        <input
                          type="range"
                          min={k === "z" ? Z_MIN : 0}
                          max={k === "z" ? Z_MAX : 9}
                          value={target[k]}
                          onChange={(e) => set(k, Number(e.target.value))}
                          className="w-full accent-batalla"
                        />
                      </label>
                    ))}
                    <p className="coord rounded-xl bg-mar-950/70 p-3 text-center text-xl font-black text-batalla">
                      ({target.x}, {target.y}, {target.z})
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-bold text-estrategia">Sistema dièdric · vistes ortogonals</p>
                    <DiedricViews target={target} />
                    <p className="mt-3 text-xs text-mar-100/70">
                      La <strong>planta</strong> es veu des de dalt (perd la Z). L&apos;<strong>alçat</strong> es veu de front (perd la
                      Y). El <strong>perfil</strong> es veu de costat (perd la X). Amb dues vistes qualssevol ja pots reconstruir el punt.
                    </p>
                  </div>
                </div>
              </>
            )}

            {section === 1 && (
              <>
                <h2 className="text-2xl font-extrabold">Controls del joc</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="card">
                    <div className="text-3xl">🧭</div>
                    <h3 className="mt-2 font-extrabold">Col·locar vaixells</h3>
                    <p className="mt-1 text-sm text-mar-100/80">
                      A la fase inicial, selecciona un vaixell, tria l&apos;eix (X o Y), ajusta la coordenada d&apos;origen i prem
                      <em> Col·locar</em>. També pots fer clic directament a una cel·la del visor 3D. Els submarins només poden anar
                      sota l&apos;aigua. El botó <em>Aleatori</em> et col·loca tota la flota.
                    </p>
                  </div>
                  <div className="card">
                    <div className="text-3xl">🔁</div>
                    <h3 className="mt-2 font-extrabold">Sistema de torns</h3>
                    <p className="mt-1 text-sm text-mar-100/80">
                      Primer col·loca el jugador A, després el B. En mode local, la pantalla de canvi de torn amaga la flota mentre
                      passeu el dispositiu. Cada torn és un sol tret.
                    </p>
                  </div>
                  <div className="card">
                    <div className="text-3xl">🎯</div>
                    <h3 className="mt-2 font-extrabold">Atacar</h3>
                    <p className="mt-1 text-sm text-mar-100/80">
                      Al visor d&apos;atacs, mou el cursor amb les fletxes (X/Y), puja i baixa amb <kbd>Q</kbd>/<kbd>E</kbd> o els
                      botons Z, tria l&apos;arma i prem <em>Disparar</em>. També pots fer clic a una cel·la del grid 3D.
                    </p>
                  </div>
                </div>
                <div className="card">
                  <h3 className="font-extrabold">Dreceres de teclat</h3>
                  <ul className="coord mt-2 grid gap-1 text-sm sm:grid-cols-2">
                    <li>← → : X −1 / +1</li>
                    <li>↑ ↓ : Y +1 / −1</li>
                    <li>Q / E : Z +1 / −1</li>
                    <li>T / A : Torpede / Atac aeri</li>
                    <li>Enter o Espai : Disparar</li>
                    <li>R : Rotar vaixell (col·locació)</li>
                  </ul>
                </div>
              </>
            )}

            {section === 2 && (
              <>
                <h2 className="text-2xl font-extrabold">Elements del joc</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  {SHIP_ORDER.map((t) => {
                    const s = SHIPS[t];
                    return (
                      <div key={t} className="card">
                        <div className="text-3xl">{s.emoji}</div>
                        <h3 className="mt-2 font-extrabold">{s.name}</h3>
                        <ul className="coord mt-2 space-y-1 text-sm text-mar-100/80">
                          <li>Vida: {s.life}</li>
                          <li>Longitud: {s.cells} cel·les</li>
                          <li>Unitats: {s.count}</li>
                          <li>Nivell Z: {s.allowedZ.join(" o ")}</li>
                        </ul>
                      </div>
                    );
                  })}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.values(WEAPONS).map((w) => (
                    <div key={w.type} className="card border-batalla/30">
                      <div className="text-3xl">{w.emoji}</div>
                      <h3 className="mt-2 font-extrabold">{w.name}</h3>
                      <p className="text-sm text-mar-100/80">{w.description}</p>
                      <p className="coord mt-1 text-sm text-batalla">{w.count} unitats per partida</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-mar-100/70">
                  Espai: mar 3D de {GRID_SIZE.x} × {GRID_SIZE.y} × {GRID_SIZE.z} cel·les = {GRID_SIZE.x * GRID_SIZE.y * GRID_SIZE.z}{" "}
                  posicions possibles. Amb 26 trets només en pots explorar un 5 %: cal pensar!
                </p>
              </>
            )}

            {section === 3 && (
              <>
                <h2 className="text-2xl font-extrabold">Estratègia</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="card">
                    <h3 className="font-extrabold text-mar-300">Pensa en 3D</h3>
                    <p className="mt-1 text-sm text-mar-100/80">
                      Els 5 vaixells de superfície viuen tots a z = 0: un pla de 100 cel·les. Els 2 submarins es reparteixen entre
                      z = -1 i z = -2. On val més la pena buscar primer?
                    </p>
                  </div>
                  <div className="card">
                    <h3 className="font-extrabold text-estrategia">Usa el dièdric</h3>
                    <p className="mt-1 text-sm text-mar-100/80">
                      Quan encertes, dibuixa l&apos;impacte a la planta i a l&apos;alçat. Un vaixell és una línia recta: la següent
                      cel·la només pot estar en 4 direccions del mateix pla.
                    </p>
                  </div>
                  <div className="card">
                    <h3 className="font-extrabold text-batalla">Calcula distàncies</h3>
                    <p className="mt-1 text-sm text-mar-100/80">
                      Un portaavions fa 5 cel·les: si dispares amb un patró de tauler d&apos;escacs cada 5 columnes, cap portaavions
                      pot escapar-se.
                    </p>
                  </div>
                </div>
                <div className="card">
                  <h3 className="font-extrabold">Calculadora de distàncies</h3>
                  <p className="text-sm text-mar-100/80">Distància euclidiana entre dos punts: √((x₂−x₁)² + (y₂−y₁)² + (z₂−z₁)²)</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {[
                      { label: "Punt A", val: target, setter: setTarget },
                      { label: "Punt B", val: second, setter: setSecond },
                    ].map((p) => (
                      <div key={p.label} className="space-y-2">
                        <p className="font-bold">{p.label}</p>
                        {(["x", "y", "z"] as const).map((k) => (
                          <label key={k} className="coord flex items-center gap-2 text-sm">
                            <span className="w-4 uppercase">{k}</span>
                            <input
                              type="number"
                              min={k === "z" ? Z_MIN : 0}
                              max={k === "z" ? Z_MAX : 9}
                              value={p.val[k]}
                              onChange={(e) => p.setter({ ...p.val, [k]: Number(e.target.value) })}
                              className="input !w-20 !py-1"
                            />
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                  <p className="coord mt-4 rounded-xl bg-mar-950/70 p-3 text-center text-lg">
                    d = √({(second.x - target.x) ** 2} + {(second.y - target.y) ** 2} + {(second.z - target.z) ** 2}) ={" "}
                    <span className="font-black text-batalla">{distance(target, second).toFixed(2)}</span>
                  </p>
                </div>
              </>
            )}

            {section === 4 && (
              <>
                <h2 className="text-2xl font-extrabold">Escenari: una partida en imatges</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { t: "1. Col·locació", d: "Cada jugador amaga 7 vaixells. Els submarins baixen a z = -1 o -2.", e: "🛳️🚢🫧" },
                    { t: "2. Primer tret", d: "Anna dispara un torpede a (4, 4, 0). Aigua! El visor marca la cel·la en gris.", e: "💧" },
                    { t: "3. Impacte", d: "Alex prova (4, 4, -1) i toca un submarí. La cel·la es torna vermella i el vaixell perd 4 punts.", e: "💥" },
                    { t: "4. Enfonsament", d: "Tres impactes en línia i el submarí s'enfonsa. Queden 6 vaixells i un patró clar.", e: "🏁" },
                  ].map((s, i) => (
                    <motion.div
                      key={s.t}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.15 }}
                      className="card flex gap-4"
                    >
                      <div className="text-4xl">{s.e}</div>
                      <div>
                        <h3 className="font-extrabold">{s.t}</h3>
                        <p className="text-sm text-mar-100/80">{s.d}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="card flex flex-col items-center gap-3 text-center">
                  <p className="font-bold">Ja ho tens tot. Prova-ho ara en mode tutorial contra l&apos;ordinador, sense guardar res.</p>
                  <Link href="/game?mode=tutorial" className="btn-primary">
                    Jugar el tutorial pràctic →
                  </Link>
                </div>
              </>
            )}
          </motion.section>
        </AnimatePresence>

        <div className="mt-10 flex justify-between">
          <button className="btn-secondary" disabled={section === 0} onClick={() => setSection((s) => s - 1)}>
            ← Anterior
          </button>
          <button className="btn-secondary" disabled={section === SECTIONS.length - 1} onClick={() => setSection((s) => s + 1)}>
            Següent →
          </button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
