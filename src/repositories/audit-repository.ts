import type { AuditLog as PrismaAuditLog, Prisma, User } from "@prisma/client";
import type {
  AuditInput,
  AuditJson,
  AuditLogEntry,
  AuditLogFilters,
} from "@/domain/audit";
import { prisma } from "./prisma-client";

/**
 * Sostre de files retornades per la consulta. El log creix sense límit, així
 * que la pantalla en mostra les més recents fins a aquest màxim (els filtres
 * d'acció i data permeten acotar-ho més). Si calgués paginació real, és el
 * punt natural per introduir-la.
 */
const MAX_ROWS = 200;

type PrismaAuditWithUser = PrismaAuditLog & {
  user: Pick<User, "name" | "email"> | null;
};

/**
 * Els camps `canvis`/`metadata` són `Json?` a Prisma (tipus `JsonValue`). Els
 * desem i recuperem sempre com a objecte clau-valor, així que els reduïm a
 * `AuditJson | null` per a la UI; qualsevol altra forma (array, escalar) es
 * tracta com a absència.
 */
function toJson(value: Prisma.JsonValue | null): AuditJson | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AuditJson)
    : null;
}

/**
 * `AuditJson` (Record<string, unknown>) i `Prisma.InputJsonValue` no se
 * solapen estructuralment (els valors `unknown` no són `JsonValue`), així que
 * el cast ha de passar per `unknown`. Retorna `undefined` per a null/absència,
 * de manera que Prisma deixa la columna a NULL en lloc d'escriure JSON `null`.
 */
function toJsonInput(
  value: AuditJson | null | undefined,
): Prisma.InputJsonValue | undefined {
  return value == null ? undefined : (value as unknown as Prisma.InputJsonValue);
}

function toDomain(row: PrismaAuditWithUser): AuditLogEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    userId: row.userId,
    user: row.user,
    accio: row.accio,
    entitat: row.entitat,
    entitatId: row.entitatId,
    canvis: toJson(row.canvis),
    ip: row.ip,
    metadata: toJson(row.metadata),
  };
}

export const auditRepository = {
  /**
   * Insereix un registre d'auditoria. Pot llançar (BD caiguda, etc.): és
   * responsabilitat del servei (`auditService.record`) empassar-se l'error
   * perquè el log no trenqui mai l'operació principal de l'usuari.
   */
  async create(entry: AuditInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        accio: entry.accio,
        entitat: entry.entitat ?? null,
        entitatId: entry.entitatId ?? null,
        // Ometre el camp (undefined) deixa el NULL de la columna; passar
        // l'objecte fa que Prisma el serialitzi com a JSON.
        canvis: toJsonInput(entry.canvis),
        ip: entry.ip ?? null,
        metadata: toJsonInput(entry.metadata),
      },
    });
  },

  /** Registres més recents que compleixen els filtres (acció i rang de dates). */
  async findAll(filters: AuditLogFilters = {}): Promise<AuditLogEntry[]> {
    const { accio, des, fins } = filters;
    const where: Prisma.AuditLogWhereInput = {
      ...(accio ? { accio } : {}),
      ...(des || fins
        ? {
            timestamp: {
              ...(des ? { gte: des } : {}),
              // `fins` arriba a mitjanit UTC; el sumem un dia i usem `lt` per
              // incloure tots els esdeveniments d'aquell dia (tenen hora).
              ...(fins
                ? { lt: new Date(fins.getTime() + 24 * 60 * 60 * 1000) }
                : {}),
            },
          }
        : {}),
    };

    const rows = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { timestamp: "desc" },
      take: MAX_ROWS,
    });
    return rows.map(toDomain);
  },
};
