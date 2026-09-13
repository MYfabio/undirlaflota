"use client";

/**
 * Visor 1 · LA MEVA FLOTA
 * Vista 3D isomètrica dels vaixells propis i dels impactes rebuts.
 * Durant la col·locació, permet fer clic al grid per situar el vaixell seleccionat
 * i mostra una previsualització (ghost). Durant la partida és només d'observació.
 */
import { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import OceanEnvironment from "./OceanEnvironment";
import GridOverlay, { type GridMark } from "./GridOverlay";
import ShipModel from "./ShipModel";
import type { PlacedShip, AttackResult } from "@/lib/collision";
import type { Coord } from "@/lib/grid";
import { makeShip } from "@/lib/collision";
import type { Axis, ShipType } from "@/lib/ships";

interface Props {
  fleet: PlacedShip[];
  incoming: AttackResult[]; // atacs rebuts
  hidden?: boolean; // amaga la flota (canvi de torn en mode local)
  placing?: {
    type: ShipType;
    axis: Axis;
    origin: Coord;
    valid: boolean;
    onPick: (c: Coord) => void;
  } | null;
  onShipClick?: (id: string) => void;
}

export default function FleetViewer({ fleet, incoming, hidden, placing, onShipClick }: Props) {
  const controls = useRef<OrbitControlsImpl>(null);
  const marks: GridMark[] = useMemo(
    () => incoming.filter((a) => a.outcome === "miss").map((a) => ({ coord: a.coord, outcome: a.outcome })),
    [incoming],
  );
  const ghost = placing ? makeShip("ghost", placing.type, placing.origin, placing.axis) : null;

  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 1.5]} className="rounded-2xl">
        <OrthographicCamera makeDefault position={[14, 14, 14]} zoom={28} near={0.1} far={200} />
        <color attach="background" args={["#061527"]} />
        <fog attach="fog" args={["#061527", 30, 60]} />
        <OceanEnvironment particles={!hidden} />
        <GridOverlay
          activeZ={placing?.origin.z ?? 0}
          marks={marks}
          interactive={Boolean(placing)}
          onPick={placing?.onPick}
          cursor={placing ? placing.origin : null}
        />
        {!hidden &&
          fleet.map((s) => (
            <ShipModel key={s.id} ship={s} onClick={onShipClick ? () => onShipClick(s.id) : undefined} />
          ))}
        {ghost && <ShipModel ship={ghost} ghost invalid={!placing?.valid} showDamage={false} />}
        <OrbitControls ref={controls} enablePan={false} minZoom={12} maxZoom={70} maxPolarAngle={Math.PI / 2.05} />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
        <span className="chip pointer-events-auto border-mar-300/40 bg-mar-950/80">🛳️ La meva flota</span>
        <span className="text-[10px] text-mar-300/70">Arrossega per rotar · roda per fer zoom</span>
      </div>
      <button
        onClick={() => controls.current?.reset()}
        className="absolute right-3 top-3 rounded-lg bg-mar-950/80 px-2 py-1 text-xs text-mar-100 hover:bg-mar-700"
      >
        ⟲ Vista
      </button>
      {hidden && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-mar-950/85 text-center">
          <p className="text-mar-100/80">🙈 Flota amagada durant el canvi de torn</p>
        </div>
      )}
    </div>
  );
}
