"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import { usersService } from "@/services/users-service";
import type { UsuariFormState } from "../_components/usuari-form";

export async function createUsuariAction(
  _prev: UsuariFormState,
  formData: FormData,
): Promise<UsuariFormState> {
  try {
    await usersService.create({
      ...Object.fromEntries(formData),
      actiu: formData.get("actiu") === "on",
    });
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message, fieldErrors: err.fieldErrors };
    }
    console.error("[createUsuariAction] error inesperat:", err);
    return { error: "Error inesperat. Torna-ho a provar més tard." };
  }

  revalidatePath("/usuaris");
  redirect("/usuaris?msg=creat");
}
