/**
 * Detecció d'impactes.
 *
 * Un atac a (x,y,z) amb una arma impacta si:
 *  1. l'arma pot fer mal a aquest nivell Z (els atacs aeris no arriben sota l'aigua),
 *  2. alguna cel·la d'un vaixell coincideix exactament amb la coordenada,
 *  3. la cel·la encara té vida.
 */
import { coordKey, isInsideGrid, shipCells, type Coord } from "./grid";
import { SHIPS, WEAPONS, type Axis, type ShipType, type WeaponType } from "./ships";

export interface PlacedShip {
  id: string;
  type: ShipType;
  origin: Coord;
  axis: Axis;
  /** Vida restant per cel·la, en el mateix ordre que shipCells(). */
  cellLife: number[];
}

export type AttackOutcome = "hit" | "miss" | "sunk" | "repeat" | "invalid";

export interface AttackResult {
  coord: Coord;
  weapon: WeaponType;
  outcome: AttackOutcome;
  damage: number;
  shipId?: string;
  shipType?: ShipType;
  turn: number;
  by: "a" | "b";
}

export function makeShip(id: string, type: ShipType, origin: Coord, axis: Axis): PlacedShip {
  const def = SHIPS[type];
  return {
    id,
    type,
    origin,
    axis,
    cellLife: Array(def.cells).fill(def.life / def.cells),
  };
}

export const shipLife = (s: PlacedShip) => s.cellLife.reduce((a, b) => a + b, 0);
export const isSunk = (s: PlacedShip) => shipLife(s) <= 0;
export const fleetLife = (fleet: PlacedShip[]) => fleet.reduce((a, s) => a + shipLife(s), 0);
export const fleetAlive = (fleet: PlacedShip[]) => fleet.filter((s) => !isSunk(s)).length;
export const cellsOf = (s: PlacedShip) => shipCells(s.origin, s.axis, SHIPS[s.type].cells);

/** Comprova si un vaixell es pot col·locar sense sortir del grid, a un Z permès i sense solapar-se. */
export function canPlace(
  fleet: PlacedShip[],
  type: ShipType,
  origin: Coord,
  axis: Axis,
  ignoreId?: string,
): { ok: boolean; reason?: string } {
  const def = SHIPS[type];
  if (!def.allowedZ.includes(origin.z)) {
    return { ok: false, reason: `${def.name}: nivell Z no permès (permesos: ${def.allowedZ.join(", ")})` };
  }
  const cells = shipCells(origin, axis, def.cells);
  if (!cells.every(isInsideGrid)) return { ok: false, reason: "Surt del grid" };
  const occupied = new Set<string>();
  for (const s of fleet) {
    if (s.id === ignoreId) continue;
    for (const c of cellsOf(s)) occupied.add(coordKey(c));
  }
  if (cells.some((c) => occupied.has(coordKey(c)))) return { ok: false, reason: "Es solapa amb un altre vaixell" };
  return { ok: true };
}

/**
 * Aplica un atac sobre una flota. Retorna la flota actualitzada (immutable) i el resultat.
 */
export function resolveAttack(
  fleet: PlacedShip[],
  coord: Coord,
  weapon: WeaponType,
  previous: AttackResult[],
  turn: number,
  by: "a" | "b",
): { fleet: PlacedShip[]; result: AttackResult } {
  const base = { coord, weapon, turn, by, damage: 0 };
  if (!isInsideGrid(coord)) return { fleet, result: { ...base, outcome: "invalid" } };
  if (previous.some((p) => coordKey(p.coord) === coordKey(coord))) {
    return { fleet, result: { ...base, outcome: "repeat" } };
  }
  const w = WEAPONS[weapon];
  if (!w.hitsZ(coord.z)) return { fleet, result: { ...base, outcome: "miss" } };

  const key = coordKey(coord);
  for (let i = 0; i < fleet.length; i++) {
    const s = fleet[i];
    const idx = cellsOf(s).findIndex((c) => coordKey(c) === key);
    if (idx === -1 || s.cellLife[idx] <= 0) continue;
    const damage = Math.min(s.cellLife[idx], w.damage);
    const cellLife = [...s.cellLife];
    cellLife[idx] -= damage;
    const updated = { ...s, cellLife };
    const newFleet = fleet.map((f, j) => (j === i ? updated : f));
    return {
      fleet: newFleet,
      result: {
        ...base,
        damage,
        shipId: s.id,
        shipType: s.type,
        outcome: isSunk(updated) ? "sunk" : "hit",
      },
    };
  }
  return { fleet, result: { ...base, outcome: "miss" } };
}
