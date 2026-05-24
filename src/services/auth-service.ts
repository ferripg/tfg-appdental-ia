import { headers } from "next/headers";
import { UnauthorizedError } from "@/domain/errors";
import { auth } from "@/lib/auth";

/**
 * Validates that the current request has an active Better Auth session.
 *
 * Returns the session (with `user`) or throws `UnauthorizedError`, which
 * Server Actions can catch and translate into `{ error }` payloads. Per-
 * role authorization (RBAC) will live in dedicated checks on top of this.
 */
export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new UnauthorizedError("Cal iniciar sessió");
  return session;
}
