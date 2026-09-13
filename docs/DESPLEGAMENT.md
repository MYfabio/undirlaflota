# DESPLEGAMENT · Undirlaflota

## Resum

| Element | Valor |
|---|---|
| Repo GitHub | `MYfabio/undirlaflota`, branca `main` |
| Hosting | Railway (auto-deploy des de GitHub) |
| Domini | `undirlaflota.cat` (+ `www`) |
| BD | Supabase (opcional) |
| Node | 20+ (Railway usa Nixpacks/Railpack; `npm run build` + `npm start`) |

## Variables d'entorn a Railway

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # només servidor
DATABASE_URL=postgresql://...                   # opcional (no s'usa directament)
SESSION_SECRET=<cadena llarga aleatòria>
DEMO_CLASS_CODES=DEMO-2026                      # codis acceptats sense BD
NEXT_PUBLIC_SITE_URL=https://undirlaflota.cat
NEXT_PUBLIC_AVAILABLE_MODELS=                   # ex: carrier.glb,frigate.glb,submarine.glb
```

Sense les variables de Supabase l'app funciona igualment: sessió per cookie, partides a `localStorage`, codis de `DEMO_CLASS_CODES`.

## Passos

### 1. Supabase
1. Crea un projecte a supabase.com.
2. SQL Editor → enganxa `supabase/schema.sql` → Run. Crea les taules i el codi `ESO3A-2026`.
3. Settings → API: copia URL, anon key i service role key.
4. Per afegir codis de classe: `insert into classroom_codes (code, school, course, teacher, expires_at) values ('ESO4B-2026','Institut Escola Industrial','4t ESO B','Fabio', now() + interval '1 year');`

### 2. GitHub
```bash
gh repo create MYfabio/undirlaflota --public --source=. --remote=origin --push
```

### 3. Railway
1. New Project → Deploy from GitHub repo → `MYfabio/undirlaflota`.
2. Variables → afegeix les de dalt.
3. Settings → Networking → Custom domain `undirlaflota.cat` i `www.undirlaflota.cat`.
4. Cada push a `main` desplega automàticament. `railway.json` fixa build/start.

Amb la CLI:
```bash
railway login
railway init --name undirlaflota
railway link
railway variables --set SESSION_SECRET=... --set NEXT_PUBLIC_SITE_URL=https://undirlaflota.cat
railway up
railway domain
```

### 4. DNS (registrador del domini .cat)
| Tipus | Nom | Valor |
|---|---|---|
| CNAME | `www` | `<subdomini>.up.railway.app` |
| A / ALIAS | `@` | segons Railway (ALIAS al CNAME, o redirecció 301 de l'arrel a www) |

Railway emet el certificat TLS automàticament quan el DNS propaga.

### 5. Models 3D (opcional)
Descarrega els `.glb` a `public/models/` (veure `public/models/README.md`) i defineix `NEXT_PUBLIC_AVAILABLE_MODELS`. Sense models, el joc usa geometria procedimental.

### 6. aulaia.cat
Entrada afegida a `aulaia-cat/data/apps.json` amb slug `undirlaflota`. Cal fer commit i push del repo d'aulaia perquè aparegui a `/apps/undirlaflota`.

## Comprovacions abans de desplegar

```bash
npx tsc --noEmit
npm run build
```

## Estat

- [x] Landing, login, tutorial, about
- [x] Game board amb 2 visors 3D, col·locació, atac, IA, hot-seat, resultat
- [x] API + esquema Supabase + mode online per polling
- [x] Fitxa a aulaia.cat (apps.json)
- [ ] Models .glb reals (ara procedimentals)
- [ ] Supabase de producció configurat a Railway
- [ ] DNS undirlaflota.cat
