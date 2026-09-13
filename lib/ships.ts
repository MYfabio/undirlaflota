/**
 * Definicions de vaixells, avions i armes.
 *
 * Cada vaixell ocupa `cells` cel·les en línia recta (eix X o Y) i té `life`
 * punts de vida totals repartits uniformement (life / cells punts per cel·la).
 * Un portaavions de 5 cel·les i 25 punts necessita 5 torpedes (5 de dany)
 * ben dirigits per enfonsar-se del tot.
 */
import { TOTAL_WEAPONS } from "./config";

export type Zone = "surface" | "underwater" | "air";
export type ShipType = "carrier" | "frigate" | "submarine";
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
    hitsZ: () => true,
    emoji: "🎯",
    description: "Arriba a qualsevol profunditat. Dany 5.",
  },
  airstrike: {
    type: "airstrike",
    name: "Atac aeri",
    damage: 7,
    range: "3D+surface",
    count: TOTAL_WEAPONS.airstrike,
    hitsZ: (z) => z >= 0,
    emoji: "✈️",
    description: "Només toca objectius a la superfície o a l'aire (Z ≥ 0). Dany 7.",
  },
};

/** Models d'avions (decoratius / tutorial). */
export const AIRCRAFT = {
  fighter: { name: "Caça", model: "fighter.glb", emoji: "🛩️" },
  bomber: { name: "Bombarder", model: "bomber.glb", emoji: "✈️" },
} as const;

export const SHIP_ORDER: ShipType[] = ["carrier", "frigate", "submarine"];

/** Vida total d'una flota completa (2×25 + 3×15 + 2×12 = 119). */
export const FLEET_TOTAL_LIFE = SHIP_ORDER.reduce(
  (acc, t) => acc + SHIPS[t].count * SHIPS[t].life,
  0,
);
export const FLEET_SHIP_COUNT = SHIP_ORDER.reduce((a, t) => a + SHIPS[t].count, 0);
