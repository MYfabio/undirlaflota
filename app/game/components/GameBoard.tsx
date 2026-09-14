"use client";

/**
 * GameBoard · gestor principal dels 2 visors.
 *
 * Modes:
 *  - local:   dos jugadors al mateix dispositiu (pantalla de canvi de torn).
 *  - ai:      contra l'ordinador (IA de lib/gameEngine).
 *  - tutorial: com "ai" però sense desar res.
 *  - online:  per torns via Postgres (polling a /api/game/load cada 3 s).
 *
 * L'estat del joc és el GameState pur; aquest component només el presenta
 * i el desa (localStorage sempre; API si hi ha sessió i base de dades).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import FleetViewer from "./FleetViewer";
import AttackViewer from "./AttackViewer";
import TurnIndicator from "./TurnIndicator";
import ScoreBoard from "./ScoreBoard";
import GameResult from "./GameResult";
import {
  aiChooseAttack,
  attack,
  confirmFleet,
  createGame,
  isFleetComplete,
  other,
  placeShip,
  randomFleet,
  removeShip,
  requiredShips,
  type GameMode,
  type GameState,
  type PlayerId,
} from "@/lib/gameEngine";
import { canPlace, fleetAlive, fleetLife } from "@/lib/collision";
import { clampCoord, type Coord } from "@/lib/grid";
import { FLEET_SHIP_COUNT, FLEET_TOTAL_LIFE, SHIPS, type Axis, type ShipType, type WeaponType } from "@/lib/ships";
import { useT } from "@/components/LangProvider";

const STORAGE_KEY = "undirlaflota:partida";

interface Props {
  mode: GameMode;
  playerName: string;
  opponentName?: string;
  initialState?: GameState | null;
  initialRole?: PlayerId;
  hasSession: boolean;
}

export default function GameBoard({ mode, playerName, opponentName, initialState, initialRole, hasSession }: Props) {
  const router = useRouter();
  const { t } = useT();
  const [state, setState] = useState<GameState>(
    () => initialState ?? createGame(mode, playerName, mode === "ai" || mode === "tutorial" ? t("mode.computer") : opponentName || t("mode.playerB")),
  );
  // En mode local, "me" canvia a cada torn; en ai/online és fix.
  const [role] = useState<PlayerId>(initialRole ?? "a");
  const [handoff, setHandoff] = useState(false); // pantalla de canvi de torn (local)
  const [waiting, setWaiting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const me: PlayerId = mode === "local" ? (state.phase === "placing-b" ? "b" : state.phase === "placing-a" ? "a" : state.current) : role;
  const opp = other(me);

  /* ───────── Persistència ───────── */
  const persist = useCallback(
    (s: GameState, memorable?: boolean) => {
      if (s.mode === "tutorial") return Promise.resolve(false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch {}
      if (!hasSession) return Promise.resolve(false);
      return fetch("/api/game/save", { method: "POST", body: JSON.stringify({ state: s, memorable }) })
        .then((r) => r.json())
        .then((d) => Boolean(d.persisted))
        .catch(() => false);
    },
    [hasSession],
  );

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(state), 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, persist]);

  /* ───────── Online: polling ───────── */
  useEffect(() => {
    if (mode !== "online") return;
    const isMyTurn = state.phase === "playing" && state.current === me;
    const needPoll = state.phase === "finished" ? false : !isMyTurn || (state.phase === "placing-a" && me === "b") || (state.phase === "placing-b" && me === "a");
    if (!needPoll) {
      setWaiting(false);
      return;
    }
    setWaiting(true);
    const t = setInterval(async () => {
      const r = await fetch(`/api/game/load?id=${state.id}`).then((x) => x.json()).catch(() => null);
      if (r?.state && JSON.stringify(r.state) !== JSON.stringify(state)) setState(r.state as GameState);
    }, 3000);
    return () => clearInterval(t);
  }, [mode, state, me]);

  /* ───────── IA ───────── */
  useEffect(() => {
    if (mode !== "ai" && mode !== "tutorial") return;
    // La IA col·loca la flota en començar la seva fase
    if (state.phase === "placing-b") {
      const fleet = randomFleet();
      const s1 = { ...state, players: { ...state.players, b: { ...state.players.b, fleet } } };
      const { state: s2 } = confirmFleet(s1, "b");
      setState(s2);
      return;
    }
    if (state.phase === "playing" && state.current === "b") {
      setWaiting(true);
      const timer = setTimeout(() => {
        const choice = aiChooseAttack(state, "b");
        if (!choice) return setWaiting(false);
        const { state: s } = attack(state, "b", choice.coord, choice.weapon);
        setState(s);
        setWaiting(false);
        if (s.lastResult && s.lastResult.by === "b") {
          const coord = `(${choice.coord.x}, ${choice.coord.y}, ${choice.coord.z})`;
          setNotice(
            s.lastResult.outcome === "miss"
              ? t("game.notice.aiMiss", { coord })
              : t(s.lastResult.outcome === "sunk" ? "game.notice.aiSunk" : "game.notice.aiHit", { ship: t(`ship.${s.lastResult.shipType!}`).toLowerCase(), coord }),
          );
        }
      }, 900);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  /* ───────── Col·locació ───────── */
  const placingPlayer: PlayerId | null = state.phase === "placing-a" ? "a" : state.phase === "placing-b" ? "b" : null;
  const iAmPlacing = placingPlayer !== null && (mode === "local" || placingPlayer === me);
  const [sel, setSel] = useState<{ id: string; type: ShipType } | null>(null);
  const [axis, setAxis] = useState<Axis>("x");
  const [origin, setOrigin] = useState<Coord>({ x: 0, y: 0, z: 0 });
  const [placeError, setPlaceError] = useState<string | null>(null);

  const pending = useMemo(() => {
    if (!placingPlayer) return [];
    const fleet = state.players[placingPlayer].fleet;
    return requiredShips().filter((r) => !fleet.some((s) => s.id === r.id));
  }, [state, placingPlayer]);

  useEffect(() => {
    if (iAmPlacing && !sel && pending.length) {
      const p = pending[0];
      setSel(p);
      setOrigin((o) => ({ ...o, z: SHIPS[p.type].allowedZ[0] }));
    }
    if (!pending.length) setSel(null);
  }, [iAmPlacing, sel, pending]);

  const placeValid = useMemo(() => {
    if (!sel || !placingPlayer) return false;
    return canPlace(state.players[placingPlayer].fleet, sel.type, origin, axis, sel.id).ok;
  }, [sel, placingPlayer, state, origin, axis]);

  const doPlace = (o: Coord = origin) => {
    if (!sel || !placingPlayer) return;
    const res = placeShip(state, placingPlayer, sel.id, sel.type, o, axis);
    if (res.error) return setPlaceError(res.error);
    setPlaceError(null);
    setState(res.state);
    setSel(null);
  };

  const doRandom = () => {
    if (!placingPlayer) return;
    setState({ ...state, players: { ...state.players, [placingPlayer]: { ...state.players[placingPlayer], fleet: randomFleet() } } });
    setSel(null);
  };

  const doConfirm = () => {
    if (!placingPlayer) return;
    const res = confirmFleet(state, placingPlayer);
    if (res.error) return setPlaceError(res.error);
    setState(res.state);
    if (mode === "local") setHandoff(true);
  };

  // Tecla R per rotar durant la col·locació
  useEffect(() => {
    if (!iAmPlacing) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") setAxis((a) => (a === "x" ? "y" : "x"));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [iAmPlacing]);

  /* ───────── Atac ───────── */
  const onFire = (c: Coord, w: WeaponType): string | null => {
    const res = attack(state, me, c, w);
    if (res.error) return res.error;
    setState(res.state);
    if (res.result) {
      setNotice(
        res.result.outcome === "miss"
          ? t("game.notice.miss")
          : res.result.outcome === "sunk"
            ? t("game.notice.sunk", { ship: t(`ship.${res.result.shipType!}`).toLowerCase() })
            : t("game.notice.hit", { ship: t(`ship.${res.result.shipType!}`), n: res.result.damage }),
      );
    }
    if (mode === "local" && res.state.phase === "playing") setTimeout(() => setHandoff(true), 1200);
    if (mode === "online") persist(res.state);
    return null;
  };

  const playAgain = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setState(createGame(mode, state.players.a.name, state.players.b.name));
    setSel(null);
  };

  const myFleet = state.players[me].fleet;
  const incoming = state.players[opp].attacks;

  return (
    <div className="flex min-h-screen flex-col">
      <TurnIndicator state={state} me={me} waiting={waiting} onExit={() => router.push("/login")} />

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed left-1/2 top-16 z-40 -translate-x-1/2 rounded-full border border-batalla/40 bg-mar-950/95 px-5 py-2 text-sm font-bold shadow-xl"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="grid flex-1 gap-3 p-3 lg:grid-cols-2">
        {/* VISOR 1 */}
        <section className="flex min-h-[420px] flex-col gap-2">
          <div className="min-h-[300px] flex-1">
            <FleetViewer
              fleet={iAmPlacing ? state.players[placingPlayer!].fleet : myFleet}
              incoming={incoming}
              hidden={handoff}
              placing={iAmPlacing && sel ? { type: sel.type, axis, origin, valid: placeValid, onPick: (c) => { setOrigin(clampCoord({ ...c, z: origin.z })); } } : null}
              onShipClick={iAmPlacing ? (id) => { const s = state.players[placingPlayer!].fleet.find((f) => f.id === id); if (s) { setState(removeShip(state, placingPlayer!, id)); setSel({ id, type: s.type }); setOrigin(s.origin); setAxis(s.axis); } } : undefined}
            />
          </div>

          {iAmPlacing ? (
            <div className="card !p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-extrabold">
                  {t("game.placeTitle", { name: state.players[placingPlayer!].name })}{" "}
                  <span className="coord text-mar-300">({FLEET_SHIP_COUNT - pending.length}/{FLEET_SHIP_COUNT})</span>
                </p>
                <div className="flex gap-2">
                  <button className="btn-secondary !px-3 !py-1 text-xs" onClick={doRandom}>{t("game.random")}</button>
                  <button className="btn-success !px-3 !py-1 text-xs" disabled={!isFleetComplete(state.players[placingPlayer!].fleet)} onClick={doConfirm}>
                    {t("game.confirmFleet")}
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {requiredShips().map((r) => {
                  const placed = state.players[placingPlayer!].fleet.some((s) => s.id === r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => { if (placed) { setState(removeShip(state, placingPlayer!, r.id)); } setSel(r); setOrigin((o) => ({ ...o, z: SHIPS[r.type].allowedZ[0] })); }}
                      className={`chip ${sel?.id === r.id ? "border-batalla text-batalla" : placed ? "border-estrategia/50 text-estrategia" : ""}`}
                    >
                      {SHIPS[r.type].emoji} {t(`ship.${r.type}`)} {r.id.split("-")[1]} {placed ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
              {sel && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-bold">{t(`ship.${sel.type}`)}</span>
                  <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => setAxis((a) => (a === "x" ? "y" : "x"))}>
                    {t("game.axis", { axis: axis.toUpperCase() })}
                  </button>
                  {(["x", "y", "z"] as const).map((k) => (
                    <label key={k} className="coord flex items-center gap-1">
                      <span className="uppercase text-mar-300">{k}</span>
                      <input
                        type="number"
                        className="input !w-14 !px-1 !py-1 text-center"
                        value={origin[k]}
                        min={k === "z" ? Math.min(...SHIPS[sel.type].allowedZ) : 0}
                        max={k === "z" ? Math.max(...SHIPS[sel.type].allowedZ) : 9}
                        onChange={(e) => setOrigin((o) => clampCoord({ ...o, [k]: Number(e.target.value) }))}
                      />
                    </label>
                  ))}
                  <button className="btn-primary !px-3 !py-1 text-xs" disabled={!placeValid} onClick={() => doPlace()}>
                    {t("game.place")}
                  </button>
                  <span className="text-xs text-perill">{placeError ?? (!placeValid ? canPlace(state.players[placingPlayer!].fleet, sel.type, origin, axis, sel.id).reason : "")}</span>
                </div>
              )}
              <p className="mt-1 text-[11px] text-mar-300/70">
                {t("game.placeHint", { ship: t(`ship.${sel?.type ?? "carrier"}`).toLowerCase(), z: SHIPS[sel?.type ?? "carrier"].allowedZ.join(", ") })}
              </p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="card !p-3 text-sm">
                <p className="text-xs font-extrabold uppercase tracking-wide text-mar-300">{t("game.fleetStatus")}</p>
                <p className="coord mt-1">{t("game.ships")} <b>{fleetAlive(myFleet)}/{FLEET_SHIP_COUNT}</b> {fleetAlive(myFleet) === FLEET_SHIP_COUNT ? "✓" : ""}</p>
                <p className="coord">{t("game.lives")} <b>{fleetLife(myFleet)}/{FLEET_TOTAL_LIFE}</b></p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-mar-950">
                  <div className="h-full bg-estrategia transition-all" style={{ width: `${(fleetLife(myFleet) / FLEET_TOTAL_LIFE) * 100}%` }} />
                </div>
                <ul className="mt-2 space-y-0.5 text-xs text-mar-100/75">
                  {myFleet.map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span>{SHIPS[s.type].emoji} {t(`ship.${s.type}`)} {s.id.split("-")[1]}</span>
                      <span className="coord">{s.cellLife.reduce((a, b) => a + b, 0)}/{SHIPS[s.type].life}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <ScoreBoard title={t("game.received")} attacks={incoming} emptyText={t("game.noReceived")} />
            </div>
          )}
        </section>

        {/* VISOR 2 */}
        <section className="flex min-h-[420px] flex-col">
          {state.phase === "playing" || state.phase === "finished" ? (
            <AttackViewer
              attacks={state.players[me].attacks}
              weapons={state.players[me].weapons}
              canFire={state.phase === "playing" && state.current === me && !handoff}
              waiting={waiting}
              onFire={onFire}
              lastResult={state.players[me].attacks.at(-1) ?? null}
            />
          ) : (
            <div className="card flex flex-1 flex-col items-center justify-center text-center">
              <div className="text-5xl">🎯</div>
              <p className="mt-3 font-extrabold">{t("game.attackWaits")}</p>
              {mode === "online" && !iAmPlacing && <p className="mt-2 text-sm text-mar-300">{t("game.waitRival")}</p>}
              {mode === "local" && <p className="mt-2 text-sm text-mar-100/70">{t("game.localWarn")}</p>}
            </div>
          )}
        </section>
      </main>

      {/* Canvi de torn (mode local) */}
      <AnimatePresence>
        {handoff && state.phase !== "finished" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-mar-950/97 p-6">
            <div className="card max-w-md text-center">
              <div className="text-5xl">🔁</div>
              <h2 className="mt-3 text-2xl font-black">{t("game.handoffTitle", { name: state.players[state.phase === "placing-b" ? "b" : state.phase === "placing-a" ? "a" : state.current].name })}</h2>
              <p className="mt-2 text-sm text-mar-100/75">{t("game.handoffText")}</p>
              <button className="btn-primary mt-5 w-full" onClick={() => setHandoff(false)}>
                {t("game.handoffBtn", { name: state.players[state.phase === "placing-b" ? "b" : state.phase === "placing-a" ? "a" : state.current].name })}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {state.phase === "finished" && (
        <GameResult state={state} me={me} onPlayAgain={playAgain} onSaveMemorable={hasSession && mode !== "tutorial" ? () => persist(state, true) : undefined} />
      )}
    </div>
  );
}
