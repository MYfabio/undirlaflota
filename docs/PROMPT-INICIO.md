# PROMPT D'INICI · Undirlaflota

> Copia aquest bloc al començament d'una sessió nova de Claude Code per arrencar amb tot el context.

---

Estic treballant a **Undirlaflota** (`C:\Users\super\Desktop\APPS\Undirlaflota`), un joc educatiu de batalla naval 3D per aprendre coordenades cartesianes i sistema dièdric (ESO 3r-4t). Domini: `undirlaflota.cat`. Repo: `MYfabio/undirlaflota` (branca `main`, auto-deploy a Railway, projecte `undirlaflota`, servei `web` + `Postgres`). Forma part del catàleg **aulaia.cat**.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind 4
- Three.js + @react-three/fiber + @react-three/drei (dos visors 3D amb càmera ortogràfica)
- Framer Motion (animacions UI)
- PostgreSQL a Railway via `pg` (`lib/db.ts`, taules auto-creades); sense `DATABASE_URL` mode local
- i18n pròpia: `lib/i18n.ts` (ca/es/en) + `components/LangProvider.tsx` (`useT()`), cookie `lang`
- Sessió per **codi de classe** amb cookie HMAC (`lib/auth.ts`), patró MatEscac
- Interfície en català/castellà/anglès; comentaris de codi en català

## Estructura clau

```
app/page.tsx              Landing
app/login/page.tsx        Accés per codi de classe (DEMO-2026 sense BD)
app/tutorial/page.tsx     Tutorial interactiu (5 seccions, DiedricViews)
app/about/page.tsx        Context pedagògic
app/game/page.tsx         Selector de mode + càrrega → GameBoard (dynamic, ssr:false)
app/game/components/      GameBoard, FleetViewer, AttackViewer, GridOverlay,
                          ShipModel, OceanEnvironment, ScoreBoard, TurnIndicator, GameResult
app/api/                  auth/login, auth/verify-code, game/create|save|load|challenge, scores
app/game/components/      Explosion + ImpactEffects (efectes), MODEL_TUNING a ShipModel
lib/gameEngine.ts         Estat pur: fases, torns, atac, IA, estadístiques
lib/collision.ts          Unitats col·locades, resolveAttack, canPlace
lib/grid.ts               Coord, toWorld, dièdric, distàncies
lib/ships.ts              SHIPS (carrier 5/25, frigate 3/15, submarine 3/12, fighter 2/8, bomber 3/12), WEAPONS
lib/config.ts             GRID 10×10×5 (z de -2 a 2), colors, munició (20 torpedes, 10 aeris)
lib/i18n.ts               Diccionaris ca/es/en; components/LangProvider + LangSwitcher
lib/db.ts                 Pool pg + esquema (classroom_codes, players, games, scores)
components/DiedricViews   Planta / alçat / perfil en SVG
docs/PEDAGOGIA.md         Connexió curricular i activitats
docs/DESPLEGAMENT.md      Railway, DNS, variables
```

## Regles del joc (resum)

- Grid X 0-9, Y 0-9, Z -2..2. Z=0 superfície, Z<0 submarins, Z>0 avions.
- 10 unitats: 2 portaavions + 3 fragates (z=0), 2 submarins (z=-1/-2), 2 caces + 1 bombarder (z=1/2). Vida total 147.
- Torpede: dany 5, Z ≤ 0. Atac aeri: dany 7, Z ≥ 0. La superfície és vulnerable a totes dues armes.
- Un tret per torn. Final: flota enfonsada o munició esgotada (guanya més dany).
- Modes: `ai`, `local` (hot-seat amb pantalla de canvi), `online` (polling API 3 s), `tutorial` (no desa).

## Convencions

- Motor de joc immutable i sense React; els components només presenten l'estat.
- Validació sempre al servidor a les rutes API. Secrets només per variables d'entorn. SQL sempre amb paràmetres.
- Tots els textos d'interfície passen per `t("clau")`; afegeix cada clau nova als tres diccionaris.
- Models .glb a `public/models/`; `NEXT_PUBLIC_AVAILABLE_MODELS=carrier.glb,...` activa el loader; sense això, geometria procedimental.
- Abans de commit: `npx tsc --noEmit && npm run build`.
- Al final de cada fase: commit + actualitzar `docs/`.
- Atenció amb l'eina Bash d'aquest entorn: els heredocs amb apòstrofs fallen; escriu scripts a fitxer i executa'ls.

## Estat actual / pendents

Veure la secció "Estat" al final de `docs/DESPLEGAMENT.md` i el `README.md`.
