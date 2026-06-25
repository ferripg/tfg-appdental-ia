import { headers } from "next/headers";
import { ForbiddenError, UnauthorizedError } from "@/domain/errors";
import { auth } from "@/lib/auth";

/**
 * Validates that the current request has an active Better Auth session.
 *
 * Returns the session (with `user`) or throws `UnauthorizedError`, which
 * Server Actions can catch and translate into `{ error }` payloads. Per-
 * role authorization (RBAC) sits on top of this via `requireAdmin`.
 */
export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new UnauthorizedError("Cal iniciar sessió");
  return session;
}

/**
 * Authorization gate for admin-only operations.
 *
 * Page Server Components are expected to catch `ForbiddenError` and respond
 * with `notFound()` — that way the existence of the route is not leaked to
 * non-admins. Server Actions surface the error through the standard
 * `DomainError` handling and the form shows it.
 *
 * `session.user.role` is populated by Better Auth thanks to the
 * `user.additionalFields.role` declaration in `src/lib/auth.ts`.
 */
export async function requireAdmin() {
  const session = await requireSession();
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") {
    throw new ForbiddenError("Cal ser administrador");
  }
  return session;
}

/**
 * Authorization gate for domain write operations (create/update/delete of
 * proveïdors, tipus de despesa, inventari, amortitzacions, and editing or
 * deleting despeses). Allowed for MANAGER and ADMIN; OPERARI is read-only on
 * the domain (it may only CREATE despeses, which stays behind `requireSession`).
 *
 * Like `requireAdmin`, pages catch `ForbiddenError` and respond with
 * `notFound()`; Server Actions surface it through the standard error handling.
 */
export async function requireManager() {
  const session = await requireSession();
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new ForbiddenError("Cal ser gestor o administrador");
  }
  return session;
}

/**
 * Rol de la sessió actual (o null si no hi ha sessió). Pensat per a Server
 * Components que han de decidir què mostrar segons el rol sense llançar:
 * el layout privat ja garanteix la sessió, però aquesta funció no peta si
 * no n'hi ha.
 */
export async function currentRole(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session ? ((session.user as { role?: string }).role ?? null) : null;
}
