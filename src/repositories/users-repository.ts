import type { Role, User as PrismaUser } from "@prisma/client";
import type {
  User,
  UserListFilters,
  UserListItem,
  UserRole,
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

  async updateProfile(
    id: string,
    data: { name: string; email: string },
  ): Promise<User> {
    const row = await prisma.user.update({
      where: { id },
      data: { name: data.name, email: data.email },
    });
    return toDomain(row);
  },

  async setRole(id: string, role: UserRole): Promise<User> {
    const row = await prisma.user.update({
      where: { id },
      data: { role: role as Role },
    });
    return toDomain(row);
  },

  async setActiu(id: string, actiu: boolean): Promise<User> {
    const row = await prisma.user.update({
      where: { id },
      data: { actiu },
    });
    return toDomain(row);
  },

  /**
   * Wipe every Session row for a given user. Used in two places:
   *  1. After admin-creates-user via signUpEmail, to discard the
   *     side-effect Session the signup endpoint produces.
   *  2. Potentially in Sprint 3+ when a user is deactivated or their
   *     role is downgraded (not used yet — see plan limitations).
   */
  async dropAllSessionsFor(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
  },
};
