"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { auditService } from "@/services/audit-service";

export async function logoutAction() {
  // Llegim la sessió ABANS de tancar-la per saber qui fa el logout.
  const session = await auth.api.getSession({ headers: await headers() });
  await auth.api.signOut({ headers: await headers() });
  if (session) {
    // Auditoria: tancament de sessió (la IP la resol `record` de les
    // capçaleres). `record` mai llança, així que no bloqueja el logout.
    await auditService.record(session.user.id, "LOGOUT");
  }
  redirect("/login");
}
