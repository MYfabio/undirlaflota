"use client";

/**
 * Escena 3D de la portada: el portaavions i un caça giren lentament sobre un
 * mar transparent, amb la imatge de portada de fons. Es carrega només al client.
 */
import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODELS = (process.env.NEXT_PUBLIC_AVAILABLE_MODELS ?? "").split(",").map((s) => s.trim());
const HAS = (f: string) => MODELS.includes(f);

function Model({ file, length, lengthAxis, position, rotation = [0, 0, 0] }: { file: string; length: number; lengthAxis: "x" | "z"; position: [number, number, number]; rotation?: [number, number, number] }) {
  const { scene } = useGLTF(`/models/${file}`);
  const obj = useMemo(() => {
    const c = scene.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    const s = length / ((lengthAxis === "z" ? size.z : size.x) || 1);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const g = new THREE.Group();
    c.position.copy(center.multiplyScalar(-1));
    g.add(c);
    g.scale.setScalar(s);
    g.rotation.y = lengthAxis === "z" ? Math.PI / 2 : 0;
    return g;
  }, [scene, length, lengthAxis]);
  return (
    <group position={position} rotation={rotation}>
      <primitive object={obj} />
    </group>
  );
}

function Scene() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.12;
  });
  return (
    <group ref={group}>
      {HAS("carrier.glb") ? (
        <Model file="carrier.glb" length={5} lengthAxis="z" position={[0, 0, 0]} />
      ) : (
        <mesh>
          <boxGeometry args={[5, 0.4, 0.9]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
      )}
      {HAS("fighter.glb") && (
        <Float speed={2} rotationIntensity={0.3} floatIntensity={0.6}>
          <Model file="fighter.glb" length={1.6} lengthAxis="z" position={[1.5, 1.6, 1.4]} rotation={[0.05, 0.6, 0.1]} />
        </Float>
      )}
      {HAS("submarine.glb") && <Model file="submarine.glb" length={2.6} lengthAxis="x" position={[-1.2, -1.1, 1.8]} rotation={[0, 0.3, 0]} />}
      {/* Aigua */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[4.5, 48]} />
        <meshPhysicalMaterial color="#1a4d7a" transparent opacity={0.35} roughness={0.2} depthWrite={false} />
      </mesh>
      {/* Grid subtil */}
      <gridHelper args={[8, 8, "#4a9eff", "#4a9eff"]} position={[0, -0.04, 0]}>
        <lineBasicMaterial transparent opacity={0.25} color="#4a9eff" />
      </gridHelper>
    </group>
  );
}

export default function HeroModel() {
  return (
    <div className="absolute inset-0">
      <Canvas dpr={[1, 1.5]} camera={{ position: [6, 3.5, 6], fov: 32 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 4]} intensity={1.6} />
        <Suspense fallback={null}>
          <Scene />
          <hemisphereLight args={["#ffe9c4", "#0b2540", 0.6]} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} minPolarAngle={0.6} maxPolarAngle={1.35} />
      </Canvas>
    </div>
  );
}
