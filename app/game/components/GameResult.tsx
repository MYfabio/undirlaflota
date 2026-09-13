"use client";

/**
 * Pantalla de final de partida: guanyador, estadístiques, anàlisi pedagògica
 * i opcions (jugar de nou, replay, tornar a l'inici, partida memorable).
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { computeStats, type GameState, type PlayerId } from "@/lib/gameEngine";
import { fmtCoord } from "@/lib/grid";
import { FLEET_SHIP_COUNT } from "@/lib/ships";
import DiedricViews from "@/components/DiedricViews";

interface Props {
  state: GameState;
  me: PlayerId;
  onPlayAgain: () => void;
  onSaveMemorable?: () => Promise<boolean>;
}

function pedagogicalMessage(uniqueXY: number, levels: number[], accuracy: number) {
  const parts: string[] = [];
  if (uniqueXY >= 20) parts.push(`Has explorat ${uniqueXY} columnes (x, y) diferents: expert en cobertura del pla!`);
  else if (uniqueXY >= 10) parts.push(`Has usat ${uniqueXY} columnes (x, y) diferents. Bona exploració del pla.`);
  else parts.push(`Només ${uniqueXY} columnes (x, y) diferents: prova de repartir més els trets.`);
  if (levels.length >= 3) parts.push(`Has treballat ${levels.length} nivells Z: pensament 3D complet.`);
  else if (levels.length === 2) parts.push("Has usat 2 nivells Z. Recorda que els submarins poden ser a -1 o -2.");
  else parts.push("Has disparat sempre al mateix nivell Z: la tercera dimensió també compta!");
  if (accuracy >= 40) parts.push("Precisió alta: les deduccions han funcionat.");
  return parts.join(" ");
}

export default function GameResult({ state, me, onPlayAgain, onSaveMemorable }: Props) {
  const [replayIdx, setReplayIdx] = useState<number | null>(null);
  const [memorable, setMemorable] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const opp: PlayerId = me === "a" ? "b" : "a";
  const mine = useMemo(() => computeStats(state, me), [state, me]);
  const theirs = useMemo(() => computeStats(state, opp), [state, opp]);
  const won = state.winner === me;
  const draw = state.winner === "draw";
  const myName = state.players[me].name;
  const oppName = state.players[opp].name;

  const replay = state.players[me].attacks;
  const shown = replayIdx === null ? replay : replay.slice(0, replayIdx + 1);
  const current = shown[shown.length - 1];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 overflow-y-auto bg-mar-950/95 p-4 backdrop-blur">
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center">
          <div className="text-6xl">{draw ? "🤝" : won ? "🏆" : "🌊"}</div>
          <h1 className="mt-3 text-4xl font-black">
            {draw ? "Empat!" : won ? `Has guanyat, ${myName}!` : `Ha guanyat ${oppName}`}
          </h1>
          <p className="mt-2 text-mar-100/75">
            {state.turn} torns · {state.players[me].attacks.length + state.players[opp].attacks.length} trets en total
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { name: myName, s: mine, highlight: true },
            { name: oppName, s: theirs, highlight: false },
          ].map(({ name, s, highlight }) => (
            <div key={name} className={`card ${highlight ? "border-batalla/40" : ""}`}>
              <h2 className="text-lg font-extrabold">{name}</h2>
              <dl className="coord mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-mar-100/70">Trets</dt>
                <dd className="text-right font-bold">{s.shots}</dd>
                <dt className="text-mar-100/70">Impactes</dt>
                <dd className="text-right font-bold">{s.hits}</dd>
                <dt className="text-mar-100/70">Precisió</dt>
                <dd className="text-right font-bold text-batalla">{s.accuracy}%</dd>
                <dt className="text-mar-100/70">Vaixells enfonsats</dt>
                <dd className="text-right font-bold">{s.sunk} / {FLEET_SHIP_COUNT}</dd>
                <dt className="text-mar-100/70">Dany fet</dt>
                <dd className="text-right font-bold">{s.damage}</dd>
                <dt className="text-mar-100/70">Flota pròpia</dt>
                <dd className="text-right font-bold">{s.shipsAlive} vius · {s.lifeLeft}/{s.lifeTotal}</dd>
                <dt className="text-mar-100/70">Patró d&apos;atac</dt>
                <dd className="text-right font-bold text-estrategia">{s.pattern}</dd>
                <dt className="text-mar-100/70">Salt mitjà</dt>
                <dd className="text-right font-bold">{s.avgJump} cel·les</dd>
              </dl>
            </div>
          ))}
        </div>

        <div className="card border-estrategia/40">
          <h2 className="font-extrabold text-estrategia">📐 Connexió pedagògica</h2>
          <p className="mt-2 text-mar-100/85">{pedagogicalMessage(mine.uniqueXY, mine.levelsUsed, mine.accuracy)}</p>
          <p className="mt-1 text-sm text-mar-100/60">
            Nivells Z usats: <span className="coord">{mine.levelsUsed.length ? mine.levelsUsed.join(", ") : "cap"}</span>
          </p>
        </div>

        {/* Replay */}
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-extrabold">🎬 Anàlisi de la partida (replay)</h2>
            <div className="flex items-center gap-2">
              <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => setReplayIdx((i) => Math.max(0, (i ?? replay.length) - 1))} disabled={!replay.length}>
                ◀
              </button>
              <span className="coord text-sm">
                {replay.length ? `${shown.length} / ${replay.length}` : "—"}
              </span>
              <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => setReplayIdx((i) => Math.min(replay.length - 1, (i ?? replay.length - 1) + 1))} disabled={!replay.length}>
                ▶
              </button>
              <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => setReplayIdx(null)}>Tot</button>
            </div>
          </div>
          {current ? (
            <div className="mt-3">
              <p className="coord text-sm">
                Tret {shown.length}: <span className="font-bold text-batalla">{fmtCoord(current.coord)}</span> ·{" "}
                {current.outcome === "miss" ? "aigua" : current.outcome === "sunk" ? "enfonsat" : "tocat"}
              </p>
              <div className="mt-2">
                <DiedricViews
                  target={current.coord}
                  extras={shown.slice(0, -1).map((a) => ({ coord: a.coord, color: a.outcome === "miss" ? "#94a3b8" : "#ff3333" }))}
                />
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-mar-100/60">No hi ha trets per analitzar.</p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button className="btn-primary" onClick={onPlayAgain}>🔄 Jugar de nou</button>
          <Link href="/" className="btn-secondary">🏠 Tornar a l&apos;inici</Link>
          {onSaveMemorable && (
            <button
              className="btn-success"
              disabled={memorable === "saving" || memorable === "saved"}
              onClick={async () => {
                setMemorable("saving");
                const ok = await onSaveMemorable();
                setMemorable(ok ? "saved" : "error");
              }}
            >
              {memorable === "saved" ? "⭐ Guardada!" : memorable === "error" ? "No s'ha pogut guardar" : "⭐ Guardar com a partida memorable"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
