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
 * Schema for admin-edited users (IA-18). Password is NOT here (reset is
 * UC-8, out of scope). `role` and `actiu` són OPCIONALS: en editar-se un
 * mateix, els controls de rol/estat queden desactivats i no s'envien, de
 * manera que el servei manté els valors actuals. Les regles de negoci
 * (no canviar el propi rol, no deixar el sistema sense administrador actiu)
 * es validen al servei `usersService.update`.
 */
export const userUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: roleSchema.optional(),
  actiu: z.boolean().optional(),
});

/**
 * Schema del canvi de contrasenya propi (IA-20). `nova` segueix la mateixa
 * política que en crear un usuari (mín. 8, una majúscula, un dígit) i
 * `confirmar` ha de coincidir amb `nova`. La contrasenya ACTUAL la verifica
 * Better Auth (changePassword), no aquest schema.
 */
export const changePasswordSchema = z
  .object({
    actual: z.string().min(1, { error: "Introdueix la contrasenya actual" }),
    nova: passwordSchema,
    confirmar: z.string().min(1, { error: "Confirma la nova contrasenya" }),
  })
  .refine((d) => d.nova === d.confirmar, {
    error: "Les contrasenyes no coincideixen",
    path: ["confirmar"],
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

/**
 * Projecció mínima dels camps de seguretat d'accés. No s'exposa a la UI
 * (no surt a `User`): només la consumeix la lògica de lockout del login.
 */
export type UserSecurity = {
  id: string;
  actiu: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};

/** List filters parsed from search params. */
export type UserListFilters = {
  search?: string;
  role?: UserRole;
  includeInactius?: boolean;
};
