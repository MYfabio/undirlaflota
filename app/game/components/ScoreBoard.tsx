"use client";

/**
 * Miniatura d'impactes: historial dels últims atacs (propis o rebuts).
 */
import type { AttackResult } from "@/lib/collision";
import { fmtCoord } from "@/lib/grid";
import { WEAPONS } from "@/lib/ships";
import { useT } from "@/components/LangProvider";

interface Props {
  title: string;
  attacks: AttackResult[];
  limit?: number;
  emptyText?: string;
}

const ICON: Record<AttackResult["outcome"], string> = {
  hit: "🔴",
  sunk: "💀",
  miss: "⚪",
  repeat: "↩️",
  invalid: "❌",
};

export default function ScoreBoard({ title, attacks, limit = 10, emptyText }: Props) {
  const { t } = useT();
  const list = attacks.slice(-limit).reverse();
  return (
    <div className="card !p-3">
      <p className="text-xs font-extrabold uppercase tracking-wide text-mar-300">
        📍 {title} <span className="text-mar-300/60">({attacks.length})</span>
      </p>
      <ul className="scroll-thin mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
        {list.length === 0 && <li className="text-mar-100/50">{emptyText ?? t("game.noShots")}</li>}
        {list.map((a, i) => (
          <li key={`${a.turn}-${a.by}-${i}`} className="flex items-center gap-2">
            <span>{ICON[a.outcome]}</span>
            <span className="coord font-bold">{fmtCoord(a.coord)}</span>
            <span className="text-mar-100/70">{WEAPONS[a.weapon].emoji}</span>
            <span className={`ml-auto text-xs ${a.outcome === "miss" ? "text-mar-100/50" : "text-batalla"}`}>
              {t(`outcome.${a.outcome}`)}
              {a.shipType ? ` · ${t(`ship.${a.shipType}`)}` : ""}
              {a.damage ? ` −${a.damage}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
