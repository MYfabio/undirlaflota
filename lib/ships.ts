/**
 * Definicions de vaixells, avions i armes.
 *
 * Tres capes: aire (caces i bombarders, z = 1 o 2), superfície (portaavions i
 * fragates, z = 0) i sota l'aigua (submarins, z = -1 o -2). Els torpedes toquen
 * z ≤ 0 i els atacs aeris z ≥ 0: la superfície és vulnerable a totes dues armes.
 *
 * Cada unitat ocupa `cells` cel·les en línia recta (eix X o Y) i té `life`
 * punts de vida totals repartits uniformement (life / cells punts per cel·la).
 * Un portaavions de 5 cel·les i 25 punts necessita 5 torpedes (5 de dany)
 * ben dirigits per enfonsar-se del tot.
 */
import { TOTAL_WEAPONS } from "./config";

export type Zone = "surface" | "underwater" | "air";
export type ShipType = "carrier" | "frigate" | "submarine" | "fighter" | "bomber";
export type WeaponType = "torpedo" | "airstrike";
export type Axis = "x" | "y";

export interface ShipDef {
  type: ShipType;
  name: string;
  plural: string;
  size: number; // punts de vida (= life); nom mantingut per compatibilitat amb l'especificació
  cells: number; // longitud en cel·les
  count: number; // quants en té cada flota
  life: number;
  model: string; // fitxer .glb dins /public/models
  zones: Zone[];
  allowedZ: number[]; // nivells Z on es pot col·locar
  color: number; // color del placeholder si no hi ha model
  emoji: string;
}

export const SHIPS: Record<ShipType, ShipDef> = {
  carrier: {
    type: "carrier",
    name: "Portaavions",
    plural: "Portaavions",
    size: 25,
    cells: 5,
    count: 2,
    life: 25,
    model: "carrier.glb",
    zones: ["surface"],
    allowedZ: [0],
    color: 0x9ca3af,
    emoji: "🛳️",
  },
  frigate: {
    type: "frigate",
    name: "Fragata",
    plural: "Fragates",
    size: 15,
    cells: 3,
    count: 3,
    life: 15,
    model: "frigate.glb",
    zones: ["surface"],
    allowedZ: [0],
    color: 0x64748b,
    emoji: "🚢",
  },
  submarine: {
    type: "submarine",
    name: "Submarí",
    plural: "Submarins",
    size: 12,
    cells: 3,
    count: 2,
    life: 12,
    model: "submarine.glb",
    zones: ["underwater"],
    allowedZ: [-1, -2],
    color: 0x1f2937,
    emoji: "🫧",
  },
  fighter: {
    type: "fighter",
    name: "Caça",
    plural: "Caces",
    size: 8,
    cells: 2,
    count: 2,
    life: 8,
    model: "fighter.glb",
    zones: ["air"],
    allowedZ: [1, 2],
    color: 0xe5e7eb,
    emoji: "🛩️",
  },
  bomber: {
    type: "bomber",
    name: "Bombarder",
    plural: "Bombarders",
    size: 12,
    cells: 3,
    count: 1,
    life: 12,
    model: "bomber.glb",
    zones: ["air"],
    allowedZ: [1, 2],
    color: 0x6b7280,
    emoji: "✈️",
  },
};

export interface WeaponDef {
  type: WeaponType;
  name: string;
  damage: number;
  range: "3D" | "3D+surface";
  count: number;
  /** Nivells Z on l'arma pot fer mal. */
  hitsZ: (z: number) => boolean;
  emoji: string;
  description: string;
}

export const WEAPONS: Record<WeaponType, WeaponDef> = {
  torpedo: {
    type: "torpedo",
    name: "Torpede",
    damage: 5,
    range: "3D",
    count: TOTAL_WEAPONS.torpedo,
    hitsZ: (z) => z <= 0, // superfície i sota l'aigua
    emoji: "🎯",
    description: "Toca la superfície i qualsevol profunditat (Z ≤ 0). Dany 5.",
  },
  airstrike: {
    type: "airstrike",
    name: "Atac aeri",
    damage: 7,
    range: "3D+surface",
    count: TOTAL_WEAPONS.airstrike,
    hitsZ: (z) => z >= 0, // superfície i aire
    emoji: "🚀",
    description: "Només toca objectius a la superfície o a l'aire (Z ≥ 0). Dany 7.",
  },
};

export const SHIP_ORDER: ShipType[] = ["carrier", "frigate", "submarine", "fighter", "bomber"];

/** Vida total d'una flota completa (2×25 + 3×15 + 2×12 + 2×8 + 1×12 = 147). */
export const FLEET_TOTAL_LIFE = SHIP_ORDER.reduce(
  (acc, t) => acc + SHIPS[t].count * SHIPS[t].life,
  0,
);
export const FLEET_SHIP_COUNT = SHIP_ORDER.reduce((a, t) => a + SHIPS[t].count, 0);
