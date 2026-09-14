"use client";

import { LANGS } from "@/lib/i18n";
import { useT } from "./LangProvider";

/** Selector d'idioma compacte (CA / ES / EN). */
export default function LangSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useT();
  return (
    <div className={`flex items-center gap-0.5 rounded-lg bg-mar-900/70 p-0.5 text-[11px] font-bold ${className}`} role="group" aria-label="Idioma">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          title={l.label}
          className={`rounded-md px-2 py-1 uppercase transition ${lang === l.code ? "bg-batalla text-mar-950" : "text-mar-100/70 hover:text-mar-50"}`}
        >
          {l.code}
        </button>
      ))}
    </div>
  );
}
