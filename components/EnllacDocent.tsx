"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/components/LangProvider";

/**
 * Accés per correu per a docents d'altres centres (sense el Google del centre).
 * - Amb `?t=` a l'adreça: botó per obrir l'enllaç rebut (POST, un sol ús).
 * - Sense: formulari per demanar-ne un. La resposta és sempre la mateixa.
 */
export default function EnllacDocent({ ambSessio }: { ambSessio: boolean }) {
  const router = useRouter();
  const token = useSearchParams().get("t");
  const { t, lang } = useT();
  const [email, setEmail] = useState("");
  const [estat, setEstat] = useState<"res" | "enviant" | "enviat" | "error">("res");

  async function obrir() {
    setEstat("enviant");
    const r = await fetch("/api/auth/enllac", { method: "POST", body: JSON.stringify({ t: token }) }).catch(() => null);
    if (r?.ok) return router.push("/docent");
    setEstat("error");
  }

  async function demanar(e: React.FormEvent) {
    e.preventDefault();
    setEstat("enviant");
    await fetch("/api/auth/enllac", { method: "POST", body: JSON.stringify({ email, lang }) }).catch(() => null);
    setEstat("enviat");
  }

  if (token) {
    return (
      <div className="card mt-6 space-y-3">
        <h2 className="text-lg font-black">{t("login.link.openTitle")}</h2>
        {estat === "error" ? (
          <p className="text-sm font-bold text-perill">{t("login.link.bad")}</p>
        ) : (
          <button className="btn-primary w-full" onClick={obrir} disabled={estat === "enviant"}>{t("login.link.open")}</button>
        )}
      </div>
    );
  }
  if (ambSessio) return null;

  return (
    <details className="card mt-6 text-sm">
      <summary className="cursor-pointer font-bold">{t("login.link.title")}</summary>
      {estat === "enviat" ? (
        <p className="mt-3 text-mar-100/80">{t("login.link.sent")}</p>
      ) : (
        <form onSubmit={demanar} className="mt-3 space-y-3">
          <p className="text-mar-100/75">{t("login.link.help")}</p>
          <input className="input" type="email" placeholder="nom@centre.cat" value={email} onChange={(e) => setEmail(e.target.value)} required aria-label={t("login.link.email")} />
          <button className="btn-secondary w-full" disabled={estat === "enviant"}>{t("login.link.send")}</button>
        </form>
      )}
    </details>
  );
}
