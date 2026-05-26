"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import { despesesService } from "@/services/despeses-service";
import type { DespesaFormState } from "../_components/despesa-form";

export async function createDespesaAction(
  _prev: DespesaFormState,
  formData: FormData,
): Promise<DespesaFormState> {
  let createdId: string;
  try {
    const created = await despesesService.create(Object.fromEntries(formData));
    createdId = created.id;
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message, fieldErrors: err.fieldErrors };
    }
    console.error("[createDespesaAction] error inesperat:", err);
    return { error: "Error inesperat. Torna-ho a provar més tard." };
  }

  revalidatePath("/despeses");
  redirect(`/despeses/${createdId}?msg=creat`);
}
