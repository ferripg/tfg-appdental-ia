"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import { despesesService } from "@/services/despeses-service";
import type { DespesaFormState } from "../_components/despesa-form";

/**
 * Bound at the page with `.bind(null, id)` so the form action signature
 * matches `useActionState`'s `(prev, formData) => Promise<state>` contract.
 */
export async function updateDespesaAction(
  id: string,
  _prev: DespesaFormState,
  formData: FormData,
): Promise<DespesaFormState> {
  try {
    await despesesService.update(id, Object.fromEntries(formData));
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message, fieldErrors: err.fieldErrors };
    }
    console.error("[updateDespesaAction] error inesperat:", err);
    return { error: "Error inesperat. Torna-ho a provar més tard." };
  }

  revalidatePath("/despeses");
  revalidatePath(`/despeses/${id}`);
  redirect(`/despeses?msg=actualitzat`);
}

export async function deleteDespesaAction(id: string): Promise<void> {
  try {
    await despesesService.delete(id);
  } catch (err) {
    if (err instanceof DomainError) {
      // El BusinessError d'inventari associat es propaga via search params.
      redirect(`/despeses/${id}?msg=error-fk`);
    }
    console.error("[deleteDespesaAction] error inesperat:", err);
    redirect(`/despeses/${id}?msg=error`);
  }
  revalidatePath("/despeses");
  redirect(`/despeses?msg=eliminat`);
}
