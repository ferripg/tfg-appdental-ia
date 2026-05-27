import { cookies } from "next/headers";
import {
  BusinessError,
  NotFoundError,
  ValidationError,
} from "@/domain/errors";
import {
  type UserListFilters,
  type UserRole,
  userCreateSchema,
  userUpdateSchema,
} from "@/domain/user";
import { auth } from "@/lib/auth";
import { usersRepository } from "@/repositories/users-repository";
import { requireAdmin } from "./auth-service";
import { flattenZodErrors } from "./zod-helpers";

/**
 * Better Auth default session cookie name. Hardcoded here (not derived
 * from a public API) because we need to read+restore it explicitly to
 * cancel the side-effect of `auth.api.signUpEmail` from a Server Action.
 * If a future Better Auth version renames the cookie this constant must
 * change in lockstep — the e2e test "admin stays logged in after create"
 * catches a regression immediately.
 */
const BETTER_AUTH_COOKIE = "better-auth.session_token";

export const usersService = {
  async list(filters: UserListFilters) {
    await requireAdmin();
    return usersRepository.findAll(filters);
  },

  async get(id: string) {
    await requireAdmin();
    const user = await usersRepository.findById(id);
    if (!user) throw new NotFoundError("Usuari no trobat");
    return user;
  },

  /**
   * Admin-created user flow.
   *
   * Why save+restore the cookie:
   *   `auth.api.signUpEmail` triggers the `nextCookies()` plugin which
   *   pushes a `Set-Cookie: better-auth.session_token=<new user token>`
   *   through `cookies().set()`. From a Server Action, that header lands
   *   on the admin's response and silently logs them in as the freshly
   *   created user. We snapshot the admin cookie BEFORE the call and
   *   restore it AFTER, plus delete the orphan Session row from the DB.
   *
   * Alternative considered: Better Auth `admin()` plugin — `createUser`
   * doesn't have this side-effect but ships a schema delta (banned,
   * banReason, banExpires on User; impersonatedBy on Session) that would
   * need a migration and could conflict with our Role enum. Deferred to
   * Sprint 3+ if we ever need impersonation or full ban support.
   */
  async create(input: unknown) {
    await requireAdmin();

    const parsed = userCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        "Hi ha errors al formulari",
        flattenZodErrors(parsed.error),
      );
    }
    const { email, name, role, password, actiu } = parsed.data;

    const existing = await usersRepository.findByEmail(email);
    if (existing) {
      throw new BusinessError("L'email ja està registrat", {
        email: ["Ja existeix un usuari amb aquest email"],
      });
    }

    // Step 1 — snapshot the admin's cookie before signUpEmail overwrites it.
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get(BETTER_AUTH_COOKIE);

    // Step 2 — Better Auth builds User + Account with a scrypt-hashed
    // password compatible with the login flow.
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
    });

    // Step 3 — restore the admin cookie. nextCookies has already called
    // cookies().set(BETTER_AUTH_COOKIE, newUserToken); we overwrite it
    // with the original admin value before the response is serialized.
    if (adminCookie) {
      cookieStore.set(BETTER_AUTH_COOKIE, adminCookie.value, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    // Step 4 — apply admin-controlled fields signup doesn't expose.
    await usersRepository.applyAdminCreatedFlags(result.user.id, {
      role,
      actiu,
      mustChangePassword: true,
    });

    // Step 5 — drop the orphan Session row produced by signUpEmail so
    // the new user has zero live sessions until they log in themselves.
    await usersRepository.dropAllSessionsFor(result.user.id);

    return usersRepository.findById(result.user.id);
  },

  async updateProfile(id: string, input: unknown) {
    await requireAdmin();
    const current = await usersRepository.findById(id);
    if (!current) throw new NotFoundError("Usuari no trobat");

    const parsed = userUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        "Hi ha errors al formulari",
        flattenZodErrors(parsed.error),
      );
    }

    if (parsed.data.email !== current.email) {
      const dup = await usersRepository.findByEmail(parsed.data.email);
      if (dup && dup.id !== id) {
        throw new BusinessError("L'email ja està registrat", {
          email: ["Ja existeix un usuari amb aquest email"],
        });
      }
    }

    return usersRepository.updateProfile(id, parsed.data);
  },

  async setRole(id: string, role: UserRole) {
    const session = await requireAdmin();

    if (session.user.id === id) {
      throw new BusinessError("No pots canviar el teu propi rol", {
        role: ["Demana-ho a un altre administrador"],
      });
    }

    const target = await usersRepository.findById(id);
    if (!target) throw new NotFoundError("Usuari no trobat");
    if (target.role === role) return target;

    // Last-admin protection: refuse to degrade the only remaining active
    // administrator. Compares against `<= 1` because the target is still
    // counted as active at this moment.
    if (target.role === "ADMIN" && role !== "ADMIN" && target.actiu) {
      const remaining = await usersRepository.countActiveAdmins();
      if (remaining <= 1) {
        throw new BusinessError(
          "Hi ha d'haver com a mínim un administrador actiu",
          { role: ["No pots degradar l'únic administrador actiu"] },
        );
      }
    }

    return usersRepository.setRole(id, role);
  },

  async setActiu(id: string, actiu: boolean) {
    const session = await requireAdmin();

    if (session.user.id === id && !actiu) {
      throw new BusinessError("No pots desactivar el teu propi usuari", {
        actiu: ["Demana-ho a un altre administrador"],
      });
    }

    const target = await usersRepository.findById(id);
    if (!target) throw new NotFoundError("Usuari no trobat");
    if (target.actiu === actiu) return target;

    // Last-admin protection for deactivation: refuse if the target is the
    // only active admin.
    if (target.role === "ADMIN" && !actiu) {
      const remaining = await usersRepository.countActiveAdmins();
      if (remaining <= 1) {
        throw new BusinessError(
          "Hi ha d'haver com a mínim un administrador actiu",
        );
      }
    }

    return usersRepository.setActiu(id, actiu);
  },
};
