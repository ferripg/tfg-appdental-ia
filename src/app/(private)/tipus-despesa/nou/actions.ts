"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import { tipusDespesaService } from "@/services/tipus-despesa-service";
import type { TipusDespesaFormState } from "../_components/tipus-despesa-form";

export async function createTipusDespesaAction(
  _prev: TipusDespesaFormState,
  formData: FormData,
): Promise<TipusDespesaFormState> {
  let createdId: string;
  try {
    const created = await tipusDespesaService.create({
      ...Object.fromEntries(formData),
      actiu: formData.get("actiu") === "on",
      deduible: formData.get("deduible") === "on",
      esAmortitzable: formData.get("esAmortitzable") === "on",
    });
    createdId = created.id;
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message, fieldErrors: err.fieldErrors };
    }
    console.error("[createTipusDespesaAction] error inesperat:", err);
    return {
      error: "Error inesperat. Torna-ho a provar més tard.",
    };
  }

  revalidatePath("/tipus-despesa");
  redirect(`/tipus-despesa/${createdId}?msg=creat`);
}
