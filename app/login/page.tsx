"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useT } from "@/components/LangProvider";

type SessionInfo = { username: string; code: string; school: string; course: string } | null;

/**
 * Accés per codi de classe (patró MatEscac).
 * 1. Codi + nom → POST /api/auth/login → cookie de sessió.
 * 2. Amb sessió: continuar partida, nova partida o tutorial.
 */
function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useT();
  const [google, setGoogle] = useState(false);
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<SessionInfo>(null);
  const [codeInfo, setCodeInfo] = useState<{ school: string; course: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/login").then((r) => r.json()).then((d) => { setSession(d.session); setGoogle(Boolean(d.google)); }).catch(() => {});
    const e = params.get("error");
    if (e) setError(t(`login.err.${e}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validació en viu del codi
  useEffect(() => {
    const c = code.trim().toUpperCase();
    if (c.length < 5) return setCodeInfo(null);
    const h = setTimeout(() => {
      fetch("/api/auth/verify-code", { method: "POST", body: JSON.stringify({ code: c }) })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setCodeInfo(d?.valid ? { school: d.school, course: d.course } : null))
        .catch(() => setCodeInfo(null));
    }, 350);
    return () => clearTimeout(h);
  }, [code]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const r = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ code, username }) });
    const d = await r.json();
    setLoading(false);
    if (!r.ok) return setError(r.status === 401 ? t("login.errCode") : r.status === 400 ? t("login.errUser") : d.error);
    setSession(d.session);
  }

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    setSession(null);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          {!session ? (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <h1 className="text-2xl font-black">{t("login.title")}</h1>
                <p className="mt-1 text-sm text-mar-100/75">{t("login.subtitle")}</p>
              </div>
              <label className="block">
                <span className="text-sm font-bold">{t("login.code")}</span>
                <input className="input coord mt-1 uppercase" placeholder="ESO3A-2026" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoComplete="off" required />
                {codeInfo && <span className="mt-1 block text-xs text-estrategia">✓ {codeInfo.school} · {codeInfo.course}</span>}
              </label>
              <label className="block">
                <span className="text-sm font-bold">{t("login.username")}</span>
                <input className="input mt-1" placeholder="Anna" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={24} required />
              </label>
              {error && (
                <div className="rounded-xl border border-perill/40 bg-perill/10 p-3 text-sm">
                  <p className="font-bold text-perill">{error}</p>
                  <p className="mt-1 text-mar-100/80">
                    {t("login.noCode")} <Link href="/about#docents" className="underline">{t("login.contactTeacher")}</Link> {t("login.orTry")}{" "}
                    <Link href="/game?mode=tutorial" className="underline">{t("login.tutorialMode")}</Link>.
                  </p>
                </div>
              )}
              <button className="btn-primary w-full" disabled={loading}>{loading ? t("login.checking") : t("login.submit")}</button>
              <p className="text-center text-xs text-mar-300/70">{t("login.demo")} <span className="coord">DEMO-2026</span></p>
              {google && (
                <>
                  <div className="flex items-center gap-3 text-xs text-mar-300/60"><span className="h-px flex-1 bg-mar-300/20" />{t("login.or")}<span className="h-px flex-1 bg-mar-300/20" /></div>
                  <a href="/api/auth/google" className="btn-secondary w-full !bg-white !text-mar-950 hover:!bg-mar-50">
                    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.9l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>
                    {t("login.google")}
                  </a>
                </>
              )}
            </form>
          ) : (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-black">{t("login.hello", { name: session.username })}</h1>
                <p className="mt-1 text-sm text-mar-100/75">{session.school} · {session.course} · <span className="coord">{session.code}</span></p>
              </div>
              <div className="grid gap-3">
                <button className="btn-primary" onClick={() => router.push("/game?resume=1")}>{t("login.resume")}</button>
                <button className="btn-success" onClick={() => router.push("/game?mode=new")}>{t("login.new")}</button>
                <button className="btn-secondary" onClick={() => router.push("/game?mode=tutorial")}>{t("login.tutorial")}</button>
              </div>
              <button onClick={logout} className="w-full text-center text-xs text-mar-300/70 underline">{t("login.logout")}</button>
            </div>
          )}
        </motion.div>
      </main>
      <SiteFooter />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
