import * as Minio from "minio";

const FACTURES_BUCKET = "factures";

const globalForMinio = globalThis as unknown as {
  minio: Minio.Client | undefined;
  bucketReady: Promise<void> | null;
};

function createClient(): Minio.Client {
  return new Minio.Client({
    // Dev local: Next.js corre al host i ha de connectar al MinIO publicat
    // al port 9000 de localhost. Docker-compose injecta MINIO_ENDPOINT=minio
    // (DNS intern de la xarxa docker). Per al MVP només dev local; per al
    // deploy en compose caldrà refactor a 2 clients (internal + public).
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: Number(process.env.MINIO_PORT || 9000),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey:
      process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || "",
    secretKey:
      process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || "",
  });
}

export const minioClient = globalForMinio.minio ?? createClient();
if (process.env.NODE_ENV !== "production") {
  globalForMinio.minio = minioClient;
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
