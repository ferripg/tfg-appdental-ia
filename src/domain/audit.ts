/**
 * Domini de l'auditoria (registre d'esdeveniments).
 *
 * Aquest mòdul és pur: NO importa `@prisma/client` (regla hexagonal del repo,
 * el client de Prisma només viu a `src/repositories/`). Per això les accions
 * es declaren aquí com una unió de literals — un MIRALL exacte (string a
 * string) de l'enum `AccioAudit` definit a `schema.prisma`. El repositori fa
 * el pont entre aquesta unió i l'enum de Prisma (mateixos valors).
 *
 * Què registrem (criteri IA-14): esdeveniments d'autenticació i operacions que
 * canvien estat sensible (gestió d'usuaris, operacions financeres, esborrats).
 * Les LECTURES no s'auditen mai.
 */

/** Conjunt tancat d'accions auditables (mirall de l'enum `AccioAudit`). */
export const AUDIT_ACCIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN_OK",
  "LOGIN_FAIL",
  "LOGOUT",
  "PASSWORD_CHANGE",
  "PASSWORD_RESET",
  "USER_BLOCKED",
  "USER_UNBLOCKED",
  "ROLE_CHANGED",
  "EXERCICI_TANCAT",
  "EXERCICI_REOBERT",
  "AMORTITZACIONS_GENERATED",
  "AMORTITZACIONS_RETROCEDIDES",
] as const;

export type AccioAudit = (typeof AUDIT_ACCIONS)[number];

/** Etiqueta llegible en català de cada acció (per a la pantalla de consulta). */
export const ACCIO_LABELS: Record<AccioAudit, string> = {
  CREATE: "Creació",
  UPDATE: "Modificació",
  DELETE: "Eliminació",
  LOGIN_OK: "Inici de sessió",
  LOGIN_FAIL: "Intent d'accés fallit",
  LOGOUT: "Tancament de sessió",
  PASSWORD_CHANGE: "Canvi de contrasenya",
  PASSWORD_RESET: "Restabliment de contrasenya",
  USER_BLOCKED: "Usuari desactivat",
  USER_UNBLOCKED: "Usuari reactivat",
  ROLE_CHANGED: "Canvi de rol",
  EXERCICI_TANCAT: "Exercici tancat",
  EXERCICI_REOBERT: "Exercici reobert",
  AMORTITZACIONS_GENERATED: "Amortitzacions generades",
  AMORTITZACIONS_RETROCEDIDES: "Amortitzacions retrocedides",
};

/**
 * Família visual de l'acció, per agrupar i acolorir les files de la taula:
 * - `auth`: inici/tancament de sessió correctes,
 * - `seguretat`: intents fallits, bloqueig/desbloqueig, canvis de rol/contrasenya,
 * - `fiscal`: amortitzacions i tancaments d'exercici,
 * - `dades`: alta/modificació/baixa de registres del domini.
 */
export type FamiliaAccio = "auth" | "seguretat" | "fiscal" | "dades";

export function familiaDeAccio(accio: AccioAudit): FamiliaAccio {
  switch (accio) {
    case "LOGIN_OK":
    case "LOGOUT":
      return "auth";
    case "LOGIN_FAIL":
    case "USER_BLOCKED":
    case "USER_UNBLOCKED":
    case "ROLE_CHANGED":
    case "PASSWORD_CHANGE":
    case "PASSWORD_RESET":
      return "seguretat";
    case "AMORTITZACIONS_GENERATED":
    case "AMORTITZACIONS_RETROCEDIDES":
    case "EXERCICI_TANCAT":
    case "EXERCICI_REOBERT":
      return "fiscal";
    default:
      return "dades";
  }
}

/** Dades JSON arbitràries d'un registre (context o diff vell→nou). */
export type AuditJson = Record<string, unknown>;

/**
 * Entrada a desar al log. `userId` és null per a esdeveniments de sistema o per
 * a un `LOGIN_FAIL` amb un email desconegut (no en sabem l'usuari).
 */
export type AuditInput = {
  userId: string | null;
  accio: AccioAudit;
  entitat?: string | null;
  entitatId?: string | null;
  canvis?: AuditJson | null;
  ip?: string | null;
  metadata?: AuditJson | null;
};

/** Registre del log enriquit amb l'usuari, tal com el mostra la pantalla. */
export type AuditLogEntry = {
  id: string;
  timestamp: Date;
  userId: string | null;
  user: { name: string | null; email: string } | null;
  accio: AccioAudit;
  entitat: string | null;
  entitatId: string | null;
  canvis: AuditJson | null;
  ip: string | null;
  metadata: AuditJson | null;
};

/** Filtres de consulta del log (com a mínim per acció i per data). */
export type AuditLogFilters = {
  accio?: AccioAudit;
  des?: Date;
  fins?: Date;
};

/** Comprova si un string és una acció auditable vàlida (per parsejar filtres). */
export function isAccioAudit(value: string): value is AccioAudit {
  return (AUDIT_ACCIONS as readonly string[]).includes(value);
}
