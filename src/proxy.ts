import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Routes that require an authenticated session. Add new private prefixes
// here as new modules ship. With 5 prefixes now, the next CRUD should
// trigger the refactor to a catch-all matcher that excludes public assets
// and the /api/auth route. RBAC (admin-only on /usuaris) is enforced in
// the service layer via requireAdmin(), not here.
/** Pantalla de canvi de contrasenya: privada però EXCLOSA del force-flow
 *  (és el destí de la redirecció, no es pot redirigir a si mateixa). */
const CANVI_CONTRASENYA = "/canvi-contrasenya";

const PRIVATE_PREFIXES = [
  "/dashboard",
  "/proveidors",
  "/tipus-despesa",
  "/despeses",
  "/usuaris",
  "/auditoria",
  "/informes",
  CANVI_CONTRASENYA,
];

function isPrivate(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { pathname } = request.nextUrl;

  // Force-flow del primer accés (IA-20): si l'usuari ha de canviar la
  // contrasenya, el portem a la pantalla de canvi des de QUALSEVOL ruta
  // excepte la mateixa pantalla (això evita el bucle de redirecció).
  const mustChangePassword =
    !!session &&
    (session.user as { mustChangePassword?: boolean }).mustChangePassword ===
      true;
  if (mustChangePassword && pathname !== CANVI_CONTRASENYA) {
    return NextResponse.redirect(new URL(CANVI_CONTRASENYA, request.url));
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (!session && isPrivate(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/proveidors/:path*",
    "/tipus-despesa/:path*",
    "/despeses/:path*",
    "/usuaris/:path*",
    "/auditoria/:path*",
    "/informes/:path*",
    "/canvi-contrasenya/:path*",
  ],
};
