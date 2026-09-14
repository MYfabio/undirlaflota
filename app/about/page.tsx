"use client";

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useT } from "@/components/LangProvider";

/** Pàgina "Sobre l'app": context pedagògic per a docents i famílies. */
export default function AboutPage() {
  const { t } = useT();
  const cols = [
    { key: "math", color: "text-mar-300" },
    { key: "evp", color: "text-estrategia" },
    { key: "trans", color: "text-batalla" },
  ];
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <span className="chip border-estrategia/40 text-estrategia">{t("about.chip")}</span>
        <h1 className="mt-3 text-4xl font-black">{t("about.title")}</h1>
        <p className="mt-4 text-lg text-mar-100/85">{t("about.lead")}</p>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-extrabold">{t("about.curr")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.key} className="card">
                <h3 className={`font-extrabold ${c.color}`}>{t(`about.${c.key}`)}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-mar-100/80">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i}>{t(`about.${c.key}${i}`)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 space-y-3">
          <h2 className="text-2xl font-extrabold">{t("about.how")}</h2>
          <ol className="list-decimal space-y-2 pl-5 text-mar-100/85">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i}>{t(`about.how${i}`)}</li>
            ))}
          </ol>
        </section>

        <section className="mt-12 space-y-3">
          <h2 className="text-2xl font-extrabold">{t("about.props")}</h2>
          <ul className="list-disc space-y-2 pl-5 text-mar-100/85">
            {[1, 2, 3].map((i) => (
              <li key={i}>{t(`about.prop${i}`)}</li>
            ))}
          </ul>
          <p className="text-sm text-mar-300/80">{t("about.docs")}</p>
        </section>

        <section id="docents" className="card mt-12">
          <h2 className="text-2xl font-extrabold">{t("about.codeTitle")}</h2>
          <p className="mt-2 text-mar-100/85">
            {t("about.codeText")}{" "}
            <a href="https://aulaia.cat" className="underline hover:text-batalla" target="_blank" rel="noopener">aulaia.cat</a>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/login" className="btn-primary">{t("about.login")}</Link>
            <Link href="/tutorial" className="btn-secondary">{t("nav.tutorial")}</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
