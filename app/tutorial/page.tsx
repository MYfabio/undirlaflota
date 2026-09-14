"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import DiedricViews from "@/components/DiedricViews";
import { useT } from "@/components/LangProvider";
import { SHIPS, SHIP_ORDER, WEAPONS } from "@/lib/ships";
import { GRID_SIZE, Z_MAX, Z_MIN } from "@/lib/config";
import { distance, type Coord } from "@/lib/grid";

const SECTIONS = ["s0", "s1", "s2", "s3", "s4"] as const;

/** Tutorial interactiu en 5 seccions amb un explorador de coordenades i vistes dièdriques. */
export default function TutorialPage() {
  const { t } = useT();
  const [section, setSection] = useState(0);
  const [target, setTarget] = useState<Coord>({ x: 3, y: 7, z: -2 });
  const [second, setSecond] = useState<Coord>({ x: 8, y: 2, z: 0 });
  const set = (k: keyof Coord, v: number) => setTarget((p) => ({ ...p, [k]: v }));
  const zLabel = (z: number) => (z > 0 ? t("z.air", { z }) : z === 0 ? t("z.surface") : t("z.depth", { z }));
  const gridStr = `${GRID_SIZE.x} × ${GRID_SIZE.y} × ${GRID_SIZE.z}`;
  const ctx = t("tut.ctx.text", { grid: gridStr, coord: "(x, y, z)", zmin: Z_MIN, zmax: Z_MAX });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-black sm:text-4xl">{t("tut.title")}</h1>
        <p className="mt-2 text-mar-100/80">{t("tut.subtitle")}</p>

        <nav className="mt-6 flex flex-wrap gap-2">
          {SECTIONS.map((s, i) => (
            <button key={s} onClick={() => setSection(i)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${i === section ? "bg-batalla text-mar-950" : "bg-mar-900/60 text-mar-100 hover:bg-mar-700"}`}>
              {i + 1}. {t(`tut.${s}`)}
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          <motion.section key={section} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="mt-8 space-y-6">
            {section === 0 && (
              <>
                <h2 className="text-2xl font-extrabold">{t("tut.ctx.title")}</h2>
                <p className="text-mar-100/85">{ctx}</p>
                <div className="card grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                  <div className="space-y-4">
                    <p className="font-bold">{t("tut.ctx.move")}</p>
                    {(["x", "y", "z"] as const).map((k) => (
                      <label key={k} className="block">
                        <span className="coord flex justify-between text-sm">
                          <span className="font-bold uppercase">{k}</span>
                          <span className="text-batalla">{target[k]}{k === "z" ? ` · ${zLabel(target.z)}` : ""}</span>
                        </span>
                        <input type="range" min={k === "z" ? Z_MIN : 0} max={k === "z" ? Z_MAX : 9} value={target[k]} onChange={(e) => set(k, Number(e.target.value))} className="w-full accent-batalla" />
                      </label>
                    ))}
                    <p className="coord rounded-xl bg-mar-950/70 p-3 text-center text-xl font-black text-batalla">({target.x}, {target.y}, {target.z})</p>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-bold text-estrategia">{t("tut.ctx.diedric")}</p>
                    <DiedricViews target={target} />
                    <p className="mt-3 text-xs text-mar-100/70">{t("tut.ctx.explain")}</p>
                  </div>
                </div>
              </>
            )}

            {section === 1 && (
              <>
                <h2 className="text-2xl font-extrabold">{t("tut.ctl.title")}</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { e: "🧭", k: "place" },
                    { e: "🔁", k: "turns" },
                    { e: "🎯", k: "attack" },
                  ].map((c) => (
                    <div key={c.k} className="card">
                      <div className="text-3xl">{c.e}</div>
                      <h3 className="mt-2 font-extrabold">{t(`tut.ctl.${c.k}`)}</h3>
                      <p className="mt-1 text-sm text-mar-100/80">{t(`tut.ctl.${c.k}Text`)}</p>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h3 className="font-extrabold">{t("tut.ctl.keys")}</h3>
                  <ul className="coord mt-2 grid gap-1 text-sm sm:grid-cols-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <li key={i}>{t(`tut.ctl.k${i}`)}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {section === 2 && (
              <>
                <h2 className="text-2xl font-extrabold">{t("tut.el.title")}</h2>
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {SHIP_ORDER.map((ty) => {
                    const s = SHIPS[ty];
                    return (
                      <div key={ty} className="card">
                        <div className="text-3xl">{s.emoji}</div>
                        <h3 className="mt-2 font-extrabold">{t(`ship.${ty}`)}</h3>
                        <ul className="coord mt-2 space-y-1 text-sm text-mar-100/80">
                          <li>{t("tut.el.life", { n: s.life })}</li>
                          <li>{t("tut.el.length", { n: s.cells })}</li>
                          <li>{t("tut.el.units", { n: s.count })}</li>
                          <li>{t("tut.el.z", { z: s.allowedZ.join(" / ") })}</li>
                        </ul>
                      </div>
                    );
                  })}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.values(WEAPONS).map((w) => (
                    <div key={w.type} className="card border-batalla/30">
                      <div className="text-3xl">{w.emoji}</div>
                      <h3 className="mt-2 font-extrabold">{t(`weapon.${w.type}`)}</h3>
                      <p className="text-sm text-mar-100/80">{t(`weapon.${w.type}.desc`)}</p>
                      <p className="coord mt-1 text-sm text-batalla">{t("tut.el.ammo", { n: w.count })}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-mar-100/70">{t("tut.el.space", { grid: gridStr, total: GRID_SIZE.x * GRID_SIZE.y * GRID_SIZE.z })}</p>
              </>
            )}

            {section === 3 && (
              <>
                <h2 className="text-2xl font-extrabold">{t("tut.st.title")}</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { k: "3d", c: "text-mar-300" },
                    { k: "diedric", c: "text-estrategia" },
                    { k: "dist", c: "text-batalla" },
                  ].map((c) => (
                    <div key={c.k} className="card">
                      <h3 className={`font-extrabold ${c.c}`}>{t(`tut.st.${c.k}`)}</h3>
                      <p className="mt-1 text-sm text-mar-100/80">{t(`tut.st.${c.k}Text`)}</p>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h3 className="font-extrabold">{t("tut.st.calc")}</h3>
                  <p className="text-sm text-mar-100/80">{t("tut.st.calcText")}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {[
                      { label: t("tut.st.pointA"), val: target, setter: setTarget },
                      { label: t("tut.st.pointB"), val: second, setter: setSecond },
                    ].map((p) => (
                      <div key={p.label} className="space-y-2">
                        <p className="font-bold">{p.label}</p>
                        {(["x", "y", "z"] as const).map((k) => (
                          <label key={k} className="coord flex items-center gap-2 text-sm">
                            <span className="w-4 uppercase">{k}</span>
                            <input type="number" min={k === "z" ? Z_MIN : 0} max={k === "z" ? Z_MAX : 9} value={p.val[k]} onChange={(e) => p.setter({ ...p.val, [k]: Number(e.target.value) })} className="input !w-20 !py-1" />
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                  <p className="coord mt-4 rounded-xl bg-mar-950/70 p-3 text-center text-lg">
                    d = √({(second.x - target.x) ** 2} + {(second.y - target.y) ** 2} + {(second.z - target.z) ** 2}) = <span className="font-black text-batalla">{distance(target, second).toFixed(2)}</span>
                  </p>
                </div>
              </>
            )}

            {section === 4 && (
              <>
                <h2 className="text-2xl font-extrabold">{t("tut.sc.title")}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { n: 1, e: "🛳️🫧🛩️" },
                    { n: 2, e: "💧" },
                    { n: 3, e: "💥" },
                    { n: 4, e: "🏁" },
                  ].map((s, i) => (
                    <motion.div key={s.n} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15 }} className="card flex gap-4">
                      <div className="text-4xl">{s.e}</div>
                      <div>
                        <h3 className="font-extrabold">{t(`tut.sc.${s.n}t`)}</h3>
                        <p className="text-sm text-mar-100/80">{t(`tut.sc.${s.n}d`)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="card flex flex-col items-center gap-3 text-center">
                  <p className="font-bold">{t("tut.sc.ready")}</p>
                  <Link href="/game?mode=tutorial" className="btn-primary">{t("tut.sc.play")}</Link>
                </div>
              </>
            )}
          </motion.section>
        </AnimatePresence>

        <div className="mt-10 flex justify-between">
          <button className="btn-secondary" disabled={section === 0} onClick={() => setSection((s) => s - 1)}>{t("common.back")}</button>
          <button className="btn-secondary" disabled={section === SECTIONS.length - 1} onClick={() => setSection((s) => s + 1)}>{t("common.next")}</button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
