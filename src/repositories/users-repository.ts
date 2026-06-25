import type { Role, User as PrismaUser } from "@prisma/client";
import type {
  User,
  UserListFilters,
  UserListItem,
  UserRole,
  UserSecurity,
} from "@/domain/user";
import { prisma } from "./prisma-client";

/**
 * Map a raw Prisma row into the pure domain type. Keeps `null` (not
 * `undefined`) for optional fields so the rest of the codebase has a
 * single, predictable contract.
 */
function toDomain(u: PrismaUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
    actiu: u.actiu,
    mustChangePassword: u.mustChangePassword,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export const usersRepository = {
  async findAll(filters: UserListFilters = {}): Promise<UserListItem[]> {
    const { search, role, includeInactius } = filters;
    const rows = await prisma.user.findMany({
      where: {
        ...(includeInactius ? {} : { actiu: true }),
        ...(role ? { role: role as Role } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ actiu: "desc" }, { name: "asc" }, { email: "asc" }],
    });
    return rows.map(toDomain);
  },

  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? toDomain(row) : null;
  },

  /**
   * Count active users currently holding the ADMIN role. Used by the
   * service to refuse degradations / deactivations that would leave the
   * app with zero administrators.
   */
  async countActiveAdmins(): Promise<number> {
    return prisma.user.count({ where: { role: "ADMIN", actiu: true } });
  },

  /**
   * After Better Auth's `signUpEmail` builds User + Account with a hashed
   * password, apply the admin-only fields the signup endpoint doesn't
   * expose: real role, actiu flag, and the forced-change flag.
   */
  async applyAdminCreatedFlags(
    userId: string,
    data: { role: UserRole; actiu: boolean; mustChangePassword: boolean },
  ): Promise<User> {
    const row = await prisma.user.update({
      where: { id: userId },
      data: {
        role: data.role as Role,
        actiu: data.actiu,
        mustChangePassword: data.mustChangePassword,
      },
    });
    return toDomain(row);
  },

  /**
   * Desa en una sola escriptura tots els camps editables d'un usuari (nom,
   * email, rol i estat). El servei és qui valida abans els guards de negoci
   * (no canviar el propi rol, no deixar el sistema sense administrador actiu).
   */
  async updateFull(
    id: string,
    data: { name: string; email: string; role: UserRole; actiu: boolean },
  ): Promise<User> {
    const row = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        role: data.role as Role,
        actiu: data.actiu,
      },
    });
    return toDomain(row);
  },

  /**
   * Wipe every Session row for a given user. Used in two places:
   *  1. After admin-creates-user via signUpEmail, to discard the
   *     side-effect Session the signup endpoint produces.
   *  2. When an admin deactivates a user, to kick out any live session
   *     (sessions are DB-backed via the Prisma adapter and there is no
   *     `cookieCache` configured, so deleting the rows invalidates them
   *     on the very next request — equivalent to Better Auth's internal
   *     `deleteUserSessions`).
   */
  async dropAllSessionsFor(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
  },

  // ---------------------------------------------------------------------------
  // Seguretat d'accés (lockout). Aquests mètodes llegeixen/escriuen els camps
  // custom (failedLoginAttempts, lockedUntil, lastLoginAt) que no formen part
  // del tipus de domini `User` ni s'exposen a la UI.
  // ---------------------------------------------------------------------------

  /**
   * Projecció de seguretat per email. Retorna `null` si l'email no existeix
   * (la lògica de login ho tracta com a "credencials invàlides" per no
   * filtrar quins comptes existeixen).
   */
  async findSecurityByEmail(email: string): Promise<UserSecurity | null> {
    const row = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        actiu: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });
    return row;
  },

  /**
   * Incrementa atòmicament el comptador d'intents fallits i retorna el nou
   * valor, perquè el servei decideixi si cal bloquejar.
   */
  async incrementFailedAttempts(userId: string): Promise<number> {
    const row = await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    return row.failedLoginAttempts;
  },

  /** Marca el compte com a bloquejat fins a `until`. */
  async lockAccount(userId: string, until: Date): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: until },
    });
  },

  /**
   * Neteja l'estat de fallits (comptador a 0, sense bloqueig). S'usa quan
   * expira un bloqueig per donar una nova tanda d'intents.
   */
  async clearLoginFailures(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  },

  /**
   * Login correcte: neteja fallits/bloqueig i segella `lastLoginAt`.
   */
  async recordSuccessfulLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
  },
};
