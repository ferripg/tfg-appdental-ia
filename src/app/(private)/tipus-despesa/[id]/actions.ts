"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import { tipusDespesaService } from "@/services/tipus-despesa-service";
import type { TipusDespesaFormState } from "../_components/tipus-despesa-form";

/**
 * Bound at the page with `.bind(null, id)` so the form action signature
 * matches `useActionState`'s `(prev, formData) => Promise<state>` contract.
 */
export async function updateTipusDespesaAction(
  id: string,
  _prev: TipusDespesaFormState,
  formData: FormData,
): Promise<TipusDespesaFormState> {
  try {
    await tipusDespesaService.update(id, {
      ...Object.fromEntries(formData),
      actiu: formData.get("actiu") === "on",
      deduible: formData.get("deduible") === "on",
      esAmortitzable: formData.get("esAmortitzable") === "on",
    });
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message, fieldErrors: err.fieldErrors };
    }
    console.error("[updateTipusDespesaAction] error inesperat:", err);
    return { error: "Error inesperat. Torna-ho a provar més tard." };
  }

  revalidatePath("/tipus-despesa");
  revalidatePath(`/tipus-despesa/${id}`);
  redirect(`/tipus-despesa/${id}?msg=actualitzat`);
}

export async function setActiuAction(
  id: string,
  actiu: boolean,
): Promise<void> {
  try {
    await tipusDespesaService.setActiu(id, actiu);
  } catch (err) {
    console.error("[setActiuAction] error inesperat:", err);
    redirect(`/tipus-despesa/${id}?msg=error`);
  }
  revalidatePath("/tipus-despesa");
  revalidatePath(`/tipus-despesa/${id}`);
  redirect(`/tipus-despesa?msg=${actiu ? "reactivat" : "desactivat"}`);
}
