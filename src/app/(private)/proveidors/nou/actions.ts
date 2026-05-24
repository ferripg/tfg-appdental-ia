"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import { proveidorsService } from "@/services/proveidors-service";
import type { ProveidorFormState } from "../_components/proveidor-form";

export async function createProveidorAction(
  _prev: ProveidorFormState,
  formData: FormData,
): Promise<ProveidorFormState> {
  let createdId: string;
  try {
    const created = await proveidorsService.create({
      ...Object.fromEntries(formData),
      actiu: formData.get("actiu") === "on",
    });
    createdId = created.id;
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message, fieldErrors: err.fieldErrors };
    }
    console.error("[createProveidorAction] error inesperat:", err);
    return {
      error: "Error inesperat. Torna-ho a provar més tard.",
    };
  }

  revalidatePath("/proveidors");
  redirect(`/proveidors/${createdId}?msg=creat`);
}
