/**
 * Sistema de coordenades 3D del joc.
 *
 * Coordenada = { x, y, z } amb x,y ∈ [0,9] i z ∈ [-2,2].
 * La clau textual "x,y,z" s'usa per a mapes i comparacions ràpides.
 */
import { GRID_SIZE, Z_MAX, Z_MIN } from "./config";
import type { Axis } from "./ships";

export interface Coord {
  x: number;
  y: number;
  z: number;
}

export const coordKey = (c: Coord) => `${c.x},${c.y},${c.z}`;
export const parseKey = (k: string): Coord => {
  const [x, y, z] = k.split(",").map(Number);
  return { x, y, z };
};
export const coordsEqual = (a: Coord, b: Coord) => a.x === b.x && a.y === b.y && a.z === b.z;
export const fmtCoord = (c: Coord) => `(${c.x}, ${c.y}, ${c.z})`;

export function isInsideGrid(c: Coord): boolean {
  return (
    Number.isInteger(c.x) &&
    Number.isInteger(c.y) &&
    Number.isInteger(c.z) &&
    c.x >= 0 &&
    c.x < GRID_SIZE.x &&
    c.y >= 0 &&
    c.y < GRID_SIZE.y &&
    c.z >= Z_MIN &&
    c.z <= Z_MAX
  );
}

export function clampCoord(c: Coord): Coord {
  return {
    x: Math.min(GRID_SIZE.x - 1, Math.max(0, Math.round(c.x))),
    y: Math.min(GRID_SIZE.y - 1, Math.max(0, Math.round(c.y))),
    z: Math.min(Z_MAX, Math.max(Z_MIN, Math.round(c.z))),
  };
}

/** Cel·les que ocupa un vaixell que comença a `origin` i s'estén `cells` cel·les per `axis`. */
export function shipCells(origin: Coord, axis: Axis, cells: number): Coord[] {
  const out: Coord[] = [];
  for (let i = 0; i < cells; i++) {
    out.push({
      x: origin.x + (axis === "x" ? i : 0),
      y: origin.y + (axis === "y" ? i : 0),
      z: origin.z,
    });
  }
  return out;
}

/** Distància euclidiana entre dues coordenades. */
export function distance(a: Coord, b: Coord): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

/** Distància Manhattan (nombre de moviments unitaris). */
export function manhattan(a: Coord, b: Coord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
}

/** Etiqueta del nivell Z per a la interfície. */
export function zLabel(z: number): string {
  if (z > 0) return `Aire +${z}`;
  if (z === 0) return "Superfície";
  return `Profunditat ${z}`;
}

/** Conversió de la coordenada lògica a la posició al món Three.js (Z lògic = eix Y amunt). */
export function toWorld(c: Coord, cellSize = 1): [number, number, number] {
  return [
    (c.x - (GRID_SIZE.x - 1) / 2) * cellSize,
    c.z * cellSize,
    (c.y - (GRID_SIZE.y - 1) / 2) * cellSize,
  ];
}

/** Totes les coordenades del grid (500). */
export function allCoords(): Coord[] {
  const out: Coord[] = [];
  for (let z = Z_MIN; z <= Z_MAX; z++)
    for (let y = 0; y < GRID_SIZE.y; y++)
      for (let x = 0; x < GRID_SIZE.x; x++) out.push({ x, y, z });
  return out;
}

/** Sistema dièdric: projeccions ortogonals d'una coordenada. */
export function diedricProjections(c: Coord) {
  return {
    planta: { x: c.x, y: c.y }, // vista superior (X,Y)
    alcat: { x: c.x, z: c.z }, // vista frontal (X,Z)
    perfil: { y: c.y, z: c.z }, // vista lateral (Y,Z)
  };
}
