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
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? (err as { status: unknown }).status
        : undefined;

    const isCredentialError =
      status === 401 ||
      status === 400 ||
      status === "UNAUTHORIZED" ||
      status === "BAD_REQUEST";

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
