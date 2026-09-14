"use client";

/**
 * /game?mode=new|local|ai|online|tutorial&resume=1
 * Resol la sessió i l'estat inicial (localStorage o API) i munta el GameBoard.
 * El Canvas de Three.js es carrega només al client (dynamic import, sense SSR).
 */
import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { GameMode, GameState, PlayerId } from "@/lib/gameEngine";
import { useT } from "@/components/LangProvider";

const GameBoard = dynamic(() => import("./components/GameBoard"), {
  ssr: false,
  loading: () => <Loader text="…" />,
});

const STORAGE_KEY = "undirlaflota:partida";

function Loader({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="animate-pulse text-mar-300">🫧 {text}</p>
    </div>
  );
}

type Session = { username: string } | null;

function GamePageInner() {
  const { t } = useT();
  const params = useSearchParams();
  const wantMode = params.get("mode") ?? "new";
  const resume = params.get("resume") === "1";
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [chosen, setChosen] = useState<{ mode: GameMode; opponent?: string } | null>(
    wantMode === "tutorial" ? { mode: "tutorial" } : wantMode === "ai" || wantMode === "local" || wantMode === "online" ? { mode: wantMode } : null,
  );
  const [loaded, setLoaded] = useState<{ state: GameState | null; role?: PlayerId } | undefined>(undefined);
  const [opp, setOpp] = useState("");

  useEffect(() => {
    fetch("/api/auth/login").then((r) => r.json()).then((d) => setSession(d.session)).catch(() => setSession(null));
  }, []);

  // Reprendre: primer API, després localStorage
  useEffect(() => {
    if (!resume || session === undefined) return;
    (async () => {
      if (session) {
        const r = await fetch("/api/game/load").then((x) => x.json()).catch(() => null);
        if (r?.state) return setLoaded({ state: r.state, role: r.role });
      }
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw) as GameState;
          if (s.phase !== "finished") return setLoaded({ state: s });
        }
      } catch {}
      setLoaded({ state: null });
    })();
  }, [resume, session]);

  // Online: crear o unir-se
  const [online, setOnline] = useState<{ state: GameState; role: PlayerId } | null | "error">(null);
  useEffect(() => {
    if (chosen?.mode !== "online" || !session) return;
    (async () => {
      const j = await fetch("/api/game/load?join=1").then((r) => r.json()).catch(() => null);
      if (j?.state) return setOnline({ state: j.state, role: "b" });
      const c = await fetch("/api/game/create", { method: "POST", body: JSON.stringify({ mode: "online", opponentName: "Rival" }) })
        .then((r) => r.json())
        .catch(() => null);
      if (c?.state && c.persisted) return setOnline({ state: c.state, role: "a" });
      setOnline("error");
    })();
  }, [chosen, session]);

  if (session === undefined) return <Loader text={t("mode.checkingSession")} />;

  const name = session?.username ?? t("mode.playerA");
  const tutorialOnly = !session;

  // Reprendre partida
  if (resume) {
    if (loaded === undefined) return <Loader text={t("mode.searchingGame")} />;
    if (loaded.state) {
      return <GameBoard mode={loaded.state.mode} playerName={name} initialState={loaded.state} initialRole={loaded.role ?? "a"} hasSession={Boolean(session)} />;
    }
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <p className="font-extrabold">{t("mode.noActive")}</p>
          <Link href="/game?mode=new" className="btn-primary mt-4">{t("mode.title")}</Link>
        </div>
      </div>
    );
  }

  // Selector de mode
  if (!chosen) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="card w-full max-w-lg">
          <h1 className="text-2xl font-black">{t("mode.title")}</h1>
          <p className="mt-1 text-sm text-mar-100/75">{t("mode.hello", { name })}</p>
          <div className="mt-5 grid gap-3">
            <button className="btn-primary justify-start" onClick={() => setChosen({ mode: "ai" })}>{t("mode.ai")}</button>
            <div className="flex flex-col gap-2 rounded-xl border border-mar-300/20 p-3">
              <p className="text-sm font-bold">{t("mode.local")}</p>
              <input className="input" placeholder={t("mode.opponent")} value={opp} onChange={(e) => setOpp(e.target.value)} maxLength={24} />
              <button className="btn-success" onClick={() => setChosen({ mode: "local", opponent: opp.trim() || t("mode.playerB") })}>{t("mode.startLocal")}</button>
            </div>
            <button className="btn-secondary justify-start" disabled={tutorialOnly} onClick={() => setChosen({ mode: "online" })}>
              {t("mode.online")} {tutorialOnly && t("mode.needSession")}
            </button>
            <button className="btn-secondary justify-start" onClick={() => setChosen({ mode: "tutorial" })}>{t("mode.tutorial")}</button>
          </div>
          {tutorialOnly && (
            <p className="mt-4 text-xs text-mar-300/70">
              {t("mode.noSession")} <Link href="/login" className="underline">{t("mode.loginLink")}</Link>.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (chosen.mode === "online") {
    if (!session) return <Loader text={t("mode.needLoginOnline")} />;
    if (online === null) return <Loader text={t("mode.searchingClass")} />;
    if (online === "error") {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="card max-w-md text-center">
            <p className="font-extrabold">{t("mode.onlineNeedDb")}</p>
            <p className="mt-2 text-sm text-mar-100/75">{t("mode.meanwhile")}</p>
            <button className="btn-primary mt-4" onClick={() => setChosen({ mode: "ai" })}>{t("mode.ai")}</button>
          </div>
        </div>
      );
    }
    return <GameBoard mode="online" playerName={name} initialState={online.state} initialRole={online.role} hasSession />;
  }

  return <GameBoard mode={chosen.mode} playerName={name} opponentName={chosen.opponent} hasSession={Boolean(session)} />;
}

export default function GamePage() {
  return (
    <Suspense fallback={<Loader text="Carregant…" />}>
      <GamePageInner />
    </Suspense>
  );
}
