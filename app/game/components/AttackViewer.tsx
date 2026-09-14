"use client";

/**
 * Visor 2 · ATACS
 * Grid 3D transparent per apuntar, cursor lliure (teclat / botons / clic),
 * selector d'arma, munició, historial i botó DISPARAR.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import OceanEnvironment from "./OceanEnvironment";
import GridOverlay, { type GridMark } from "./GridOverlay";
import ScoreBoard from "./ScoreBoard";
import ImpactEffects from "./ImpactEffects";
import DiedricViews from "@/components/DiedricViews";
import type { AttackResult } from "@/lib/collision";
import { clampCoord, fmtCoord, type Coord } from "@/lib/grid";
import { useT } from "@/components/LangProvider";
import { WEAPONS, type WeaponType } from "@/lib/ships";
import { Z_MAX, Z_MIN } from "@/lib/config";

interface Props {
  attacks: AttackResult[]; // atacs propis
  weapons: Record<WeaponType, number>;
  canFire: boolean; // és el meu torn i la partida està en joc
  waiting?: boolean; // s'ha enviat l'atac i s'espera resposta
  onFire: (c: Coord, w: WeaponType) => string | null; // retorna error o null
  lastResult?: AttackResult | null;
}

export default function AttackViewer({ attacks, weapons, canFire, waiting, onFire, lastResult }: Props) {
  const { t } = useT();
  const zLabel = (z: number) => (z > 0 ? t("z.air", { z }) : z === 0 ? t("z.surface") : t("z.depth", { z }));
  const controls = useRef<OrbitControlsImpl>(null);
  const [cursor, setCursor] = useState<Coord>({ x: 5, y: 5, z: 0 });
  const [weapon, setWeapon] = useState<WeaponType>("torpedo");
  const [error, setError] = useState<string | null>(null);
  const [showDiedric, setShowDiedric] = useState(true);

  const marks: GridMark[] = useMemo(() => attacks.map((a) => ({ coord: a.coord, outcome: a.outcome })), [attacks]);
  const alreadyShot = attacks.some((a) => a.coord.x === cursor.x && a.coord.y === cursor.y && a.coord.z === cursor.z);
  const weaponOk = WEAPONS[weapon].hitsZ(cursor.z) && weapons[weapon] > 0;
  const valid = canFire && !waiting && !alreadyShot && weaponOk;

  const move = (dx: number, dy: number, dz: number) => setCursor((c) => clampCoord({ x: c.x + dx, y: c.y + dy, z: c.z + dz }));

  const fire = () => {
    if (!valid) return;
    const err = onFire(cursor, weapon);
    setError(err);
  };

  // Dreceres de teclat
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      switch (e.key) {
        case "ArrowLeft": move(-1, 0, 0); break;
        case "ArrowRight": move(1, 0, 0); break;
        case "ArrowUp": move(0, 1, 0); break;
        case "ArrowDown": move(0, -1, 0); break;
        case "q": case "Q": move(0, 0, 1); break;
        case "e": case "E": move(0, 0, -1); break;
        case "t": case "T": setWeapon("torpedo"); break;
        case "a": case "A": setWeapon("airstrike"); break;
        case "Enter": case " ": e.preventDefault(); fire(); break;
        default: return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, cursor, weapon]);

  useEffect(() => setError(null), [cursor, weapon]);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="relative min-h-[260px] flex-1">
        <Canvas dpr={[1, 1.5]} className="rounded-2xl">
          <OrthographicCamera makeDefault position={[14, 14, 14]} zoom={28} near={0.1} far={200} />
          <color attach="background" args={["#061527"]} />
          <OceanEnvironment particles={false} />
          <GridOverlay activeZ={cursor.z} cursor={cursor} marks={marks} onPick={(c) => setCursor(c)} />
          <ImpactEffects attacks={attacks} />
          <OrbitControls ref={controls} enablePan={false} minZoom={12} maxZoom={70} maxPolarAngle={Math.PI / 2.05} />
        </Canvas>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
          <span className="chip border-batalla/40 bg-mar-950/80 text-batalla">{t("game.attacks")}</span>
          <span className="text-[10px] text-mar-300/70">{t("game.attackHint")}</span>
        </div>
        <button onClick={() => controls.current?.reset()} className="absolute right-3 top-3 rounded-lg bg-mar-950/80 px-2 py-1 text-xs hover:bg-mar-700">
          {t("game.resetView")}
        </button>
        {waiting && (
          <div className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-mar-950/90 px-4 py-1 text-sm text-mar-300">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-mar-300" />
            {t("game.waitingReply")}
          </div>
        )}
      </div>

      {/* Panell de control */}
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="card !p-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-mar-300">{t("game.coords")}</p>
            <p className="coord text-xl font-black text-batalla">{fmtCoord(cursor)}</p>
            <span className="text-xs text-mar-100/60">{zLabel(cursor.z)}</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {(["x", "y", "z"] as const).map((k) => (
              <div key={k} className="flex items-center gap-1 rounded-lg bg-mar-950/60 p-1">
                <span className="coord w-4 text-center text-xs font-bold uppercase text-mar-300">{k}</span>
                <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => move(k === "x" ? -1 : 0, k === "y" ? -1 : 0, k === "z" ? -1 : 0)}>−</button>
                <input
                  type="number"
                  className="input !w-12 !px-1 !py-1 text-center text-sm"
                  min={k === "z" ? Z_MIN : 0}
                  max={k === "z" ? Z_MAX : 9}
                  value={cursor[k]}
                  onChange={(e) => setCursor((c) => clampCoord({ ...c, [k]: Number(e.target.value) }))}
                />
                <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => move(k === "x" ? 1 : 0, k === "y" ? 1 : 0, k === "z" ? 1 : 0)}>+</button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(WEAPONS) as WeaponType[]).map((w) => (
              <button
                key={w}
                onClick={() => setWeapon(w)}
                disabled={weapons[w] <= 0}
                className={`chip transition ${weapon === w ? "border-batalla bg-batalla/20 text-batalla" : "hover:bg-mar-700"}`}
                title={t(`weapon.${w}.desc`)}
              >
                {WEAPONS[w].emoji} {t(`weapon.${w}`)}: <span className="coord">{weapons[w]} / {WEAPONS[w].count}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button className="btn-primary flex-1" onClick={fire} disabled={!valid}>
              {t("game.fire")}
            </button>
            <button className="btn-secondary" onClick={() => setCursor({ x: 5, y: 5, z: 0 })}>{t("common.cancel")}</button>
          </div>
          <p className="mt-1 min-h-[1.2em] text-xs text-perill">
            {error ??
              (alreadyShot ? t("game.alreadyShot") : !WEAPONS[weapon].hitsZ(cursor.z) ? t("game.airNoDepth") : weapons[weapon] <= 0 ? t("game.noAmmo") : "")}
          </p>
          {lastResult && (
            <p className="text-xs text-mar-100/70">
              {t("game.lastShot")} <span className="coord">{fmtCoord(lastResult.coord)}</span> →{" "}
              <span className={lastResult.outcome === "miss" ? "text-mar-300" : "font-bold text-batalla"}>
                {lastResult.outcome === "miss" ? t("game.water") : lastResult.outcome === "sunk" ? t("game.sunkExcl") : t("game.hitLower")}
              </span>
            </p>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-56">
          <ScoreBoard title={t("game.myShots")} attacks={attacks} />
          <button className="text-left text-[11px] text-mar-300/70 underline" onClick={() => setShowDiedric((v) => !v)}>
            {showDiedric ? t("game.hideDiedric") : t("game.showDiedric")}
          </button>
          {showDiedric && (
            <DiedricViews
              compact
              target={cursor}
              extras={attacks.map((a) => ({ coord: a.coord, color: a.outcome === "miss" ? "#94a3b8" : "#ff3333" }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
