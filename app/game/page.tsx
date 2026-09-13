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

const GameBoard = dynamic(() => import("./components/GameBoard"), {
  ssr: false,
  loading: () => <Loader text="Carregant el mar en 3D…" />,
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

  if (session === undefined) return <Loader text="Comprovant la sessió…" />;

  const name = session?.username ?? "Jugador A";
  const tutorialOnly = !session;

  // Reprendre partida
  if (resume) {
    if (loaded === undefined) return <Loader text="Buscant la teva última partida…" />;
    if (loaded.state) {
      return <GameBoard mode={loaded.state.mode} playerName={name} initialState={loaded.state} initialRole={loaded.role ?? "a"} hasSession={Boolean(session)} />;
    }
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <p className="font-extrabold">No hi ha cap partida activa.</p>
          <Link href="/game?mode=new" className="btn-primary mt-4">Nova partida</Link>
        </div>
      </div>
    );
  }

  // Selector de mode
  if (!chosen) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="card w-full max-w-lg">
          <h1 className="text-2xl font-black">Nova partida</h1>
          <p className="mt-1 text-sm text-mar-100/75">Hola, {name}. Com vols jugar?</p>
          <div className="mt-5 grid gap-3">
            <button className="btn-primary justify-start" onClick={() => setChosen({ mode: "ai" })}>
              🤖 Contra l&apos;ordinador
            </button>
            <div className="flex flex-col gap-2 rounded-xl border border-mar-300/20 p-3">
              <p className="text-sm font-bold">👥 Dos jugadors al mateix dispositiu</p>
              <input className="input" placeholder="Nom del jugador B" value={opp} onChange={(e) => setOpp(e.target.value)} maxLength={24} />
              <button className="btn-success" onClick={() => setChosen({ mode: "local", opponent: opp.trim() || "Jugador B" })}>
                Començar partida local
              </button>
            </div>
            <button className="btn-secondary justify-start" disabled={tutorialOnly} onClick={() => setChosen({ mode: "online" })} title={tutorialOnly ? "Cal iniciar sessió" : ""}>
              🌐 En línia amb la meva classe {tutorialOnly && "(cal sessió)"}
            </button>
            <button className="btn-secondary justify-start" onClick={() => setChosen({ mode: "tutorial" })}>
              📘 Mode tutorial (sense guardar)
            </button>
          </div>
          {tutorialOnly && (
            <p className="mt-4 text-xs text-mar-300/70">
              No tens sessió: les partides no es guardaran. <Link href="/login" className="underline">Entra amb codi de classe</Link>.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (chosen.mode === "online") {
    if (!session) return <Loader text="Cal iniciar sessió per jugar en línia" />;
    if (online === null) return <Loader text="Buscant una partida de la teva classe…" />;
    if (online === "error") {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="card max-w-md text-center">
            <p className="font-extrabold">El mode en línia necessita la base de dades configurada.</p>
            <p className="mt-2 text-sm text-mar-100/75">Mentrestant pots jugar contra l&apos;ordinador o en mode local.</p>
            <button className="btn-primary mt-4" onClick={() => setChosen({ mode: "ai" })}>Contra l&apos;ordinador</button>
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
