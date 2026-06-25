import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { AccountLockedError } from "@/domain/errors";
import { prisma } from "@/repositories/prisma-client";
import { auditService } from "@/services/audit-service";
import { loginSecurityService } from "@/services/login-security-service";

const SIGN_IN_EMAIL_PATH = "/sign-in/email";

/** Extreu l'email del cos d'una petició de sign-in (pot venir buit). */
function emailFromBody(body: unknown): string | null {
  if (body && typeof body === "object" && "email" in body) {
    const email = (body as { email?: unknown }).email;
    if (typeof email === "string") return email;
  }
  return null;
}

/**
 * IP del client a partir de les capçaleres del hook. Darrere de Nginx,
 * `X-Forwarded-For` porta "client, proxy…": agafem la primera entrada. Es fa
 * inline (i no via `request-context`) per no acoblar `lib/auth` a
 * `next/headers`: aquí ja tenim l'objecte de capçaleres del context.
 */
function ipFromHeaders(headers: Headers | undefined): string | null {
  const xff = headers?.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  return headers?.get("x-real-ip") ?? null;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: ["http://localhost", "http://localhost:3000"],
  // Expose the `role` column from the Prisma `user` table to `session.user`
  // so RBAC gates (requireAdmin) can read `session.user.role`. Without this
  // additionalFields declaration, Better Auth omits role from the inferred
  // session shape and every check would compare `undefined !== "ADMIN"`.
  // `input: false` blocks clients from setting role via signUpEmail — only
  // the admin-controlled write path in usersService can change it.
  user: {
    additionalFields: {
      role: { type: "string", input: false },
    },
  },
  // Seguretat d'accés (UC login hardening). Better Auth no tracta de sèrie
  // ni el flag `actiu` ni el lockout per força bruta, així que ho cablegem
  // amb hooks de petició al voltant de l'endpoint `/sign-in/email`. La regla
  // de negoci viu a `loginSecurityService`; aquí només hi ha l'adaptació al
  // contracte de Better Auth (llegir el body, traduir excepcions a APIError).
  hooks: {
    // ABANS de verificar la contrasenya: rebutja comptes desactivats o
    // bloquejats. Així ni amb les credencials correctes es crea sessió.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== SIGN_IN_EMAIL_PATH) return;
      const email = emailFromBody(ctx.body);
      if (!email) return;

      try {
        await loginSecurityService.assertCanAttemptLogin(email);
      } catch (err) {
        // Compte desactivat o bloquejat: 403 + missatge concret que el
        // loginAction mostrarà tal qual. El header Retry-After ajuda clients
        // programàtics (i documenta la intenció) en el cas de bloqueig.
        if (err instanceof AccountLockedError) {
          // El tercer argument d'APIError són les capçaleres de resposta;
          // Retry-After (en segons) documenta quan es pot reintentar.
          throw new APIError(
            "FORBIDDEN",
            { message: err.message, code: "ACCOUNT_LOCKED" },
            { "Retry-After": String(err.retryAfterMinutes * 60) },
          );
        }
        throw new APIError("FORBIDDEN", {
          message: (err as Error).message,
          code: "ACCOUNT_DISABLED",
        });
      }
    }),
    // DESPRÉS de processar el sign-in: si hi ha sessió nova → login correcte
    // (neteja fallits + lastLoginAt); si no → intent fallit (incrementa i,
    // arribat al llindar, bloqueja). El comptatge passa NOMÉS aquí, mai al
    // `before`, de manera que cada intent real compta exactament un cop.
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== SIGN_IN_EMAIL_PATH) return;

      const ip = ipFromHeaders(ctx.headers);
      const newSession = ctx.context.newSession;
      if (newSession) {
        await loginSecurityService.registerSuccessfulLogin(
          newSession.user.id,
        );
        // Auditoria: inici de sessió correcte. `record` mai llança.
        await auditService.record(newSession.user.id, "LOGIN_OK", { ip });
        return;
      }

      const email = emailFromBody(ctx.body);
      if (email) {
        await loginSecurityService.registerFailedLogin(email);
        // Auditoria: intent fallit. No en sabem l'usuari (userId null);
        // desem l'email provat a `metadata` per poder-hi fer seguiment.
        await auditService.record(null, "LOGIN_FAIL", {
          ip,
          metadata: { email },
        });
      }
    }),
  },
  // nextCookies() must be the LAST plugin: it wraps every response and
  // forwards Set-Cookie headers through next/headers cookies(), which is
  // required for sign-in/sign-up/sign-out called from Server Actions to
  // actually persist the session cookie in the browser.
  plugins: [nextCookies()],
});
