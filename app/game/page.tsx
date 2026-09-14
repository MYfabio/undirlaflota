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

type Session = { username: string; code: string; course: string } | null;

interface LobbyData {
  persisted: boolean;
  classmates: { id: string; username: string }[];
  incoming: { id: string; from: string; at: string }[];
  outgoing: { id: string; to: string; at: string }[];
}

/** Lobby en línia: reptar companys de classe i acceptar reptes (patró MatEscac). */
function OnlineLobby({ session, onStart, t }: { session: NonNullable<Session>; onStart: (s: GameState, role: PlayerId) => void; t: (k: string, v?: Record<string, string | number>) => string }) {
  const [data, setData] = useState<LobbyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const d = await fetch("/api/game/challenge").then((r) => r.json()).catch(() => null);
    if (d) setData(d);
  };
  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 5000);
    return () => clearInterval(i);
  }, []);

  // Si un repte enviat ja s'ha acceptat, la partida deixa d'estar "waiting": la carreguem
  useEffect(() => {
    if (!data) return;
    (async () => {
      const r = await fetch("/api/game/load").then((x) => x.json()).catch(() => null);
      if (r?.state && r.state.mode === "online" && r.status === "active") onStart(r.state, r.role);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const post = async (body: Record<string, string>) => {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/game/challenge", { method: "POST", body: JSON.stringify(body) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error ?? "Error");
    if (d.state) onStart(d.state, d.role);
    else refresh();
  };

  if (data && !data.persisted) {
    return (
      <div className="card max-w-md text-center">
        <p className="font-extrabold">{t("lobby.noDb")}</p>
        <Link href="/game?mode=ai" className="btn-primary mt-4">{t("mode.ai")}</Link>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-lg">
      <h1 className="text-2xl font-black">{t("lobby.title")}</h1>
      <p className="mt-1 text-sm text-mar-100/75">{t("lobby.subtitle", { course: session.course })}</p>
      {error && <p className="mt-2 text-sm text-perill">{error}</p>}

      {data && data.incoming.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-batalla">{t("lobby.incoming")}</h2>
          <ul className="mt-2 space-y-2">
            {data.incoming.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-batalla/40 bg-batalla/10 p-3">
                <span className="font-bold">⚔️ {t("lobby.from", { name: c.from })}</span>
                <span className="flex gap-2">
                  <button className="btn-success !px-3 !py-1 text-xs" disabled={busy} onClick={() => post({ accept: c.id })}>{t("lobby.accept")}</button>
                  <button className="btn-secondary !px-3 !py-1 text-xs" disabled={busy} onClick={() => post({ decline: c.id })}>{t("lobby.decline")}</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-5">
        <h2 className="text-xs font-extrabold uppercase tracking-wide text-mar-300">{t("lobby.classmates")}</h2>
        {!data ? (
          <p className="mt-2 animate-pulse text-sm text-mar-300">{t("common.loading")}</p>
        ) : data.classmates.length === 0 ? (
          <p className="mt-2 text-sm text-mar-100/70">{t("lobby.noClassmates", { code: session.code })}</p>
        ) : (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {data.classmates.map((c) => {
              const pending = data.outgoing.find((o) => o.to === c.username);
              return (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-mar-300/20 bg-mar-950/50 px-3 py-2">
                  <span className="font-bold">👤 {c.username}</span>
                  {pending ? (
                    <button className="text-xs text-mar-300 underline" disabled={busy} onClick={() => post({ decline: pending.id })} title={t("lobby.decline")}>
                      ⏳ {t("lobby.waitingAccept", { name: c.username })}
                    </button>
                  ) : (
                    <button className="btn-primary !px-3 !py-1 text-xs" disabled={busy} onClick={() => post({ opponentId: c.id })}>{t("lobby.challenge")}</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-4 text-[11px] text-mar-300/60">{t("lobby.refresh")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/game?mode=new" className="btn-secondary !px-3 !py-1 text-xs">← {t("mode.title")}</Link>
      </div>
    </div>
  );
}

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

  // Online: la partida arrenca des del lobby (repte acceptat)
  const [online, setOnline] = useState<{ state: GameState; role: PlayerId } | null>(null);

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
    if (online === null) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <OnlineLobby session={session} t={t} onStart={(state, role) => setOnline({ state, role })} />
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
