/**
 * Constants globals d'Undirlaflota.
 * El grid és 10 × 10 × 5: X i Y de 0 a 9, Z de -2 a +2.
 *   Z > 0 → aire (avions / atacs aeris)
 *   Z = 0 → superfície (portaavions, fragates)
 *   Z < 0 → sota l'aigua (submarins)
 */
export const GRID_SIZE = { x: 10, y: 10, z: 5 } as const;
export const Z_MIN = -2;
export const Z_MAX = 2;
export const CELL_SIZE = 1; // unitats Three.js per cel·la

// Joc
export const MAX_TURNS_IDLE = 300; // segons sense activitat abans d'abandonar
export const TOTAL_WEAPONS = { torpedo: 20, airstrike: 10 } as const;

// Visual (colors hex numèrics per a Three.js)
export const GRID_COLOR = 0x4a9eff;
export const OCEAN_COLOR = 0x1a4d7a;
export const HIT_COLOR = 0xff3333;
export const MISS_COLOR = 0xcccccc;
export const SUNK_COLOR = 0x111827;

// Paleta CSS
export const PALETTE = {
  mar: "#1a4d7a",
  marFosc: "#0b2540",
  batalla: "#f5c518",
  estrategia: "#2ec4b6",
  perill: "#ff3333",
} as const;

export const APP_NAME = "Undirlaflota";
export const APP_TAGLINE = "Enfonsar la flota en 3D";
export const APP_DOMAIN = "enfonsarlaflota.aulaia.cat";
