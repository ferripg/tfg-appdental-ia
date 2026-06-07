/**
 * Domain error hierarchy.
 *
 * Server Actions catch these and map them to `{ error, fieldErrors }`
 * responses for the form. Any other error is treated as a technical
 * failure and is logged + surfaced as a generic "torna-ho a provar".
 */
export class DomainError extends Error {
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = new.target.name;
    this.fieldErrors = fieldErrors;
  }
}

/** Input does not conform to the domain schema (Zod). */
export class ValidationError extends DomainError {}

/** Input is well-formed but violates a business rule (e.g. unique NIF). */
export class BusinessError extends DomainError {}

/** Requested resource does not exist. */
export class NotFoundError extends DomainError {}

/** Caller is not authenticated. */
export class UnauthorizedError extends DomainError {}

/** Caller is authenticated but lacks the required role (e.g. non-ADMIN at /usuaris). */
export class ForbiddenError extends DomainError {}

/**
 * El compte existeix però està desactivat (`actiu = false`): l'admin l'ha
 * inhabilitat. No pot iniciar sessió fins que el reactivin. Es llança des
 * de la lògica de seguretat del login i l'adaptador de Better Auth la
 * tradueix a un `APIError` 403.
 */
export class AccountDisabledError extends DomainError {}

/**
 * El compte està bloquejat temporalment per massa intents fallits seguits.
 * `retryAfterMinutes` és el temps que falta perquè expiri el bloqueig, per
 * poder-ho comunicar a l'usuari sense revelar la política exacta.
 */
export class AccountLockedError extends DomainError {
  readonly retryAfterMinutes: number;

  constructor(message: string, retryAfterMinutes: number) {
    super(message);
    this.retryAfterMinutes = retryAfterMinutes;
  }
}
