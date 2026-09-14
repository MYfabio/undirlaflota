"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useT } from "@/components/LangProvider";

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FEATURES = [
  { icon: "📐", key: "f1", color: "text-mar-300" },
  { icon: "📏", key: "f2", color: "text-estrategia" },
  { icon: "🧠", key: "f3", color: "text-batalla" },
  { icon: "⚔️", key: "f4", color: "text-perill" },
];

export default function Landing() {
  const { t } = useT();
  const lead = t("landing.lead").split("{coord}");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4">
        {/* HERO */}
        <section className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
          <motion.div variants={fade} initial="hidden" animate="show">
            <span className="chip border-batalla/40 text-batalla">{t("landing.chip")}</span>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              {t("landing.title1")} <span className="text-batalla">{t("landing.title2")}</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-mar-100/85">
              {lead[0]}
              <span className="coord font-bold text-mar-300">(x, y, z)</span>
              {lead[1]}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary text-base">{t("landing.playNow")}</Link>
              <Link href="/tutorial" className="btn-secondary text-base">{t("landing.seeTutorial")}</Link>
            </div>
            <p className="mt-4 text-xs text-mar-300/70">{t("landing.meta")}</p>
          </motion.div>
          <motion.div
            variants={fade}
            custom={2}
            initial="hidden"
            animate="show"
            className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-mar-300/20 shadow-2xl shadow-mar-900"
          >
            <Image src="/images/hero.png" alt={t("landing.heroAlt")} fill priority className="object-cover" />
          </motion.div>
        </section>

        {/* ABOUT */}
        <section className="card grid gap-6 md:grid-cols-[1fr_2fr]">
          <h2 className="text-2xl font-extrabold">{t("landing.why")}</h2>
          <div className="space-y-3 text-mar-100/85">
            <p>{t("landing.why1")}</p>
            <p>{t("landing.why2")}</p>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-16">
          <h2 className="text-center text-3xl font-black">{t("landing.features")}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.article key={f.key} variants={fade} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="card">
                <div className="text-3xl">{f.icon}</div>
                <h3 className={`mt-3 text-lg font-extrabold ${f.color}`}>{t(`landing.${f.key}.title`)}</h3>
                <p className="mt-2 text-sm text-mar-100/80">{t(`landing.${f.key}.text`)}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* PEDAGOGY */}
        <section className="grid gap-8 py-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black">{t("landing.howLearn")}</h2>
            <p className="mt-3 text-mar-100/85">{t("landing.howLearnText")}</p>
            <ol className="mt-8 space-y-5">
              {["c1", "c2", "c3"].map((c, i) => (
                <li key={c} className="flex gap-4">
                  <span className="coord shrink-0 text-2xl font-black text-estrategia">0{i + 1}</span>
                  <div>
                    <h3 className="font-extrabold">{t(`landing.${c}.title`)}</h3>
                    <p className="text-sm text-mar-100/80">{t(`landing.${c}.text`)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/tutorial" className="btn-success mt-8">{t("landing.openTutorial")}</Link>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-mar-300/20 bg-mar-900/40">
            <Image src="/images/schema.png" alt={t("landing.schemaAlt")} fill className="object-contain p-4" />
          </div>
        </section>

        {/* CTA */}
        <section className="card mt-12 flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-black">{t("landing.ctaTitle")}</h2>
          <p className="max-w-xl text-mar-100/85">{t("landing.ctaText")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/login" className="btn-primary">{t("landing.ctaLogin")}</Link>
            <Link href="/tutorial" className="btn-secondary">{t("landing.seeTutorial")}</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
