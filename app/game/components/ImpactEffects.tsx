"use client";

/**
 * Gestiona la cua d'explosions d'un visor: cada atac nou (per índex) dispara una
 * Explosion que s'autoelimina en acabar. S'usa dins del Canvas.
 */
import { useEffect, useRef, useState } from "react";
import Explosion from "./Explosion";
import type { AttackResult } from "@/lib/collision";

interface Fx {
  key: string;
  attack: AttackResult;
  startedAt: number;
}

export default function ImpactEffects({ attacks }: { attacks: AttackResult[] }) {
  const seen = useRef(attacks.length); // no animem els atacs ja existents en muntar
  const [fx, setFx] = useState<Fx[]>([]);

  useEffect(() => {
    if (attacks.length <= seen.current) {
      seen.current = attacks.length;
      return;
    }
    const nous = attacks.slice(seen.current);
    seen.current = attacks.length;
    const now = Date.now();
    setFx((f) => [...f, ...nous.map((a, i) => ({ key: `${now}-${i}`, attack: a, startedAt: now }))]);
  }, [attacks]);

  return (
    <>
      {fx.map((e) => (
        <Explosion
          key={e.key}
          coord={e.attack.coord}
          outcome={e.attack.outcome}
          startedAt={e.startedAt}
          onDone={() => setFx((f) => f.filter((x) => x.key !== e.key))}
        />
      ))}
    </>
  );
}
