import type {
  AccioAudit,
  AuditJson,
  AuditLogFilters,
} from "@/domain/audit";
import { getClientIp } from "@/lib/request-context";
import { auditRepository } from "@/repositories/audit-repository";

/**
 * Servei d'auditoria.
 *
 * NOTA D'ARQUITECTURA — per què NO importa `auth-service`:
 *   `record()` s'invoca des de `src/lib/auth.ts` (hooks de login). Si aquest
 *   servei importés `auth-service` (que al seu torn importa `@/lib/auth`),
 *   tindríem un import circular `lib/auth → audit-service → auth-service →
 *   lib/auth`, exactament el que `login-security-service` ja evita. Per això
 *   `record()` només depèn del repositori i del context de petició, i la
 *   porta d'administrador de la pantalla de consulta es comprova a la pàgina
 *   (`requireAdmin()` + `notFound()`), seguint el patró de /usuaris.
 */

type RecordOpts = {
  entitat?: string | null;
  entitatId?: string | null;
  canvis?: AuditJson | null;
  metadata?: AuditJson | null;
  /**
   * IP del client. Si s'omet, s'intenta resoldre de les capçaleres de la
   * petició. Els hooks de Better Auth la passen explícita (tenen el seu propi
   * objecte de capçaleres), de manera que allà no es toca `next/headers`.
   */
  ip?: string | null;
};

export const auditService = {
  /**
   * Desa un registre d'auditoria. **Mai llança**: si el log falla (BD caiguda,
   * dades inesperades…), només en deixa traça per consola. L'operació
   * principal de l'usuari no s'ha de veure mai afectada per un error
   * d'auditoria (criteri d'acceptació IA-14).
   */
  async record(
    userId: string | null,
    accio: AccioAudit,
    opts: RecordOpts = {},
  ): Promise<void> {
    try {
      const ip = opts.ip !== undefined ? opts.ip : await getClientIp();
      await auditRepository.create({
        userId,
        accio,
        entitat: opts.entitat ?? null,
        entitatId: opts.entitatId ?? null,
        canvis: opts.canvis ?? null,
        ip,
        metadata: opts.metadata ?? null,
      });
    } catch (err) {
      console.error(
        `[auditService.record] no s'ha pogut desar el registre d'auditoria (${accio}):`,
        err,
      );
    }
  },

  /**
   * Llista els registres per a la pantalla de consulta. NO comprova rol: el
   * gate d'administrador es fa a la pàgina (vegeu la nota d'arquitectura).
   */
  async list(filters: AuditLogFilters) {
    return auditRepository.findAll(filters);
  },
};
