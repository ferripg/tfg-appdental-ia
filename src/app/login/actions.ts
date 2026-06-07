"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type LoginState = { error: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch (err) {
    // Better Auth llança un APIError amb status HTTP per a errors de
    // credencials (401) o de validació (4xx). Qualsevol altra excepció
    // és un error tècnic (p.ex. BD inaccessible) que no s'ha de mostrar
    // com a "credencials invàlides" perquè enganya l'usuari.
    const e = err as {
      status?: unknown;
      statusCode?: unknown;
      body?: { message?: string };
    };
    const status = e?.status;
    const statusCode = e?.statusCode;

    // Bloqueig propi (compte desactivat o bloquejat per intents fallits):
    // els hooks de seguretat retornen 403 amb un missatge ja redactat en
    // català, que mostrem tal qual perquè l'usuari sàpiga què passa.
    const isBlocked = status === "FORBIDDEN" || statusCode === 403;
    if (isBlocked && e.body?.message) {
      return { error: e.body.message };
    }

    const isCredentialError =
      status === 401 ||
      status === 400 ||
      status === "UNAUTHORIZED" ||
      status === "BAD_REQUEST" ||
      statusCode === 401 ||
      statusCode === 400;

    if (isCredentialError) {
      return { error: "Credencials invàlides" };
    }

    console.error("[loginAction] error inesperat:", err);
    return {
      error: "El servei no està disponible ara mateix. Torna-ho a provar.",
    };
  }

  redirect("/dashboard");
}
