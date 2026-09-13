"use client";

/**
 * Entorn marí: pla d'aigua transparent a z = 0, fons fosc a z = -2.5,
 * il·luminació solar + punt de llum i partícules lleugeres.
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GRID_SIZE, OCEAN_COLOR, Z_MIN } from "@/lib/config";

function Particles({ count = 120 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * GRID_SIZE.x;
      arr[i * 3 + 1] = Z_MIN - 0.4 + Math.random() * 2.4; // sota l'aigua
      arr[i * 3 + 2] = (Math.random() - 0.5) * GRID_SIZE.y;
    }
    return arr;
  }, [count]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const p = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) + dt * 0.15;
      if (y > -0.05) y = Z_MIN - 0.4;
      p.setY(i, y);
    }
    p.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#9dd7ff" transparent opacity={0.6} depthWrite={false} />
    </points>
  );
}

export default function OceanEnvironment({ particles = true }: { particles?: boolean }) {
  const waterRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (waterRef.current) {
      const m = waterRef.current.material as THREE.MeshPhysicalMaterial;
      m.opacity = 0.32 + Math.sin(clock.elapsedTime * 0.8) * 0.03;
    }
  });
  const size = Math.max(GRID_SIZE.x, GRID_SIZE.y) + 0.5;
  return (
    <group>
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 12, 6]} intensity={1.4} castShadow />
      <pointLight position={[-6, 4, -6]} intensity={0.6} color="#6fb3e6" />
      <hemisphereLight args={["#bfe3ff", "#061527", 0.5]} />

      {/* Superfície de l'aigua (z lògic 0 → y = 0) */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[size, size, 1, 1]} />
        <meshPhysicalMaterial
          color={new THREE.Color(OCEAN_COLOR)}
          transparent
          opacity={0.35}
          roughness={0.15}
          metalness={0.1}
          transmission={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Fons marí fosc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Z_MIN - 0.5, 0]}>
        <planeGeometry args={[size + 4, size + 4]} />
        <meshStandardMaterial color="#061527" roughness={1} />
      </mesh>

      {particles && <Particles />}
    </group>
  );
}
