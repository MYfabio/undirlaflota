"use client";

/**
 * Proveïdor d'idioma. Llegeix la cookie/localStorage `lang` (o el navegador la
 * primera vegada) i exposa `useT()` → { t, lang, setLang }.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANG, LANG_COOKIE, detectLang, isLang, translate, type Lang } from "@/lib/i18n";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LangContext = createContext<Ctx>({ lang: DEFAULT_LANG, setLang: () => {}, t: (k, v) => translate(DEFAULT_LANG, k, v) });

function readCookie(): Lang | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([a-z]{2})`));
  return m && isLang(m[1]) ? m[1] : null;
}

export default function LangProvider({ children, initial }: { children: React.ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initial ?? DEFAULT_LANG);

  useEffect(() => {
    const fromCookie = readCookie();
    if (fromCookie) {
      if (fromCookie !== lang) setLangState(fromCookie);
      return;
    }
    const detected = detectLang();
    if (detected !== lang) setLangState(detected);
    document.cookie = `${LANG_COOKIE}=${detected}; path=/; max-age=31536000; samesite=lax`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    try {
      localStorage.setItem(LANG_COOKIE, l);
    } catch {}
  }, []);

  const value = useMemo<Ctx>(() => ({ lang, setLang, t: (k, v) => translate(lang, k, v) }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useT() {
  return useContext(LangContext);
}
