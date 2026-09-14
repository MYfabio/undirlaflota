"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
export default function LoginPage() {
  const router = useRouter();
  const { t } = useT();
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<SessionInfo>(null);
  const [codeInfo, setCodeInfo] = useState<{ school: string; course: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/login").then((r) => r.json()).then((d) => setSession(d.session)).catch(() => {});
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
