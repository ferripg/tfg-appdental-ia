"use server";

import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import { usersService } from "@/services/users-service";
import type { CanviContrasenyaState } from "./_components/canvi-contrasenya-form";

export async function canviarContrasenyaAction(
  _prev: CanviContrasenyaState,
  formData: FormData,
): Promise<CanviContrasenyaState> {
  try {
    await usersService.changeOwnPassword({
      actual: String(formData.get("actual") ?? ""),
      nova: String(formData.get("nova") ?? ""),
      confirmar: String(formData.get("confirmar") ?? ""),
    });
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message, fieldErrors: err.fieldErrors };
    }
    console.error("[canviarContrasenyaAction] error inesperat:", err);
    return { error: "Error inesperat. Torna-ho a provar més tard." };
  }

  // En èxit, mustChangePassword ja és false → el proxy deixa passar el tauler.
  redirect("/dashboard");
}
