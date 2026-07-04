import Anthropic from "@anthropic-ai/sdk";

/**
 * Client singleton de l'API d'Anthropic (mirall del patró de `minio-client`).
 * La clau es llegeix d'`ANTHROPIC_API_KEY` (mai arriba al navegador: aquest
 * mòdul només s'importa des de repositoris, que corren al servidor).
 * El paquet `@anthropic-ai/sdk` no surt mai d'aquest fitxer ni del repositori
 * d'extracció (regla hexagonal, com `minio` i `@prisma/client`).
 */
const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropicClient = globalForAnthropic.anthropic ?? new Anthropic();

if (process.env.NODE_ENV !== "production") {
  globalForAnthropic.anthropic = anthropicClient;
}
