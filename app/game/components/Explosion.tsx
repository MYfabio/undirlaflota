"use client";

/**
 * Explosió procedimental lleugera: esfera de foc que s'expandeix i s'esvaeix,
 * anell d'ona expansiva i partícules. Sense textures ni models: carrega instantània.
 * Per a "sunk" és més gran i dura més. Per a "miss" fa un esquitx d'aigua.
 */
import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { toWorld, type Coord } from "@/lib/grid";
import type { AttackOutcome } from "@/lib/collision";

interface Props {
  coord: Coord;
  outcome: AttackOutcome;
  startedAt: number; // Date.now() en el moment de l'impacte
  onDone?: () => void;
}

const COUNT = 28;
const HAS_EXPLOSION_MODEL = (process.env.NEXT_PUBLIC_AVAILABLE_MODELS ?? "").includes("explosion.glb");

/** Malla d'explosió de Sketchfab (andersdt, CC-BY): creix i s'esvaeix per als enfonsaments. */
function ExplosionModel({ startedAt, duration }: { startedAt: number; duration: number }) {
  const { scene } = useGLTF("/models/explosion.glb");
  const ref = useRef<THREE.Group>(null);
  const clone = useMemo(() => {
    const c = scene.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    const s = 1 / (Math.max(size.x, size.y, size.z) || 1);
    const center = new THREE.Vector3();
    box.getCenter(center);
    c.position.copy(center.multiplyScalar(-s));
    c.scale.setScalar(s);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        const mat = (m.material as THREE.MeshStandardMaterial).clone();
        mat.transparent = true;
        mat.depthWrite = false;
        mat.emissive = new THREE.Color("#ff5a00");
        mat.emissiveIntensity = 0.8;
        m.material = mat;
      }
    });
    return c;
  }, [scene]);
  useFrame(() => {
    if (!ref.current) return;
    const k = Math.min(1, (Date.now() - startedAt) / 1000 / duration);
    const s = 0.3 + k * 3.2;
    ref.current.scale.setScalar(s);
    ref.current.rotation.y = k * 1.2;
    ref.current.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) (m.material as THREE.MeshStandardMaterial).opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    });
  });
  return (
    <group ref={ref} position={[0, 0.3, 0]}>
      <primitive object={clone} />
    </group>
  );
}

export default function Explosion({ coord, outcome, startedAt, onDone }: Props) {
  const isMiss = outcome === "miss";
  const big = outcome === "sunk";
  const duration = big ? 1.6 : isMiss ? 0.9 : 1.1;
  const fire = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const parts = useRef<THREE.Points>(null);
  const done = useRef(false);

  const velocities = useMemo(() => {
    const v: THREE.Vector3[] = [];
    for (let i = 0; i < COUNT; i++) {
      v.push(new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * (isMiss ? 2.2 : 1.4), (Math.random() - 0.5) * 2).normalize().multiplyScalar(1.2 + Math.random() * 1.5));
    }
    return v;
  }, [isMiss]);
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);

  useFrame(() => {
    const t = (Date.now() - startedAt) / 1000;
    const k = Math.min(1, t / duration);
    if (fire.current) {
      const s = (big ? 1.6 : isMiss ? 0.5 : 1.0) * (0.2 + Math.sin(k * Math.PI) * 1.0);
      fire.current.scale.setScalar(Math.max(0.01, s));
      const m = fire.current.material as THREE.MeshBasicMaterial;
      m.opacity = (1 - k) * 0.9;
    }
    if (ring.current) {
      ring.current.scale.setScalar(0.2 + k * (big ? 3 : 1.8));
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.6;
    }
    if (parts.current) {
      const p = parts.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < COUNT; i++) {
        const v = velocities[i];
        p.setXYZ(i, v.x * t, v.y * t - 2.5 * t * t, v.z * t);
      }
      p.needsUpdate = true;
      (parts.current.material as THREE.PointsMaterial).opacity = (1 - k) * 0.9;
    }
    if (k >= 1 && !done.current) {
      done.current = true;
      onDone?.();
    }
  });

  const fireColor = isMiss ? "#9dd7ff" : big ? "#ff6a00" : "#ffb020";
  return (
    <group position={toWorld(coord)}>
      <mesh ref={fire}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={fireColor} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.55, 32]} />
        <meshBasicMaterial color={isMiss ? "#bfe3ff" : "#ffd166"} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <points ref={parts}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={isMiss ? 0.08 : 0.12} color={isMiss ? "#dff4ff" : "#ff8c42"} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      {big && (
        <pointLight color="#ff7a1a" intensity={3} distance={6} decay={2} />
      )}
      {big && HAS_EXPLOSION_MODEL && (
        <Suspense fallback={null}>
          <ExplosionModel startedAt={startedAt} duration={duration} />
        </Suspense>
      )}
    </group>
  );
}
