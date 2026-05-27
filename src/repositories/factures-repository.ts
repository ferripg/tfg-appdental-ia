import { BUCKET, ensureFacturesBucket, minioClient } from "./minio-client";

const PRESIGNED_EXPIRY_SECONDS = 15 * 60;

/**
 * Thin wrapper around the MinIO client for invoice files. Encapsulates the
 * three operations the service layer needs: upload from a Buffer, generate
 * a time-limited download URL, and remove. The `minio` package never leaks
 * outside this file (hexagonal rule, mirror of @prisma/client confinement).
 */
export const facturesRepository = {
  async upload(key: string, buffer: Buffer, mime: string): Promise<void> {
    await ensureFacturesBucket();
    await minioClient.putObject(BUCKET, key, buffer, buffer.length, {
      "Content-Type": mime,
    });
  },

  async getDownloadUrl(key: string): Promise<string> {
    await ensureFacturesBucket();
    return minioClient.presignedGetObject(BUCKET, key, PRESIGNED_EXPIRY_SECONDS);
  },

  async remove(key: string): Promise<void> {
    await ensureFacturesBucket();
    await minioClient.removeObject(BUCKET, key);
  },
};
