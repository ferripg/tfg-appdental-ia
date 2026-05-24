"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import { proveidorsService } from "@/services/proveidors-service";
import type { ProveidorFormState } from "../_components/proveidor-form";

/**
 * Bound at the page with `.bind(null, id)` so the form action signature
 * matches `useActionState`'s `(prev, formData) => Promise<state>` contract.
 */
export async function updateProveidorAction(
  id: string,
  _prev: ProveidorFormState,
  formData: FormData,
): Promise<ProveidorFormState> {
  try {
    await proveidorsService.update(id, {
      ...Object.fromEntries(formData),
      actiu: formData.get("actiu") === "on",
    });
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message, fieldErrors: err.fieldErrors };
    }
    console.error("[updateProveidorAction] error inesperat:", err);
    return { error: "Error inesperat. Torna-ho a provar més tard." };
  }

  revalidatePath("/proveidors");
  revalidatePath(`/proveidors/${id}`);
  redirect(`/proveidors/${id}?msg=actualitzat`);
}

export async function setActiuAction(
  id: string,
  actiu: boolean,
): Promise<void> {
  try {
    await proveidorsService.setActiu(id, actiu);
  } catch (err) {
    console.error("[setActiuAction] error inesperat:", err);
    redirect(`/proveidors/${id}?msg=error`);
  }
  revalidatePath("/proveidors");
  revalidatePath(`/proveidors/${id}`);
  redirect(`/proveidors?msg=${actiu ? "reactivat" : "desactivat"}`);
}
