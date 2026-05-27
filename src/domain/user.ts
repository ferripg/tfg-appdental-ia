import { z } from "zod";

export const USER_ROLES = ["ADMIN", "MANAGER", "OPERARI"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const roleSchema = z.enum(USER_ROLES, { error: "Rol no vàlid" });

const emailSchema = z
  .string()
  .trim()
  .min(1, { error: "L'email és obligatori" })
  .max(255, { error: "Màxim 255 caràcters" })
  .toLowerCase()
  .pipe(z.email({ error: "Email no vàlid" }));

const nameSchema = z
  .string()
  .trim()
  .min(1, { error: "El nom és obligatori" })
  .max(120, { error: "Màxim 120 caràcters" });

/**
 * Password policy: 8+ characters, at least one uppercase letter, at least
 * one digit. Per UC-1; enforced only when an admin sets a password (create).
 * Password reset (UC-8) is out of MVP scope, so updates don't touch it.
 */
const passwordSchema = z
  .string()
  .min(8, { error: "Mínim 8 caràcters" })
  .max(128, { error: "Màxim 128 caràcters" })
  .refine((v) => /[A-Z]/.test(v), {
    error: "Cal almenys una majúscula",
  })
  .refine((v) => /[0-9]/.test(v), {
    error: "Cal almenys un dígit",
  });

/**
 * Schema for admin-created users. `mustChangePassword` is forced to `true`
 * server-side (UC-5); the form doesn't expose it.
 */
export const userCreateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: roleSchema,
  password: passwordSchema,
  actiu: z.boolean(),
});

/**
 * Schema for admin-edited profile data. Password is NOT here (reset is
 * UC-8, out of scope). Role and `actiu` move through dedicated endpoints
 * to keep their business rules (self-edit, last-admin) isolated.
 */
export const userUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
});

export type UserCreateInput = z.output<typeof userCreateSchema>;
export type UserUpdateInput = z.output<typeof userUpdateSchema>;

/** Domain entity exposed to services/UI. Mirrors the relevant Prisma fields. */
export type User = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  actiu: boolean;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Listing rows currently match the User shape; kept as a separate alias so
 *  future `_count` joins can extend it without breaking callers. */
export type UserListItem = User;

/** List filters parsed from search params. */
export type UserListFilters = {
  search?: string;
  role?: UserRole;
  includeInactius?: boolean;
};
