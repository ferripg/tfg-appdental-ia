import { AccountDisabledError, AccountLockedError } from "@/domain/errors";
import {
  LOCKOUT_DURATION_MINUTES,
  MAX_FAILED_LOGIN_ATTEMPTS,
} from "@/domain/login-security";
import { usersRepository } from "@/repositories/users-repository";

/**
 * Lògica de seguretat d'accés (lockout + comptes desactivats).
 *
 * Viu en un servei SEPARAT a propòsit: el cablegen els hooks de Better Auth
 * a `src/lib/auth.ts`, i si aquesta lògica visqués a `auth-service` o
 * `users-service` —que importen `@/lib/auth`— es crearia un import circular
 * (auth.ts → service → auth.ts). Aquí només depenem del repositori i del
 * domini, mai de `lib/auth`.
 *
 * Els hooks tradueixen les excepcions de domini que llança aquest servei a
 * `APIError` de Better Auth (veure `auth.ts`).
 */

/** Normalitza l'email igual que el guardem (els schemes el desen en minúscules). */
function normalize(email: string): string {
  return email.trim().toLowerCase();
}

export const loginSecurityService = {
  /**
   * Porta del `before` hook de `/sign-in/email`. S'executa ABANS de verificar
   * la contrasenya, de manera que un compte desactivat o bloquejat no arriba
   * mai a generar sessió encara que les credencials siguin correctes.
   *
   * - Email desconegut → no fa res (que Better Auth respongui "credencials
   *   invàlides"; així no revelem quins comptes existeixen).
   * - Compte desactivat → `AccountDisabledError`.
   * - Compte bloquejat i el bloqueig encara vigent → `AccountLockedError`.
   * - Bloqueig caducat → es neteja l'estat (nova tanda d'intents) i es permet.
   */
  async assertCanAttemptLogin(email: string): Promise<void> {
    const user = await usersRepository.findSecurityByEmail(normalize(email));
    if (!user) return;

    if (!user.actiu) {
      throw new AccountDisabledError(
        "El teu compte està desactivat. Contacta amb l'administrador.",
      );
    }

    if (user.lockedUntil) {
      const now = new Date();
      if (user.lockedUntil > now) {
        const retryAfterMinutes = Math.max(
          1,
          Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60_000),
        );
        throw new AccountLockedError(
          `Compte bloquejat temporalment per massa intents fallits. Torna-ho a provar d'aquí a ${retryAfterMinutes} min.`,
          retryAfterMinutes,
        );
      }
      // El bloqueig ha caducat: reinicia el comptador per donar una tanda neta.
      await usersRepository.clearLoginFailures(user.id);
    }
  },

  /**
   * Porta del `after` hook quan el login ha FALLAT (credencials incorrectes).
   * Incrementa el comptador i, en arribar al llindar, bloqueja el compte
   * `LOCKOUT_DURATION_MINUTES` minuts.
   *
   * Es protegeix contra recomptes espuris: si el compte està desactivat o ja
   * bloquejat, no toca res (el `before` ja l'haurà rebutjat; això cobreix
   * qualsevol ordre d'execució dels hooks).
   */
  async registerFailedLogin(email: string): Promise<void> {
    const user = await usersRepository.findSecurityByEmail(normalize(email));
    if (!user || !user.actiu) return;
    if (user.lockedUntil && user.lockedUntil > new Date()) return;

    const attempts = await usersRepository.incrementFailedAttempts(user.id);
    if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      const until = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60_000);
      await usersRepository.lockAccount(user.id, until);
    }
  },

  /**
   * Porta del `after` hook quan el login ha estat CORRECTE: neteja fallits i
   * bloqueig i segella `lastLoginAt`.
   */
  async registerSuccessfulLogin(userId: string): Promise<void> {
    await usersRepository.recordSuccessfulLogin(userId);
  },
};
