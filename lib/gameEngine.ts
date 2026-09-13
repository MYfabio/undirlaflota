/**
 * Motor del joc Undirlaflota.
 *
 * Estat pur i funcions immutables (sense React ni Three.js) perquè es pugui
 * executar igual al client, al servidor (API) i als tests.
 *
 * Fases:
 *   placing-a → placing-b → playing → finished
 * Torns: A ataca → B ataca → A ataca ... (un tret per torn).
 * Final: tota la flota d'un jugador enfonsada, o cap dels dos té armes
 * (guanya qui ha fet més dany; empat possible).
 */
import { TOTAL_WEAPONS } from "./config";
import {
  canPlace,
  cellsOf,
  fleetAlive,
  fleetLife,
  makeShip,
  resolveAttack,
  type AttackResult,
  type PlacedShip,
} from "./collision";
import { allCoords, coordKey, manhattan, type Coord } from "./grid";
import { FLEET_TOTAL_LIFE, SHIPS, SHIP_ORDER, WEAPONS, type Axis, type ShipType, type WeaponType } from "./ships";

export type PlayerId = "a" | "b";
export type Phase = "placing-a" | "placing-b" | "playing" | "finished";
export type GameMode = "local" | "ai" | "online" | "tutorial";

export interface PlayerState {
  name: string;
  fleet: PlacedShip[];
  attacks: AttackResult[]; // atacs que AQUEST jugador ha fet
  weapons: Record<WeaponType, number>; // munició restant
  ready: boolean;
}

export interface GameState {
  id: string;
  mode: GameMode;
  phase: Phase;
  turn: number; // comença a 1
  current: PlayerId; // a qui li toca
  players: Record<PlayerId, PlayerState>;
  winner: PlayerId | "draw" | null;
  createdAt: number;
  finishedAt: number | null;
  lastResult: AttackResult | null;
}

export const other = (p: PlayerId): PlayerId => (p === "a" ? "b" : "a");

export function newPlayer(name: string): PlayerState {
  return {
    name,
    fleet: [],
    attacks: [],
    weapons: { torpedo: TOTAL_WEAPONS.torpedo, airstrike: TOTAL_WEAPONS.airstrike },
    ready: false,
  };
}

export function createGame(mode: GameMode, nameA: string, nameB: string, id?: string): GameState {
  return {
    id: id ?? `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    mode,
    phase: "placing-a",
    turn: 1,
    current: "a",
    players: { a: newPlayer(nameA), b: newPlayer(nameB) },
    winner: null,
    createdAt: Date.now(),
    finishedAt: null,
    lastResult: null,
  };
}

/* ───────────────────────── Col·locació ───────────────────────── */

/** Flota buida amb tots els vaixells pendents (sense posició). */
export function requiredShips(): { id: string; type: ShipType }[] {
  const out: { id: string; type: ShipType }[] = [];
  for (const t of SHIP_ORDER) for (let i = 1; i <= SHIPS[t].count; i++) out.push({ id: `${t}-${i}`, type: t });
  return out;
}

export function placeShip(
  state: GameState,
  player: PlayerId,
  id: string,
  type: ShipType,
  origin: Coord,
  axis: Axis,
): { state: GameState; error?: string } {
  const ps = state.players[player];
  const check = canPlace(ps.fleet, type, origin, axis, id);
  if (!check.ok) return { state, error: check.reason };
  const fleet = ps.fleet.filter((s) => s.id !== id).concat(makeShip(id, type, origin, axis));
  return { state: { ...state, players: { ...state.players, [player]: { ...ps, fleet } } } };
}

export function removeShip(state: GameState, player: PlayerId, id: string): GameState {
  const ps = state.players[player];
  return { ...state, players: { ...state.players, [player]: { ...ps, fleet: ps.fleet.filter((s) => s.id !== id) } } };
}

export function isFleetComplete(fleet: PlacedShip[]): boolean {
  const req = requiredShips();
  return req.every((r) => fleet.some((s) => s.id === r.id));
}

/** Col·locació aleatòria vàlida de tota la flota (IA i botó "Aleatori"). */
export function randomFleet(rng: () => number = Math.random): PlacedShip[] {
  const fleet: PlacedShip[] = [];
  for (const r of requiredShips()) {
    const def = SHIPS[r.type];
    for (let attempt = 0; attempt < 500; attempt++) {
      const axis: Axis = rng() < 0.5 ? "x" : "y";
      const z = def.allowedZ[Math.floor(rng() * def.allowedZ.length)];
      const origin = { x: Math.floor(rng() * 10), y: Math.floor(rng() * 10), z };
      if (canPlace(fleet, r.type, origin, axis).ok) {
        fleet.push(makeShip(r.id, r.type, origin, axis));
        break;
      }
    }
  }
  return fleet;
}

/** El jugador confirma la flota; avança la fase. */
export function confirmFleet(state: GameState, player: PlayerId): { state: GameState; error?: string } {
  const ps = state.players[player];
  if (!isFleetComplete(ps.fleet)) return { state, error: "Falten vaixells per col·locar" };
  const players = { ...state.players, [player]: { ...ps, ready: true } };
  let phase: Phase = state.phase;
  if (player === "a") phase = players.b.ready ? "playing" : "placing-b";
  else phase = players.a.ready ? "playing" : "placing-a";
  return { state: { ...state, players, phase } };
}

/* ───────────────────────── Atac ───────────────────────── */

export function canAttack(state: GameState, player: PlayerId, coord: Coord, weapon: WeaponType): string | null {
  if (state.phase !== "playing") return "La partida no està en joc";
  if (state.current !== player) return "No és el teu torn";
  const ps = state.players[player];
  if (ps.weapons[weapon] <= 0) return `No et queden ${WEAPONS[weapon].name.toLowerCase()}s`;
  if (ps.attacks.some((a) => coordKey(a.coord) === coordKey(coord))) return "Ja has atacat aquesta coordenada";
  if (!WEAPONS[weapon].hitsZ(coord.z)) return "Aquesta arma no arriba a aquesta profunditat";
  return null;
}

export function attack(
  state: GameState,
  player: PlayerId,
  coord: Coord,
  weapon: WeaponType,
): { state: GameState; result?: AttackResult; error?: string } {
  const err = canAttack(state, player, coord, weapon);
  if (err) return { state, error: err };
  const target = other(player);
  const ps = state.players[player];
  const { fleet, result } = resolveAttack(state.players[target].fleet, coord, weapon, ps.attacks, state.turn, player);
  if (result.outcome === "invalid" || result.outcome === "repeat") return { state, error: "Atac no vàlid" };

  const players: Record<PlayerId, PlayerState> = {
    ...state.players,
    [player]: {
      ...ps,
      attacks: [...ps.attacks, result],
      weapons: { ...ps.weapons, [weapon]: ps.weapons[weapon] - 1 },
    },
    [target]: { ...state.players[target], fleet },
  };

  let next: GameState = {
    ...state,
    players,
    lastResult: result,
    current: target,
    turn: player === "b" ? state.turn + 1 : state.turn,
  };
  next = checkEnd(next);
  return { state: next, result };
}

/** Comprova condicions de final de partida. */
export function checkEnd(state: GameState): GameState {
  if (state.phase !== "playing") return state;
  const a = state.players.a;
  const b = state.players.b;
  const aDead = fleetAlive(a.fleet) === 0;
  const bDead = fleetAlive(b.fleet) === 0;
  const aOut = a.weapons.torpedo + a.weapons.airstrike === 0;
  const bOut = b.weapons.torpedo + b.weapons.airstrike === 0;

  let winner: GameState["winner"] = null;
  if (bDead && !aDead) winner = "a";
  else if (aDead && !bDead) winner = "b";
  else if (aDead && bDead) winner = "draw";
  else if (aOut && bOut) {
    const dmgA = damageDealt(a);
    const dmgB = damageDealt(b);
    winner = dmgA === dmgB ? "draw" : dmgA > dmgB ? "a" : "b";
  }
  if (winner === null) return state;
  return { ...state, phase: "finished", winner, finishedAt: Date.now() };
}

/* ───────────────────────── Estadístiques ───────────────────────── */

export const damageDealt = (p: PlayerState) => p.attacks.reduce((a, r) => a + r.damage, 0);

export interface PlayerStats {
  shots: number;
  hits: number;
  sunk: number;
  accuracy: number; // 0-100
  damage: number;
  uniqueXY: number; // columnes (x,y) diferents explorades
  levelsUsed: number[]; // nivells Z usats
  avgJump: number; // distància Manhattan mitjana entre trets consecutius
  pattern: "sistemàtic" | "exploratori" | "mixt" | "insuficient";
  shipsAlive: number;
  lifeLeft: number;
  lifeTotal: number;
}

export function computeStats(state: GameState, player: PlayerId): PlayerStats {
  const p = state.players[player];
  const shots = p.attacks.length;
  const hits = p.attacks.filter((r) => r.outcome === "hit" || r.outcome === "sunk").length;
  const sunk = p.attacks.filter((r) => r.outcome === "sunk").length;
  const uniqueXY = new Set(p.attacks.map((r) => `${r.coord.x},${r.coord.y}`)).size;
  const levelsUsed = Array.from(new Set(p.attacks.map((r) => r.coord.z))).sort((a, b) => a - b);
  let jumps = 0;
  for (let i = 1; i < shots; i++) jumps += manhattan(p.attacks[i - 1].coord, p.attacks[i].coord);
  const avgJump = shots > 1 ? jumps / (shots - 1) : 0;
  let pattern: PlayerStats["pattern"] = "insuficient";
  if (shots >= 5) pattern = avgJump <= 2.5 ? "sistemàtic" : avgJump >= 6 ? "exploratori" : "mixt";
  return {
    shots,
    hits,
    sunk,
    accuracy: shots ? Math.round((hits / shots) * 100) : 0,
    damage: damageDealt(p),
    uniqueXY,
    levelsUsed,
    avgJump: Math.round(avgJump * 10) / 10,
    pattern,
    shipsAlive: fleetAlive(p.fleet),
    lifeLeft: fleetLife(p.fleet),
    lifeTotal: FLEET_TOTAL_LIFE,
  };
}

/* ───────────────────────── IA senzilla ───────────────────────── */

/**
 * IA "caça i enfonsa":
 *  - si hi ha impactes recents no enfonsats, dispara a cel·les veïnes (mateix Z);
 *  - si no, tria una coordenada aleatòria no atacada, prioritzant Z plausibles
 *    (0 per a superfície, -1/-2 per a submarins) i un patró de tauler d'escacs.
 * Arma: torpede per defecte; atac aeri si apunta a superfície i en queden.
 */
export function aiChooseAttack(state: GameState, player: PlayerId, rng: () => number = Math.random): { coord: Coord; weapon: WeaponType } | null {
  const p = state.players[player];
  const attacked = new Set(p.attacks.map((r) => coordKey(r.coord)));
  const enemy = state.players[other(player)];
  const sunkIds = new Set(enemy.fleet.filter((s) => cellsOf(s).length && s.cellLife.every((l) => l <= 0)).map((s) => s.id));
  const openHits = p.attacks.filter((r) => r.outcome === "hit" && r.shipId && !sunkIds.has(r.shipId));

  const pick = (coord: Coord): { coord: Coord; weapon: WeaponType } | null => {
    const weapon: WeaponType = coord.z >= 0 && p.weapons.airstrike > 0 && rng() < 0.4 ? "airstrike" : "torpedo";
    const w = p.weapons[weapon] > 0 ? weapon : p.weapons.torpedo > 0 ? "torpedo" : p.weapons.airstrike > 0 ? "airstrike" : null;
    if (!w) return null;
    if (!WEAPONS[w].hitsZ(coord.z)) return p.weapons.torpedo > 0 ? { coord, weapon: "torpedo" } : null;
    return { coord, weapon: w };
  };

  // 1. Continuar un impacte obert
  for (const h of openHits) {
    const c = h.coord;
    const neigh: Coord[] = [
      { x: c.x + 1, y: c.y, z: c.z },
      { x: c.x - 1, y: c.y, z: c.z },
      { x: c.x, y: c.y + 1, z: c.z },
      { x: c.x, y: c.y - 1, z: c.z },
    ].filter((n) => n.x >= 0 && n.x < 10 && n.y >= 0 && n.y < 10 && !attacked.has(coordKey(n)));
    if (neigh.length) return pick(neigh[Math.floor(rng() * neigh.length)]);
  }

  // 2. Cerca: nivells amb vaixells possibles, patró escacs
  const candidates = allCoords().filter(
    (c) => !attacked.has(coordKey(c)) && [0, -1, -2].includes(c.z) && (c.x + c.y + c.z) % 2 === 0,
  );
  const pool = candidates.length ? candidates : allCoords().filter((c) => !attacked.has(coordKey(c)));
  if (!pool.length) return null;
  // Pes: superfície té més vaixells (5 de 7)
  const weighted = pool.filter((c) => (c.z === 0 ? true : rng() < 0.45));
  const list = weighted.length ? weighted : pool;
  return pick(list[Math.floor(rng() * list.length)]);
}

/* ───────────────────────── Serialització ───────────────────────── */

export const serialize = (s: GameState) => JSON.stringify(s);
export const deserialize = (json: string): GameState => JSON.parse(json) as GameState;
