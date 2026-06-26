import { APIError } from "better-auth/api";
import { cookies, headers } from "next/headers";
import {
  BusinessError,
  NotFoundError,
  ValidationError,
} from "@/domain/errors";
import {
  changePasswordSchema,
  type UserListFilters,
  userCreateSchema,
  userUpdateSchema,
} from "@/domain/user";
import { auth } from "@/lib/auth";
import { usersRepository } from "@/repositories/users-repository";
import { auditService } from "./audit-service";
import { requireAdmin, requireSession } from "./auth-service";
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
    const session = await requireAdmin();

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

    // Auditoria: alta d'usuari (qui l'ha creat, amb quin email i rol).
    await auditService.record(session.user.id, "CREATE", {
      entitat: "User",
      entitatId: result.user.id,
      metadata: { email, role },
    });

    return usersRepository.findById(result.user.id);
  },

  /**
   * Edició unificada d'un usuari (IA-18): nom, email, rol i estat en una sola
   * desada. Reuneix el que abans eren tres operacions separades (perfil, rol,
   * estat) perquè la UI tingui un únic botó "Desa els canvis" a baix.
   *
   * Guards de negoci:
   * - Un admin no pot canviar el SEU propi rol ni estat: en aquest cas els
   *   controls van desactivats i no s'envien, així que es mantenen els valors
   *   actuals (no canvien, no es llança error).
   * - No es pot deixar el sistema sense cap administrador ACTIU: si l'usuari
   *   és l'únic admin actiu i la desada el degradaria o el desactivaria, es
   *   rebutja amb errors de camp.
   */
  async update(id: string, input: unknown) {
    const session = await requireAdmin();
    const current = await usersRepository.findById(id);
    if (!current) throw new NotFoundError("Usuari no trobat");

    const parsed = userUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        "Hi ha errors al formulari",
        flattenZodErrors(parsed.error),
      );
    }
    const data = parsed.data;

    if (data.email !== current.email) {
      const dup = await usersRepository.findByEmail(data.email);
      if (dup && dup.id !== id) {
        throw new BusinessError("L'email ja està registrat", {
          email: ["Ja existeix un usuari amb aquest email"],
        });
      }
    }

    // Auto-edició: rol i estat propis no es toquen (controls desactivats, no
    // arriben al formulari) → es mantenen els valors actuals.
    const isSelf = session.user.id === id;
    const targetRole = isSelf ? current.role : (data.role ?? current.role);
    const targetActiu = isSelf ? current.actiu : (data.actiu ?? current.actiu);
    const roleChanged = targetRole !== current.role;
    const actiuChanged = targetActiu !== current.actiu;

    // Protecció de l'últim administrador actiu.
    if (current.role === "ADMIN" && current.actiu) {
      const seguiraSentAdminActiu = targetRole === "ADMIN" && targetActiu;
      if (!seguiraSentAdminActiu) {
        const remaining = await usersRepository.countActiveAdmins();
        if (remaining <= 1) {
          throw new BusinessError(
            "Hi ha d'haver com a mínim un administrador actiu",
            {
              ...(roleChanged
                ? { role: ["No pots degradar l'únic administrador actiu"] }
                : {}),
              ...(actiuChanged
                ? { actiu: ["No pots desactivar l'únic administrador actiu"] }
                : {}),
            },
          );
        }
      }
    }

    const updated = await usersRepository.updateFull(id, {
      name: data.name,
      email: data.email,
      role: targetRole,
      actiu: targetActiu,
    });

    // En desactivar, expulsa l'usuari de qualsevol sessió viva (el proxy el
    // redirigirà a /login al pròxim request).
    if (actiuChanged && !targetActiu) {
      await usersRepository.dropAllSessionsFor(id);
    }

    // Auditoria: sempre UPDATE; a més ROLE_CHANGED i/o USER_BLOCKED/UNBLOCKED
    // segons què hagi canviat.
    await auditService.record(session.user.id, "UPDATE", {
      entitat: "User",
      entitatId: id,
      metadata: { email: data.email },
    });
    if (roleChanged) {
      await auditService.record(session.user.id, "ROLE_CHANGED", {
        entitat: "User",
        entitatId: id,
        metadata: { de: current.role, a: targetRole },
      });
    }
    if (actiuChanged) {
      await auditService.record(
        session.user.id,
        targetActiu ? "USER_UNBLOCKED" : "USER_BLOCKED",
        { entitat: "User", entitatId: id },
      );
    }

    return updated;
  },

  /**
   * Canvi de contrasenya propi (IA-20). Valida la nova (política + confirmació),
   * delega la verificació de l'ACTUAL a Better Auth (changePassword) i revoca
   * les altres sessions. En èxit, neteja `mustChangePassword` i ho audita.
   */
  async changeOwnPassword(input: unknown) {
    const session = await requireSession();

    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        "Hi ha errors al formulari",
        flattenZodErrors(parsed.error),
      );
    }
    const { actual, nova } = parsed.data;

    try {
      await auth.api.changePassword({
        body: {
          currentPassword: actual,
          newPassword: nova,
          revokeOtherSessions: true,
        },
        headers: await headers(),
      });
    } catch (err) {
      // La nova ja està validada; l'error esperat aquí és que l'actual no
      // sigui correcta. El traduïm a un error de camp clar.
      if (err instanceof APIError) {
        throw new BusinessError("La contrasenya actual no és correcta", {
          actual: ["La contrasenya actual no és correcta"],
        });
      }
      throw err;
    }

    await usersRepository.clearMustChangePassword(session.user.id);
    await auditService.record(session.user.id, "PASSWORD_CHANGE", {
      entitat: "User",
      entitatId: session.user.id,
    });
  },
};
