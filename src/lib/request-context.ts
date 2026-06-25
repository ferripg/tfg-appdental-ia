/**
 * Utilitats per llegir dades de la petició HTTP en curs (Server Components,
 * Server Actions i hooks). S'usa sobretot per a l'auditoria: deixar constància
 * de la IP des d'on s'ha fet una acció.
 *
 * L'aplicació corre darrere de Nginx (vegeu nginx/nginx.conf), que afegeix la
 * capçalera `X-Forwarded-For` amb la IP real del client. Quan hi ha una cadena
 * de proxies, `X-Forwarded-For` és "client, proxy1, proxy2…": la primera entrada
 * és la del client original.
 */

import { headers } from "next/headers";

/** Primera IP d'una capçalera `X-Forwarded-For` ("ip1, ip2" → "ip1"). */
export function parseForwardedFor(value: string | null | undefined): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

/**
 * IP del client a partir de les capçaleres de la petició actual.
 *
 * Mai llança: si es crida fora d'un context de petició (o no hi ha cap
 * capçalera de proxy), retorna `null`. Així l'auditoria pot demanar la IP
 * sense por de trencar l'operació principal.
 */
export async function getClientIp(): Promise<string | null> {
  try {
    const h = await headers();
    return parseForwardedFor(h.get("x-forwarded-for")) ?? h.get("x-real-ip");
  } catch {
    return null;
  }
}
