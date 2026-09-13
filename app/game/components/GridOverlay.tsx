"use client";

/**
 * Grid 3D amb línies subtils per nivell Z, etiquetes d'eixos i cel·les clicables.
 * - `onPick(coord)`: clic sobre una cel·la (per apuntar o col·locar).
 * - `cursor`: cel·la ressaltada (objectiu actual).
 * - `marks`: impactes / aigua ja coneguts.
 * - `activeZ`: només el nivell Z actiu es fa interactiu i més visible.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { GRID_COLOR, GRID_SIZE, HIT_COLOR, MISS_COLOR, SUNK_COLOR, Z_MAX, Z_MIN } from "@/lib/config";
import { coordKey, toWorld, type Coord } from "@/lib/grid";
import type { AttackOutcome } from "@/lib/collision";

export interface GridMark {
  coord: Coord;
  outcome: AttackOutcome;
}

interface Props {
  onPick?: (c: Coord) => void;
  cursor?: Coord | null;
  marks?: GridMark[];
  activeZ?: number;
  showLabels?: boolean;
  interactive?: boolean;
}

const half = { x: (GRID_SIZE.x - 1) / 2, y: (GRID_SIZE.y - 1) / 2 };

function LevelLines({ z, strong }: { z: number; strong: boolean }) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= GRID_SIZE.x; i++) {
      const x = i - half.x - 0.5;
      pts.push(x, z, -half.y - 0.5, x, z, half.y + 0.5);
    }
    for (let j = 0; j <= GRID_SIZE.y; j++) {
      const y = j - half.y - 0.5;
      pts.push(-half.x - 0.5, z, y, half.x + 0.5, z, y);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [z]);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={GRID_COLOR} transparent opacity={strong ? 0.55 : 0.12} />
    </lineSegments>
  );
}

function markColor(o: AttackOutcome) {
  if (o === "hit") return HIT_COLOR;
  if (o === "sunk") return SUNK_COLOR;
  return MISS_COLOR;
}

export default function GridOverlay({ onPick, cursor, marks = [], activeZ = 0, showLabels = true, interactive = true }: Props) {
  const levels = useMemo(() => Array.from({ length: Z_MAX - Z_MIN + 1 }, (_, i) => Z_MIN + i), []);

  const handleClick = (e: ThreeEvent<MouseEvent>, z: number) => {
    if (!onPick) return;
    e.stopPropagation();
    const p = e.point;
    const x = Math.round(p.x + half.x);
    const y = Math.round(p.z + half.y);
    if (x < 0 || x >= GRID_SIZE.x || y < 0 || y >= GRID_SIZE.y) return;
    onPick({ x, y, z });
  };

  return (
    <group>
      {levels.map((z) => (
        <group key={z}>
          <LevelLines z={z} strong={z === activeZ} />
          {/* Pla invisible per capturar clics del nivell actiu */}
          {interactive && z === activeZ && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, z, 0]} onClick={(e) => handleClick(e, z)}>
              <planeGeometry args={[GRID_SIZE.x, GRID_SIZE.y]} />
              <meshBasicMaterial color={GRID_COLOR} transparent opacity={0.04} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          )}
          {showLabels && (
            <Text position={[half.x + 1.2, z, -half.y - 0.9]} fontSize={0.35} color="#6fb3e6" anchorX="center">
              {`z=${z}`}
            </Text>
          )}
        </group>
      ))}

      {/* Etiquetes d'eixos al nivell 0 */}
      {showLabels &&
        Array.from({ length: GRID_SIZE.x }, (_, i) => (
          <Text key={`x${i}`} position={[i - half.x, 0.05, half.y + 1]} fontSize={0.35} color="#f5c518" anchorX="center">
            {String(i)}
          </Text>
        ))}
      {showLabels &&
        Array.from({ length: GRID_SIZE.y }, (_, j) => (
          <Text key={`y${j}`} position={[-half.x - 1, 0.05, j - half.y]} fontSize={0.35} color="#2ec4b6" anchorX="center">
            {String(j)}
          </Text>
        ))}
      {showLabels && (
        <>
          <Text position={[0, 0.05, half.y + 1.7]} fontSize={0.4} color="#f5c518" anchorX="center">X →</Text>
          <Text position={[-half.x - 1.8, 0.05, 0]} fontSize={0.4} color="#2ec4b6" anchorX="center" rotation={[0, Math.PI / 2, 0]}>Y →</Text>
          <Text position={[half.x + 1.2, Z_MAX + 0.7, -half.y - 0.9]} fontSize={0.4} color="#6fb3e6" anchorX="center">Z ↑</Text>
        </>
      )}

      {/* Marques d'atacs coneguts */}
      {marks.map((m) => {
        const pos = toWorld(m.coord);
        const c = markColor(m.outcome);
        const hit = m.outcome === "hit" || m.outcome === "sunk";
        return (
          <mesh key={coordKey(m.coord)} position={pos}>
            {hit ? <boxGeometry args={[0.7, 0.7, 0.7]} /> : <sphereGeometry args={[0.18, 12, 12]} />}
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={hit ? 0.6 : 0.1} transparent opacity={hit ? 0.9 : 0.6} />
          </mesh>
        );
      })}

      {/* Cursor objectiu */}
      {cursor && (
        <group position={toWorld(cursor)}>
          <mesh>
            <boxGeometry args={[0.95, 0.95, 0.95]} />
            <meshBasicMaterial color="#f5c518" wireframe />
          </mesh>
          <mesh>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshBasicMaterial color="#f5c518" transparent opacity={0.18} depthWrite={false} />
          </mesh>
          {/* Línies de projecció cap als plans (ajuda dièdrica) */}
          <mesh position={[0, -(cursor.z - Z_MIN) / 2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, Math.max(0.01, cursor.z - Z_MIN), 6]} />
            <meshBasicMaterial color="#f5c518" transparent opacity={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}
