"use client";

/**
 * Sistema dièdric en SVG: planta (X-Y), alçat (X-Z) i perfil (Y-Z).
 * Mostra un punt objectiu i, opcionalment, punts extra (impactes) per contextualitzar.
 * No depèn de Three.js: s'usa al tutorial i al panell d'atac.
 */
import { GRID_SIZE, Z_MAX, Z_MIN } from "@/lib/config";
import type { Coord } from "@/lib/grid";
import { useT } from "./LangProvider";

interface Props {
  target: Coord;
  extras?: { coord: Coord; color: string }[];
  compact?: boolean;
}

const CELL = 14;

function View({
  title,
  cols,
  rows,
  rowLabels,
  colLabels,
  px,
  py,
  extras,
  compact,
}: {
  title: string;
  cols: number;
  rows: number;
  rowLabels: number[];
  colLabels: number[];
  px: number;
  py: number;
  extras: { x: number; y: number; color: string }[];
  compact?: boolean;
}) {
  const W = cols * CELL;
  const H = rows * CELL;
  const pad = 16;
  return (
    <svg viewBox={`0 0 ${W + pad + 4} ${H + pad + (compact ? 4 : 16)}`} className="w-full" role="img" aria-label={title}>
      {!compact && (
        <text x={pad + W / 2} y={10} textAnchor="middle" fontSize="9" fontWeight="700" fill="#eaf2fb">
          {title}
        </text>
      )}
      <g transform={`translate(${pad},${compact ? 2 : 14})`}>
        <rect width={W} height={H} fill="#0b2540" stroke="#4a9eff" strokeOpacity="0.4" />
        {Array.from({ length: cols + 1 }, (_, i) => (
          <line key={`c${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={H} stroke="#4a9eff" strokeOpacity="0.2" />
        ))}
        {Array.from({ length: rows + 1 }, (_, i) => (
          <line key={`r${i}`} x1={0} y1={i * CELL} x2={W} y2={i * CELL} stroke="#4a9eff" strokeOpacity="0.2" />
        ))}
        {extras.map((e, i) => (
          <rect key={i} x={e.x * CELL + 2} y={e.y * CELL + 2} width={CELL - 4} height={CELL - 4} fill={e.color} opacity="0.7" rx="2" />
        ))}
        <circle cx={px * CELL + CELL / 2} cy={py * CELL + CELL / 2} r={CELL / 2 - 2} fill="#f5c518" stroke="#0b2540" />
        {colLabels.map((l, i) => (
          <text key={`cl${i}`} x={i * CELL + CELL / 2} y={-3} fontSize="6" textAnchor="middle" fill="#6fb3e6">
            {l}
          </text>
        ))}
        {rowLabels.map((l, i) => (
          <text key={`rl${i}`} x={-3} y={i * CELL + CELL / 2 + 2} fontSize="6" textAnchor="end" fill="#6fb3e6">
            {l}
          </text>
        ))}
      </g>
    </svg>
  );
}

export default function DiedricViews({ target, extras = [], compact }: Props) {
  const { t } = useT();
  const zRows = Array.from({ length: Z_MAX - Z_MIN + 1 }, (_, i) => Z_MAX - i); // de dalt (+2) a baix (-2)
  const zToRow = (z: number) => Z_MAX - z;
  const xs = Array.from({ length: GRID_SIZE.x }, (_, i) => i);
  const ys = Array.from({ length: GRID_SIZE.y }, (_, i) => i);
  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3"}`}>
      <View
        title={t("diedric.planta")}
        cols={GRID_SIZE.x}
        rows={GRID_SIZE.y}
        colLabels={xs}
        rowLabels={ys}
        px={target.x}
        py={target.y}
        extras={extras.map((e) => ({ x: e.coord.x, y: e.coord.y, color: e.color }))}
        compact={compact}
      />
      <View
        title={t("diedric.alcat")}
        cols={GRID_SIZE.x}
        rows={zRows.length}
        colLabels={xs}
        rowLabels={zRows}
        px={target.x}
        py={zToRow(target.z)}
        extras={extras.map((e) => ({ x: e.coord.x, y: zToRow(e.coord.z), color: e.color }))}
        compact={compact}
      />
      <View
        title={t("diedric.perfil")}
        cols={GRID_SIZE.y}
        rows={zRows.length}
        colLabels={ys}
        rowLabels={zRows}
        px={target.y}
        py={zToRow(target.z)}
        extras={extras.map((e) => ({ x: e.coord.y, y: zToRow(e.coord.z), color: e.color }))}
        compact={compact}
      />
    </div>
  );
}
