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
    // El fitxer se separa de la resta de camps: el schema de la despesa no
    // l'ha de veure, i el servei el valida i el puja a MinIO a part.
    const factura = formData.get("factura");
    formData.delete("factura");
    const created = await despesesService.createAmbFactura(
      Object.fromEntries(formData),
      factura,
    );
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
