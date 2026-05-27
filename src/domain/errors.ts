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
