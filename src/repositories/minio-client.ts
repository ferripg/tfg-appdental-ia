import * as Minio from "minio";

const FACTURES_BUCKET = "factures";

const globalForMinio = globalThis as unknown as {
  minio: Minio.Client | undefined;
  minioPublic: Minio.Client | undefined;
  bucketReady: Promise<void> | null;
};

const ACCESS_KEY =
  process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || "";
const SECRET_KEY =
  process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || "";

/** Endpoint que fa servir el SERVIDOR per parlar amb MinIO (pujar, esborrar…). */
const INTERNAL = {
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: process.env.MINIO_USE_SSL === "true",
};

/**
 * Endpoint que veu el NAVEGADOR. Les URL signades (presigned) porten el host
 * dins la signatura, així que s'han de generar contra l'adreça que el client
 * pot resoldre. En dev local coincideix amb l'intern (localhost:9000); dins
 * de docker-compose l'intern és `minio:9000` (DNS de la xarxa docker), que el
 * navegador no coneix, i el compose injecta MINIO_PUBLIC_* amb l'adreça
 * publicada a l'host.
 */
const PUBLIC = {
  endPoint: process.env.MINIO_PUBLIC_ENDPOINT || INTERNAL.endPoint,
  port: Number(process.env.MINIO_PUBLIC_PORT || INTERNAL.port),
  useSSL: process.env.MINIO_PUBLIC_USE_SSL
    ? process.env.MINIO_PUBLIC_USE_SSL === "true"
    : INTERNAL.useSSL,
};

function createClient(): Minio.Client {
  return new Minio.Client({
    ...INTERNAL,
    accessKey: ACCESS_KEY,
    secretKey: SECRET_KEY,
  });
}

/**
 * Client només per SIGNAR URL públiques. Es fixa `region` perquè el SDK no
 * intenti resoldre la regió del bucket per xarxa contra l'endpoint públic
 * (que des de dins del contenidor pot no ser accessible).
 */
function createPublicClient(): Minio.Client {
  return new Minio.Client({
    ...PUBLIC,
    accessKey: ACCESS_KEY,
    secretKey: SECRET_KEY,
    region: "us-east-1",
  });
}

export const minioClient = globalForMinio.minio ?? createClient();
export const minioPublicClient =
  globalForMinio.minioPublic ?? createPublicClient();
if (process.env.NODE_ENV !== "production") {
  globalForMinio.minio = minioClient;
  globalForMinio.minioPublic = minioPublicClient;
}

/**
 * Ensures the `factures` bucket exists. The promise is cached on
 * `globalThis` so it survives HMR and is awaited at most once per
 * process. Idempotent — safe to call before every operation.
 */
export async function ensureFacturesBucket(): Promise<void> {
  if (!globalForMinio.bucketReady) {
    globalForMinio.bucketReady = (async () => {
      const exists = await minioClient.bucketExists(FACTURES_BUCKET);
      if (!exists) await minioClient.makeBucket(FACTURES_BUCKET, "us-east-1");
    })();
  }
  return globalForMinio.bucketReady;
}

export const BUCKET = FACTURES_BUCKET;
