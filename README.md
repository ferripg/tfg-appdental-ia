# AppDental (TFG) - Repositori IA

Aquest és el codi font pertanyent a la branca **assistida per IA** del Treball de Final de Grau per al sistema de gestió clínica **AppDental**. El desenvolupament es fa amb Claude Code (Skills + MCP + agents) com a copilot principal. La branca paral·lela `tfg-appdental-manual` conté la mateixa aplicació desenvolupada manualment, sense assistència agèntica, per fer-ne la comparativa empírica de productivitat metodològica que constitueix l'aportació acadèmica del TFG.

Tota l'arquitectura està unificada en un monorepo combinant els serveis de xarxa en un Clúster de contenidors locals.

## 🛠 Requisits del Sistema
Abans de descarregar i començar a treballar, assegureu-vos de tenir instal·lat:
- **Docker i Docker Compose** (Per als gestors PostgreSQL i MinIO S3).
- **Node.js LTS (v24)** (Recomanat per interactuar amb la consola Prisma local).
- **Git**

## 🚀 Arrencada de l'Entorn de Desenvolupament

L'aplicació està completament orquestrada en contenidors (Base de Dades, Object Storage, Reverse Proxy web i App). Per posar-la en marxa des de zero:

### 1. Variables d'Entorn
L'entorn exigeix un arxiu invisible amb les claus directives a l'arrel de la carpeta anomenat `.env`. 
*(Per motius de seguretat no figura a Github. Demaneu l'accés al .env.example i importeu la Base de Dades i l'Adreça Minio pròpia).*

### 2. Construcció del Clúster (Docker)
Des de la terminal, en l'arrel de projecte (`tfg-appdental-ia`), descarregueu i engegueu totes les imatges preconfigurades del fitxer `docker-compose.yml`:

```bash
docker compose up -d
```
Docker crearà els Volums Persistents pel vostre ordinador de manera que en el futur no perdrà dades encara que apagueu en sec.

### 3. Migracions Inicials (ORM Prisma)
Per assegurar que el PostgreSQL verge de Docker entén els taules mèdiques i per sincronitzar estats, cal instal·lar depèndencies locals de Node i tirar la comunicació d'Esquema:

```bash
npm install
npx prisma migrate dev
```

### 4. Accés als Serveis Locals
Un cop les migracions han resolt favorablement, tota la xarxa estarà operativa. Com que treballem darrere d'un Proxy NGINX per gestionar asincronia:

- **AppDental Client (FrontEnd):** [http://localhost](http://localhost) (Port Obert Web a NGINX).
- **Servidor de Radiografies (MinIO):** [http://localhost/minio/](http://localhost/minio/) o `localhost:9001` (Credencials via .env).
- **Taules Mèdiques Vives (Prisma Studio):** Executa `npx prisma studio` a la teva consola. Normalment s'obre per defecte a `http://localhost:5555`.

---

### Manteniment Rutinari d'Apagada
Per no castigar el portàtil al deixar de programar ni consumir ports secundaris (Resta de Sprints):
```bash
docker compose down
```
