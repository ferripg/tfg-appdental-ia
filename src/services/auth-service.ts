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
