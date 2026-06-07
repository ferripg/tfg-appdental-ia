/**
 * Política de seguretat d'accés (lockout per força bruta).
 *
 * Aquests valors són regla de negoci, no detall d'infraestructura, per això
 * viuen al domini i no als serveis ni a la config de Better Auth. El servei
 * `login-security-service` els consumeix; canviar la política és canviar
 * aquí (un sol lloc).
 */

/** Intents fallits seguits permesos abans de bloquejar el compte. */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

/** Durada del bloqueig temporal, en minuts, un cop superat el llindar. */
export const LOCKOUT_DURATION_MINUTES = 15;
