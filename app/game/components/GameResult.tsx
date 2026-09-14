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
import { useT } from "@/components/LangProvider";

interface Props {
  state: GameState;
  me: PlayerId;
  onPlayAgain: () => void;
  onSaveMemorable?: () => Promise<boolean>;
}

function pedagogicalMessage(t: (k: string, v?: Record<string, string | number>) => string, uniqueXY: number, levels: number[], accuracy: number) {
  const parts: string[] = [];
  if (uniqueXY >= 20) parts.push(t("result.ped.xyHigh", { n: uniqueXY }));
  else if (uniqueXY >= 10) parts.push(t("result.ped.xyMid", { n: uniqueXY }));
  else parts.push(t("result.ped.xyLow", { n: uniqueXY }));
  if (levels.length >= 3) parts.push(t("result.ped.z3", { n: levels.length }));
  else if (levels.length === 2) parts.push(t("result.ped.z2"));
  else parts.push(t("result.ped.z1"));
  if (accuracy >= 40) parts.push(t("result.ped.acc"));
  return parts.join(" ");
}

export default function GameResult({ state, me, onPlayAgain, onSaveMemorable }: Props) {
  const { t } = useT();
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
            {draw ? t("result.draw") : won ? t("result.won", { name: myName }) : t("result.lost", { name: oppName })}
          </h1>
          <p className="mt-2 text-mar-100/75">
            {t("result.summary", { turns: state.turn, shots: state.players[me].attacks.length + state.players[opp].attacks.length })}
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
                <dt className="text-mar-100/70">{t("result.shots")}</dt>
                <dd className="text-right font-bold">{s.shots}</dd>
                <dt className="text-mar-100/70">{t("result.hits")}</dt>
                <dd className="text-right font-bold">{s.hits}</dd>
                <dt className="text-mar-100/70">{t("result.accuracy")}</dt>
                <dd className="text-right font-bold text-batalla">{s.accuracy}%</dd>
                <dt className="text-mar-100/70">{t("result.sunk")}</dt>
                <dd className="text-right font-bold">{s.sunk} / {FLEET_SHIP_COUNT}</dd>
                <dt className="text-mar-100/70">{t("result.damage")}</dt>
                <dd className="text-right font-bold">{s.damage}</dd>
                <dt className="text-mar-100/70">{t("result.ownFleet")}</dt>
                <dd className="text-right font-bold">{s.shipsAlive} {t("result.alive")} · {s.lifeLeft}/{s.lifeTotal}</dd>
                <dt className="text-mar-100/70">{t("result.pattern")}</dt>
                <dd className="text-right font-bold text-estrategia">{t(`pattern.${s.pattern}`)}</dd>
                <dt className="text-mar-100/70">{t("result.avgJump")}</dt>
                <dd className="text-right font-bold">{s.avgJump} {t("result.cells")}</dd>
              </dl>
            </div>
          ))}
        </div>

        <div className="card border-estrategia/40">
          <h2 className="font-extrabold text-estrategia">{t("result.pedagogy")}</h2>
          <p className="mt-2 text-mar-100/85">{pedagogicalMessage(t, mine.uniqueXY, mine.levelsUsed, mine.accuracy)}</p>
          <p className="mt-1 text-sm text-mar-100/60">
            {t("result.levels")} <span className="coord">{mine.levelsUsed.length ? mine.levelsUsed.join(", ") : t("result.none")}</span>
          </p>
        </div>

        {/* Replay */}
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-extrabold">{t("result.replay")}</h2>
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
              <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => setReplayIdx(null)}>{t("result.all")}</button>
            </div>
          </div>
          {current ? (
            <div className="mt-3">
              <p className="coord text-sm">
                {t("result.shotN", { n: shown.length })} <span className="font-bold text-batalla">{fmtCoord(current.coord)}</span> ·{" "}
                {current.outcome === "miss" ? t("game.water") : current.outcome === "sunk" ? t("outcome.sunk").toLowerCase() : t("game.hitLower")}
              </p>
              <div className="mt-2">
                <DiedricViews
                  target={current.coord}
                  extras={shown.slice(0, -1).map((a) => ({ coord: a.coord, color: a.outcome === "miss" ? "#94a3b8" : "#ff3333" }))}
                />
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-mar-100/60">{t("result.noShots")}</p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button className="btn-primary" onClick={onPlayAgain}>{t("result.again")}</button>
          <Link href="/" className="btn-secondary">{t("common.home")}</Link>
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
              {memorable === "saved" ? t("result.memorableSaved") : memorable === "error" ? t("result.memorableError") : t("result.memorable")}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
