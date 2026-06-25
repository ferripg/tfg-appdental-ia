"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import { usersService } from "@/services/users-service";
import type { UsuariFormState } from "../_components/usuari-form";

/**
 * Edició unificada d'un usuari (nom, email, rol i estat) des d'un sol
 * formulari. Bound a la pàgina amb `.bind(null, id)` per encaixar amb el
 * contracte `(prev, formData) => Promise<state>` de `useActionState`.
 *
 * El rol arriba com a string del <select> (absent si el control està
 * desactivat per auto-edició). L'estat es marca amb un camp ocult
 * `__actiuPresent`: si hi és, l'`actiu` ve del checkbox; si no (auto-edició),
 * s'envia `undefined` i el servei manté el valor actual.
 */
export async function updateUsuariAction(
  id: string,
  _prev: UsuariFormState,
  formData: FormData,
): Promise<UsuariFormState> {
  try {
    await usersService.update(id, {
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role") || undefined,
      actiu: formData.has("__actiuPresent")
        ? formData.get("actiu") === "on"
        : undefined,
    });
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message, fieldErrors: err.fieldErrors };
    }
    console.error("[updateUsuariAction] error inesperat:", err);
    return { error: "Error inesperat. Torna-ho a provar més tard." };
  }

  revalidatePath("/usuaris");
  revalidatePath(`/usuaris/${id}`);
  redirect("/usuaris?msg=actualitzat");
}
