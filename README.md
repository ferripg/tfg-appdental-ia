# AppDental — gestió de despeses d'una clínica dental (repositori IA)

AppDental és una aplicació web per gestionar la part econòmica d'una clínica dental: proveïdors, tipus de despesa, registre de despeses amb la factura adjunta, inventari de béns amortitzables, amortitzacions anuals, informes en PDF, tauler d'indicadors, gestió d'usuaris amb rols i registre d'auditoria.

Aquest repositori és la **versió desenvolupada amb Claude Code** d'un Treball de Final de Grau (Universitat de Girona). El mateix producte, amb el mateix abast funcional, s'ha desenvolupat quatre vegades amb metodologies diferents per comparar-les empíricament:

| Repositori | Metodologia |
|---|---|
| [`tfg-appdental-manual`](https://github.com/ferripg/tfg-appdental-manual) | Desenvolupament manual, sense assistència agèntica |
| **[`tfg-appdental-ia`](https://github.com/ferripg/tfg-appdental-ia)** (aquest) | Desenvolupament per sprints amb Claude Code (Claude Fable 5; Skills + MCP + agents) com a agent principal, amb supervisió de l'autor com a *product manager* |
| [`tfg-appdental-cursor`](https://github.com/ferripg/tfg-appdental-cursor) | Desenvolupament amb l'agent Cursor (GPT-5.5) |
| [`tfg-appdental-fable-oneshot`](https://github.com/ferripg/tfg-appdental-fable-oneshot) | Generació d'una sola passada (*one-shot*) amb Claude Fable 5 |

La comparativa entre les quatre versions és l'aportació acadèmica del TFG. Aquest repositori incorpora, a més, funcionalitats exclusives (com la **importació de factures amb IA**).

> La interfície, els comentaris i la documentació són en **català**.

---

## Índex

1. [Funcionalitats](#funcionalitats)
2. [Stack tècnic](#stack-tècnic)
3. [Arquitectura](#arquitectura)
4. [Requisits](#requisits)
5. [Instal·lació i posada en marxa](#installació-i-posada-en-marxa)
6. [Provar l'aplicació](#provar-laplicació)
7. [Desplegament complet amb Docker](#desplegament-complet-amb-docker)
8. [Executar els dos repositoris alhora](#executar-els-dos-repositoris-alhora)
9. [Variables d'entorn](#variables-dentorn)
10. [Comandes útils](#comandes-útils)
11. [Estructura del projecte](#estructura-del-projecte)
12. [Problemes habituals](#problemes-habituals)

---

## Funcionalitats

| Mòdul | Ruta | Descripció |
|---|---|---|
| Autenticació | `/login`, `/canvi-contrasenya` | Inici de sessió amb correu i contrasenya (Better Auth, sessions a BD). Bloqueig temporal després d'intents fallits, desactivació d'usuaris, canvi obligatori de contrasenya al primer accés. |
| Tauler | `/dashboard` | KPIs de l'exercici en curs, gràfic mensual de despeses i distribució per tipus. |
| Proveïdors | `/proveidors` | CRUD amb validació real de NIF/CIF, desactivació lògica. |
| Tipus de despesa | `/tipus-despesa` | Catàleg de categories amb grup del PGC, deduïbilitat i marca d'amortitzable. |
| Despeses | `/despeses` | Registre de despeses amb la factura en PDF adjunta (MinIO). Filtres, edició, eliminació. |
| **Importació amb IA** | `/despeses/importa` | Es pugen fins a 20 PDFs (text o escanejats); Claude n'extreu proveïdor, import, data, concepte i tipus, es fa *matching* contra la BD i l'usuari revisa i confirma fila a fila. Cada confirmació és una transacció (pot crear proveïdor, tipus i bé d'inventari alhora). |
| Inventari | `/inventari` | Béns amortitzables generats automàticament a partir de despeses amb tipus amortitzable. Estats ACTIU / BAIXA / ELIMINAT. |
| Amortitzacions | `/amortitzacions` | Generació i retrocés de les amortitzacions anuals (amb prorrateig del primer any) i tancament/reobertura d'exercici. |
| Informes | `/informes` | Informe de despeses per proveïdor amb exportació a PDF. |
| Usuaris | `/usuaris` | Alta, canvi de rol, activació/desactivació (només ADMIN). |
| Auditoria | `/auditoria` | Registre de totes les accions (CRUD, login, canvis de rol, tancaments…) amb IP i enllaç a l'entitat afectada. |

### Rols

| Rol | Permisos |
|---|---|
| `OPERARI` | Consulta tots els mòduls i registra despeses. No edita catàlegs ni inventari. |
| `MANAGER` | CRUD complet del domini (proveïdors, tipus, despeses, inventari, amortitzacions, importació IA). |
| `ADMIN` | Tot l'anterior + gestió d'usuaris i auditoria. |

Fora de l'abast del TFG (a propòsit): cobraments/ingressos i història clínica de pacients.

---

## Stack tècnic

| Capa | Tecnologia |
|---|---|
| Framework | **Next.js 16** (App Router, React 19, Server Actions, `output: "standalone"`) |
| Llenguatge | TypeScript |
| Base de dades | **PostgreSQL 16** via **Prisma 7** (`@prisma/adapter-pg`) |
| Autenticació | **Better Auth** (adapter Prisma, sessions a BD, cookies) |
| Fitxers | **MinIO** (S3 compatible) — bucket `factures` |
| IA | **Anthropic SDK** (`claude-sonnet-5`, *structured outputs* amb Zod) |
| UI | Tailwind CSS v4 + shadcn/ui (Radix), lucide-react, recharts, sonner |
| PDF | `@react-pdf/renderer` |
| Validació | Zod 4 |
| Infra | Docker Compose (Postgres + MinIO + Nginx + Next.js) |

---

## Arquitectura

### Capes (hexagonal)

```
src/
├── app/            Rutes de Next.js (pàgines, Server Actions, layouts)
├── components/     Components UI (shadcn a ui/, components d'app a app/)
├── domain/         Tipus, esquemes Zod, regles de negoci PURES (sense dependències)
├── services/       Casos d'ús: permisos, orquestració, auditoria
├── repositories/   Adapters d'infraestructura: Prisma, MinIO, Anthropic
├── lib/            Configuració transversal (auth.ts, format, utils)
└── proxy.ts        Protecció de rutes privades (Next.js 16 "proxy")
```

Regla d'or: `@prisma/client`, `minio` i `@anthropic-ai/sdk` **només s'importen dins de `src/repositories/`**. La resta de capes en desconeixen l'existència.

### Topologia de serveis (Docker Compose)

```
navegador ──► nginx :80 ──┬──► nextjs :3000  (app)
                          └──► minio  :9001  (consola, sota /minio/)
                nextjs ──► postgres :5432
                nextjs ──► minio    :9000  (API S3)
```

Per al desenvolupament i per provar l'app, el més senzill és executar **només Postgres i MinIO en Docker** i l'aplicació Next.js directament a l'ordinador amb `npm run dev` (vegeu el següent apartat). El contenidor `nextjs` és la imatge de producció (vegeu [Desplegament complet amb Docker](#desplegament-complet-amb-docker)).

---

## Requisits

- **Git**
- **Docker Desktop** (o Docker Engine + Compose v2)
- **Node.js ≥ 20.9** (recomanat Node 24 LTS, que és el que fa servir el `Dockerfile`)
- Una **clau de l'API d'Anthropic** (només si vols provar la importació de factures amb IA)

---

## Instal·lació i posada en marxa

### 1. Clonar el repositori

```bash
git clone https://github.com/ferripg/tfg-appdental-ia.git
cd tfg-appdental-ia
```

### 2. Crear el fitxer `.env`

Copia la plantilla i omple els valors buits:

```bash
cp .env.example .env
```

Contingut mínim (vegeu la [taula de variables](#variables-dentorn) per al detall):

```dotenv
POSTGRES_USER=appdental
POSTGRES_PASSWORD=una_contrasenya_segura
POSTGRES_DB=appdental

MINIO_ROOT_USER=adminauth
MINIO_ROOT_PASSWORD=una_altra_contrasenya_segura   # mínim 8 caràcters (ho exigeix MinIO)

BETTER_AUTH_SECRET=<cadena aleatòria llarga>
BETTER_AUTH_URL=http://localhost:3000

SEED_ADMIN_EMAIL=admin@clinica.test
SEED_ADMIN_PASSWORD=<contrasenya inicial de l'admin, mínim 8 caràcters>

# Ha de coincidir amb POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB
DATABASE_URL="postgresql://appdental:una_contrasenya_segura@localhost:5432/appdental?schema=public"

# Opcional: només per a la importació de factures amb IA
ANTHROPIC_API_KEY=sk-ant-...
```

Per generar `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 32
# o bé
npx @better-auth/cli@latest secret
```

### 3. Aixecar la base de dades i l'emmagatzematge

```bash
docker compose up -d postgres minio
```

Comprova que tots dos contenidors estan `healthy`:

```bash
docker compose ps
```

### 4. Instal·lar dependències i preparar la base de dades

```bash
npm install
npx prisma generate          # genera el client Prisma tipat
npx prisma migrate deploy    # aplica totes les migracions de prisma/migrations/
```

### 5. Crear l'usuari administrador

```bash
npx prisma db seed
```

Aquesta comanda executa `prisma/seed.ts` (mitjançant `npx tsx`, que es descarrega sol la primera vegada) i crea l'usuari `SEED_ADMIN_EMAIL` amb rol `ADMIN`. És idempotent: si l'usuari ja existeix, no fa res.

### 6. (Opcional) Carregar dades de demostració

`prisma/seed-demo.sql` afegeix tipus de despesa, proveïdors, despeses de dos exercicis, béns d'inventari i amortitzacions, perquè el tauler i els informes tinguin contingut. Les despeses s'assignen automàticament a l'usuari `ADMIN` creat al pas anterior (si no n'hi ha cap, el script s'atura amb un missatge clar).

**Bash / Git Bash:**

```bash
docker exec -i dentaia-postgres psql -U appdental -d appdental < prisma/seed-demo.sql
```

**PowerShell:**

```powershell
$OutputEncoding = New-Object System.Text.UTF8Encoding $false   # perquè els accents arribin bé a psql
Get-Content prisma\seed-demo.sql -Raw -Encoding UTF8 | docker exec -i dentaia-postgres psql -U appdental -d appdental
```

El script és idempotent (`ON CONFLICT DO NOTHING`) i acaba mostrant el recompte de files de cada taula.

### 7. Arrencar l'aplicació

```bash
npm run dev
```

Obre **http://localhost:3000** i inicia sessió amb `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

Serveis addicionals:

| Servei | URL |
|---|---|
| Aplicació | http://localhost:3000 |
| Consola MinIO | http://localhost:9001 (credencials `MINIO_ROOT_*`) |
| Prisma Studio | `npx prisma studio` → http://localhost:5555 |

---

## Provar l'aplicació

Un recorregut suggerit un cop dins amb l'administrador:

1. **Usuaris** → crea un usuari `MANAGER` i un `OPERARI` amb una contrasenya temporal. Al seu primer inici de sessió se'ls obligarà a canviar-la.
2. **Proveïdors** i **Tipus de despesa** → crea'n uns quants (o fes servir els de demo). Els NIF/CIF es validen amb el dígit de control real.
3. **Despeses → Nova despesa** → registra una despesa adjuntant un PDF. El fitxer es desa a MinIO (bucket `factures`, creat automàticament) i es pot descarregar des de la fitxa mitjançant una URL signada temporal.
4. Si el tipus de despesa és **amortitzable**, apareixerà automàticament un bé a **Inventari**; assigna-li el percentatge d'amortització i genera les amortitzacions de l'exercici des d'**Amortitzacions**.
5. **Informes** → genera l'informe de despeses per proveïdor i exporta'l a PDF.
6. **Auditoria** → revisa el rastre de totes les accions anteriors.
7. Inicia sessió amb l'`OPERARI` per comprovar el *mode consulta* (les accions d'edició desapareixen i el servidor les rebutja igualment).

### Importació de factures amb IA

Requereix `ANTHROPIC_API_KEY` al `.env` i un usuari `MANAGER` o `ADMIN`.

1. Ves a **Despeses → Importa**.
2. Arrossega PDFs (màxim 20 fitxers, 5 MB cadascun). A `test-fixtures/` hi ha factures de prova preparades:
   - `factura-hs-material.pdf` — PDF de text, proveïdor i tipus existents a la demo.
   - `factura-hs-duplicada.pdf` — mateix número de factura que una despesa de demo → avís de duplicat.
   - `factura-scan-quirumed.pdf` — PDF escanejat (només imatge), proveïdor nou + tipus amortitzable → crea bé d'inventari.
   - `factura-scan-protesic.pdf` — PDF escanejat, proveïdor nou + proposta de tipus nou.
   - `factura-illegible.pdf` — fitxer corrupte → es marca com a error sense trencar el lot.
3. Revisa cada fila (camps dubtosos ressaltats, matching contra la BD, propostes de proveïdor/tipus nous), edita el que calgui i confirma. Res no es persisteix fins que confirmes.

Hi ha també dos *smoke tests* de línia d'ordres, sense interfície:

```bash
npx tsx test-fixtures/smoke-extraccio.mts     # extracció contra l'API real d'Anthropic
npx tsx test-fixtures/smoke-confirmacio.mts   # transacció de confirmació contra Postgres + MinIO reals
```

---

## Desplegament complet amb Docker

El `docker-compose.yml` també construeix la imatge de producció de Next.js (multi-stage `deps → builder → runner`, sortida `standalone`) i la publica darrere de Nginx al port 80:

```bash
docker compose up -d --build
```

| Servei | URL |
|---|---|
| Aplicació | http://localhost |
| Consola MinIO | http://localhost/minio/ o http://localhost:9001 |

Les migracions i els seeds **no** s'executen automàticament dins del contenidor: fes-ho des de l'ordinador amb els passos 4, 5 i 6 de l'apartat anterior (el Postgres continua exposat a `localhost:5432`). Si els havies fet ja per al mode `npm run dev`, no cal repetir-los: la base de dades és la mateixa.

Com es configura el contenidor (`docker-compose.yml`, servei `nextjs`):

- `DATABASE_URL` i `MINIO_ENDPOINT=minio` apunten als noms interns de la xarxa Docker.
- `MINIO_PUBLIC_ENDPOINT=localhost` / `MINIO_PUBLIC_PORT` és l'adreça que veu el **navegador**: les URL signades de descàrrega de factures es generen contra aquesta adreça, no contra `minio:9000`.
- `ANTHROPIC_API_KEY` s'hi passa des del `.env` (buida si no la tens; la resta de l'app funciona igual).
- `BETTER_AUTH_URL=http://localhost` perquè l'app es serveix pel port 80 de Nginx.

Per aturar-ho tot conservant les dades (volums `postgres_data` i `minio_data`):

```bash
docker compose down
```

Per aturar-ho **esborrant** també les dades:

```bash
docker compose down -v
```

---

## Executar els dos repositoris alhora

Si tens el repositori manual i aquest aixecats simultàniament, els ports de l'host xocarien. La solució és un fitxer `docker-compose.override.yml` a l'arrel d'aquest repositori (Compose l'aplica automàticament si existeix; **no es versiona** perquè una instal·lació normal no el necessita):

```yaml
services:
  postgres:
    ports: !override
      - "5433:5432"
  minio:
    ports: !override
      - "9010:9000"
      - "9011:9001"
  nginx:
    ports: !override
      - "8080:80"
```

| Servei | Port per defecte | Port amb l'override |
|---|---|---|
| Postgres | 5432 | **5433** |
| MinIO API S3 | 9000 | **9010** |
| Consola MinIO | 9001 | **9011** |
| Nginx (app) | 80 | **8080** |

En aquest cas, ajusta el `.env`:

```dotenv
DATABASE_URL="postgresql://appdental:...@localhost:5433/appdental?schema=public"
MINIO_PORT=9010
```

Per tornar als ports per defecte, esborra el fitxer o executa Compose amb `-f docker-compose.yml` explícitament.

---

## Variables d'entorn

| Variable | Obligatòria | Descripció |
|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Sí | Credencials del contenidor Postgres. Compose les usa també per construir la `DATABASE_URL` interna. |
| `DATABASE_URL` | Sí | URL que fa servir Prisma des de l'host. Ha d'apuntar a `localhost:5432` (o `5433` amb l'override) amb les mateixes credencials. |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | Sí | Credencials de MinIO. L'app les fa servir com a *access/secret key* si no hi ha `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`. |
| `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL` | No | Adreça de MinIO per al servidor. Per defecte `localhost`, `9000`, `false`. Compose injecta `minio` / `9000` al contenidor. |
| `MINIO_PUBLIC_ENDPOINT`, `MINIO_PUBLIC_PORT`, `MINIO_PUBLIC_USE_SSL` | No | Adreça de MinIO per al navegador (URL signades). Per defecte, la mateixa que l'anterior; Compose injecta `localhost` / `${MINIO_PORT:-9000}`. |
| `BETTER_AUTH_SECRET` | Sí | Clau de signatura de sessions. Cadena aleatòria llarga. |
| `BETTER_AUTH_URL` | Sí | URL pública de l'app: `http://localhost:3000` en dev; Compose injecta `http://localhost` al contenidor. |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Per al seed | Credencials del primer administrador que crea `npx prisma db seed`. |
| `ANTHROPIC_API_KEY` | No | Clau de l'API d'Anthropic per a la importació de factures. Només es llegeix al servidor. |

El fitxer `.env` està al `.gitignore`; només es versiona `.env.example`.

---

## Comandes útils

```bash
npm run dev                  # servidor de desenvolupament (http://localhost:3000)
npm run build && npm start   # build de producció + servidor
npm run lint                 # ESLint

npx prisma generate          # regenera el client després de canviar schema.prisma
npx prisma migrate deploy    # aplica migracions pendents (instal·lació / producció)
npx prisma migrate dev --name <nom>   # crea una migració nova a partir del schema (desenvolupament)
npx prisma db seed           # crea l'usuari admin (idempotent)
npx prisma studio            # explorador de la BD (http://localhost:5555)

docker compose up -d postgres minio   # només infraestructura
docker compose up -d --build          # tot l'stack, incloent la imatge de Next.js
docker compose logs -f nextjs         # logs del contenidor de l'app
docker compose down                   # atura (conserva volums)

docker exec -it dentaia-postgres psql -U appdental -d appdental   # consola SQL
```

Si canvies `schema.prisma`, no editis migracions existents: crea'n una de nova. Després de `prisma generate`, reinicia `npm run dev` perquè el procés carregui el client nou.

---

## Estructura del projecte

```
.
├── docker-compose.yml           Postgres + MinIO + Nginx + Next.js
├── Dockerfile                   Imatge multi-stage de Next.js (standalone)
├── nginx/nginx.conf             Reverse proxy (/ → nextjs, /minio/ → consola MinIO)
├── prisma/
│   ├── schema.prisma            Model de dades (auth + domini + auditoria)
│   ├── migrations/              Historial de migracions SQL
│   ├── seed.ts                  Usuari admin inicial
│   └── seed-demo.sql            Dades de demostració
├── prisma.config.ts             Configuració de Prisma 7 (carrega .env)
├── next.config.ts               output: standalone, límit de 6 MB per a Server Actions
├── test-fixtures/               PDFs de prova i smoke tests de la importació IA
└── src/
    ├── app/
    │   ├── (private)/           Mòduls autenticats (dashboard, despeses, inventari…)
    │   ├── api/auth/[...all]/   Handler de Better Auth
    │   ├── login/               Pantalla d'inici de sessió
    │   └── canvi-contrasenya/   Canvi de contrasenya (i force-flow del primer accés)
    ├── components/
    │   ├── ui/                  shadcn/ui
    │   └── app/                 Components propis (nav, toasts, accions de fila…)
    ├── domain/                  Tipus, esquemes Zod, permisos, validadors (NIF, PGC…)
    ├── services/                Casos d'ús i control d'accés
    ├── repositories/            Prisma, MinIO, Anthropic
    ├── lib/                     auth.ts (Better Auth), format, request-context, utils
    └── proxy.ts                 Redireccions d'autenticació de les rutes privades
```

---

## Problemes habituals

**`P1001: Can't reach database server`** — el contenidor de Postgres no està aixecat o `DATABASE_URL` apunta a un port equivocat (recorda el `5433` si tens l'override). Comprova-ho amb `docker compose ps`.

**`Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD`** — falten aquestes variables al `.env`. El seed no crea cap usuari sense elles.

**`No hi ha cap usuari ADMIN`** en carregar `seed-demo.sql` — executa primer `npx prisma db seed`.

**La descàrrega d'una factura no obre / apunta a `minio:9000`** — en mode Docker complet, `MINIO_PUBLIC_ENDPOINT`/`MINIO_PUBLIC_PORT` del servei `nextjs` han de ser l'adreça de MinIO publicada a l'host (per defecte `localhost:9000`).

**MinIO no arrenca / es reinicia** — `MINIO_ROOT_PASSWORD` ha de tenir com a mínim 8 caràcters.

**L'app no troba tipus o columnes noves després de canviar el schema** — executa `npx prisma generate` i reinicia `npm run dev`.

**La importació IA retorna error** — comprova que `ANTHROPIC_API_KEY` és al `.env` i que has reiniciat `npm run dev` després d'afegir-la. Els fitxers han de ser PDF de com a màxim 5 MB.

**`npx prisma migrate dev` diu que l'entorn no és interactiu** — passa en terminals sense TTY. Per instal·lar, fes servir `npx prisma migrate deploy`.

**El port 80 / 5432 / 9000 ja està en ús** — algun altre servei (o el repositori manual) els ocupa. Fes servir l'override de ports descrit més amunt.

**Windows: `npm run dev` peta amb `path length for file ... exceeds max length of filesystem`** — és el límit de 260 caràcters de les rutes de Windows: Turbopack genera fitxers amb noms llargs dins de `.next/` i, si el repositori és en una carpeta profunda (OneDrive, Escriptori\Carpeta\Subcarpeta…), es passa del límit. Clona el repositori en una ruta curta (per exemple `C:\dev\tfg-appdental-ia`) o activa les rutes llargues de Windows (`git config --global core.longpaths true` i la clau `LongPathsEnabled` del registre).

**Windows: `cp: command not found` / `openssl` no existeix** — les comandes del README són de Bash (Git Bash les té totes). A PowerShell fes `Copy-Item .env.example .env` i genera el secret amb `npx @better-auth/cli@latest secret`.

---

## Autor

Ferran Paredes — Treball de Final de Grau, Universitat de Girona (2026).
