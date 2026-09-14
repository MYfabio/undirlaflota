"use client";

/**
 * Capçalera del joc: torn actual, jugadors i estat (esperant, col·locant, etc.).
 */
import { motion } from "framer-motion";
import type { GameState, PlayerId } from "@/lib/gameEngine";
import { useT } from "@/components/LangProvider";

interface Props {
  state: GameState;
  me: PlayerId;
  waiting?: boolean;
  onExit?: () => void;
}

export default function TurnIndicator({ state, me, waiting, onExit }: Props) {
  const { t } = useT();
  const a = state.players.a.name;
  const b = state.players.b.name;
  let status = "";
  if (state.phase === "placing-a") status = t("game.placingFleet", { name: a });
  else if (state.phase === "placing-b") status = t("game.placingFleet", { name: b });
  else if (state.phase === "finished") status = t("game.finished");
  else status = state.current === me ? t("game.yourTurn") : t("game.waitingFor", { name: state.players[state.current].name });
  const myTurn = state.phase === "playing" && state.current === me;

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-mar-300/10 bg-mar-950/80 px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="text-lg font-black">
          🫧 Undirlaflota <span className="rounded bg-batalla px-1 text-[10px] text-mar-950">3D</span>
        </span>
        <span className="hidden text-sm text-mar-100/70 sm:inline">
          {t("game.turn")} <span className="coord font-bold text-mar-50">{state.turn}</span> · {a} <span className="text-mar-300/60">vs.</span> {b}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <motion.span
          key={status}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`chip ${myTurn ? "border-batalla/60 bg-batalla/15 text-batalla" : waiting ? "border-mar-300/40 text-mar-300" : ""}`}
        >
          {waiting && <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-mar-300" />}
          {status}
        </motion.span>
        {onExit && (
          <button onClick={onExit} className="text-xs text-mar-300/70 underline hover:text-batalla">
            {t("game.exit")}
          </button>
        )}
      </div>
    </header>
  );
}
