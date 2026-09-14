# Undirlaflota · La guerra submarina en 3D

Joc educatiu de batalla naval en tres dimensions per aprendre **coordenades cartesianes** i **sistema dièdric** a l'ESO (3r-4t). Forma part del catàleg [aulaia.cat](https://aulaia.cat). Institut Escola Industrial.

- Grid 10 × 10 × 5 (z de -2 a +2). Tres capes: avions a l'aire (z = 1, 2), vaixells a la superfície (z = 0), submarins sota l'aigua (z = -1, -2). Torpedes toquen z ≤ 0; atacs aeris z ≥ 0.
- Dos visors 3D: la meva flota (impactes rebuts) i el grid d'atac (cursor lliure, coordenades en viu, vistes dièdriques).
- Modes: contra l'ordinador, dos jugadors al mateix dispositiu, en línia amb la classe (Postgres), tutorial.
- Interfície en català, castellà i anglès (selector a la capçalera, cookie `lang`).
- Accés per **codi de classe** (sense contrasenyes). Codi de prova: `DEMO-2026`.

## Arrencada

```bash
npm install
cp .env.example .env.local   # opcional
npm run dev                  # http://localhost:3215
```

Sense `DATABASE_URL` l'app funciona en mode local (partides al navegador).

## Documentació

- [docs/PROMPT-INICIO.md](docs/PROMPT-INICIO.md): context per arrencar sessions noves.
- [docs/PEDAGOGIA.md](docs/PEDAGOGIA.md): connexió curricular i seqüència didàctica.
- [docs/DESPLEGAMENT.md](docs/DESPLEGAMENT.md): Railway, Postgres, DNS.
- [lib/db.ts](lib/db.ts): esquema Postgres (les taules es creen automàticament).

## Stack

Next.js 16 · React 19 · Three.js + @react-three/fiber + drei · Tailwind 4 · Framer Motion · PostgreSQL (pg) a Railway.
