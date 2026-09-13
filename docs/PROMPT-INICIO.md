# PROMPT D'INICI · Undirlaflota

> Copia aquest bloc al començament d'una sessió nova de Claude Code per arrencar amb tot el context.

---

Estic treballant a **Undirlaflota** (`C:\Users\super\Desktop\APPS\Undirlaflota`), un joc educatiu de batalla naval 3D per aprendre coordenades cartesianes i sistema dièdric (ESO 3r-4t). Domini: `undirlaflota.cat`. Repo: `MYfabio/undirlaflota` (branca `main`, auto-deploy a Railway). Forma part del catàleg **aulaia.cat**.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind 4
- Three.js + @react-three/fiber + @react-three/drei (dos visors 3D amb càmera ortogràfica)
- Framer Motion (animacions UI)
- Supabase (opcional; sense variables d'entorn l'app funciona en mode local)
- Sessió per **codi de classe** amb cookie HMAC (`lib/auth.ts`), patró MatEscac
- Interfície en **català**; comentaris de codi en català

## Estructura clau

```
app/page.tsx              Landing
app/login/page.tsx        Accés per codi de classe (DEMO-2026 sense BD)
app/tutorial/page.tsx     Tutorial interactiu (5 seccions, DiedricViews)
app/about/page.tsx        Context pedagògic
app/game/page.tsx         Selector de mode + càrrega → GameBoard (dynamic, ssr:false)
app/game/components/      GameBoard, FleetViewer, AttackViewer, GridOverlay,
                          ShipModel, OceanEnvironment, ScoreBoard, TurnIndicator, GameResult
app/api/                  auth/login, auth/verify-code, game/create|save|load, scores
lib/gameEngine.ts         Estat pur: fases, torns, atac, IA, estadístiques
lib/collision.ts          Vaixells col·locats, resolveAttack, canPlace
lib/grid.ts               Coord, toWorld, dièdric, distàncies
lib/ships.ts              SHIPS (carrier 5 cel·les/25, frigate 3/15, submarine 3/12), WEAPONS
lib/config.ts             GRID 10×10×5 (z de -2 a 2), colors, munició (20 torpedes, 6 aeris)
components/DiedricViews   Planta / alçat / perfil en SVG
supabase/schema.sql       Taules classroom_codes, players, games, scores
docs/PEDAGOGIA.md         Connexió curricular i activitats
docs/DESPLEGAMENT.md      Railway, DNS, variables
```

## Regles del joc (resum)

- Grid X 0-9, Y 0-9, Z -2..2. Z=0 superfície, Z<0 submarins, Z>0 aire.
- 7 vaixells: 2 portaavions (z=0), 3 fragates (z=0), 2 submarins (z=-1 o -2). Vida total 119.
- Torpede: dany 5, qualsevol Z. Atac aeri: dany 7, només Z ≥ 0.
- Un tret per torn. Final: flota enfonsada o munició esgotada (guanya més dany).
- Modes: `ai`, `local` (hot-seat amb pantalla de canvi), `online` (polling Supabase 3 s), `tutorial` (no desa).

## Convencions

- Motor de joc immutable i sense React; els components només presenten l'estat.
- Validació sempre al servidor a les rutes API. Secrets només per variables d'entorn.
- Models .glb a `public/models/`; `NEXT_PUBLIC_AVAILABLE_MODELS=carrier.glb,frigate.glb,...` activa el loader; sense això es fa servir geometria procedimental.
- Abans de commit: `npx tsc --noEmit && npm run build`.
- Al final de cada fase: commit + actualitzar `docs/`.

## Estat actual / pendents

Veure la secció "Estat" al final de `docs/DESPLEGAMENT.md` i el `README.md`.
