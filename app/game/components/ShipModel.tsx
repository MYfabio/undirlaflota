"use client";

/**
 * Renderitzador de vaixells.
 * Si el fitxer /models/<tipus>.glb existeix, el carrega amb useGLTF i l'escala
 * a la longitud del vaixell. Si no, dibuixa un placeholder procedimental
 * (casc + torre) amb el color del tipus. Les cel·les danyades es marquen en vermell.
 */
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { SHIPS } from "@/lib/ships";
import { cellsOf, isSunk, type PlacedShip } from "@/lib/collision";
import { toWorld } from "@/lib/grid";
import { HIT_COLOR } from "@/lib/config";

interface Props {
  ship: PlacedShip;
  ghost?: boolean; // previsualització durant la col·locació
  invalid?: boolean;
  showDamage?: boolean;
  onClick?: () => void;
}

/** Models disponibles localment (s'actualitza quan es descarreguen a public/models). */
const AVAILABLE_MODELS = new Set<string>(
  (process.env.NEXT_PUBLIC_AVAILABLE_MODELS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
);

function GltfShip({ file, length }: { file: string; length: number }) {
  const { scene } = useGLTF(`/models/${file}`);
  const clone = useMemo(() => {
    const c = scene.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    const longest = Math.max(size.x, size.z) || 1;
    const s = length / longest;
    c.scale.setScalar(s);
    // Centrem el model
    const center = new THREE.Vector3();
    box.getCenter(center);
    c.position.sub(center.multiplyScalar(s));
    return c;
  }, [scene, length]);
  return <primitive object={clone} />;
}

function ProceduralShip({ ship, color }: { ship: PlacedShip; color: number }) {
  const def = SHIPS[ship.type];
  const len = def.cells * 0.92;
  if (ship.type === "submarine") {
    return (
      <group>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.28, len - 0.6, 6, 14]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.6, 0.35, 0.3]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.4} />
        </mesh>
      </group>
    );
  }
  if (ship.type === "fighter" || ship.type === "bomber") {
    const isBomber = ship.type === "bomber";
    return (
      <group position={[0, 0.15, 0]}>
        {/* Fuselatge */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[isBomber ? 0.16 : 0.11, len - 0.5, 4, 10]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Ales */}
        <mesh position={[isBomber ? 0 : -len * 0.05, 0, 0]} castShadow>
          <boxGeometry args={[isBomber ? 0.5 : 0.35, 0.05, isBomber ? len * 1.1 : len * 0.9]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Cua */}
        <mesh position={[-len * 0.42, 0.12, 0]}>
          <boxGeometry args={[0.25, 0.25, 0.05]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
        <mesh position={[-len * 0.42, 0, 0]}>
          <boxGeometry args={[0.25, 0.04, 0.5]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
      </group>
    );
  }
  const isCarrier = ship.type === "carrier";
  return (
    <group>
      {/* Casc */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[len, 0.3, isCarrier ? 0.8 : 0.5]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Coberta / torre */}
      {isCarrier ? (
        <mesh position={[len * 0.15, 0.45, 0.28]} castShadow>
          <boxGeometry args={[0.6, 0.4, 0.25]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      ) : (
        <>
          <mesh position={[0, 0.42, 0]} castShadow>
            <boxGeometry args={[len * 0.4, 0.3, 0.35]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[-len * 0.3, 0.4, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </>
      )}
    </group>
  );
}

export default function ShipModel({ ship, ghost, invalid, showDamage = true, onClick }: Props) {
  const def = SHIPS[ship.type];
  const cells = cellsOf(ship);
  // Centre del vaixell en coordenades món
  const first = toWorld(cells[0]);
  const last = toWorld(cells[cells.length - 1]);
  const center: [number, number, number] = [(first[0] + last[0]) / 2, first[1], (first[2] + last[2]) / 2];
  const rotY = ship.axis === "y" ? Math.PI / 2 : 0;
  const sunk = isSunk(ship);
  const color = invalid ? HIT_COLOR : sunk ? 0x3f3f46 : def.color;
  const useModel = AVAILABLE_MODELS.has(def.model);

  return (
    <group onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}>
      <group position={center} rotation={[0, rotY, 0]}>
        <group scale={ghost ? 1 : 1} position={[0, sunk ? -0.25 : 0, 0]} rotation={[0, 0, sunk ? 0.35 : 0]}>
          {useModel && !ghost ? (
            <Suspense fallback={<ProceduralShip ship={ship} color={color} />}>
              <GltfShip file={def.model} length={def.cells * 0.95} />
            </Suspense>
          ) : (
            <ProceduralShip ship={ship} color={color} />
          )}
        </group>
        {ghost && (
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[def.cells, 0.4, 1]} />
            <meshBasicMaterial color={invalid ? HIT_COLOR : 0x2ec4b6} transparent opacity={0.25} depthWrite={false} />
          </mesh>
        )}
      </group>
      {/* Cel·les danyades */}
      {showDamage &&
        cells.map((c, i) =>
          ship.cellLife[i] <= 0 ? (
            <mesh key={i} position={toWorld(c)}>
              <boxGeometry args={[0.6, 0.6, 0.6]} />
              <meshStandardMaterial color={HIT_COLOR} emissive={HIT_COLOR} emissiveIntensity={0.7} transparent opacity={0.85} />
            </mesh>
          ) : ship.cellLife[i] < def.life / def.cells ? (
            <mesh key={i} position={toWorld(c)}>
              <sphereGeometry args={[0.25, 10, 10]} />
              <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={0.5} />
            </mesh>
          ) : null,
        )}
    </group>
  );
}
