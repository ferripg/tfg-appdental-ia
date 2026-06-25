/**
 * Permisos per rol (RBAC) — funcions PURES, sense dependències.
 *
 * Són la font de veritat de "qui pot fer què" i les usen TANT la UI (per
 * amagar/mostrar accions) COM el servidor (els gates de `auth-service` les
 * repliquen). Mantenir-les pures i en un sol lloc evita que la interfície i
 * el servidor divergeixin: la UI no ofereix accions que el servidor rebutjaria.
 *
 * Matriu de rols (vegeu IA-18):
 * - OPERARI: consulta-ho tot + crea despeses. NO edita/elimina catàlegs ni la
 *   resta del domini. No accedeix a usuaris.
 * - MANAGER: CRUD complet del domini (proveïdors, tipus, despeses, inventari,
 *   amortitzacions). No gestiona usuaris.
 * - ADMIN: tot, inclosa la gestió d'usuaris.
 */

export const ROLS = ["ADMIN", "MANAGER", "OPERARI"] as const;
export type Rol = (typeof ROLS)[number];

/**
 * Pot crear/editar/eliminar el domini: proveïdors, tipus de despesa, inventari,
 * amortitzacions i l'edició/eliminació de despeses. Reservat a MANAGER i ADMIN.
 */
export function potGestionarDomini(rol: string | null | undefined): boolean {
  return rol === "ADMIN" || rol === "MANAGER";
}

/** Pot gestionar usuaris (alta, rol, activació). Només ADMIN. */
export function potGestionarUsuaris(rol: string | null | undefined): boolean {
  return rol === "ADMIN";
}

/** Pot registrar (crear) despeses. Tots els rols autenticats, OPERARI inclòs. */
export function potCrearDespesa(rol: string | null | undefined): boolean {
  return rol === "ADMIN" || rol === "MANAGER" || rol === "OPERARI";
}
