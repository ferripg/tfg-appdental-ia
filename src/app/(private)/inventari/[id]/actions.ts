"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import { inventariService } from "@/services/inventari-service";
import type { InventariFormState } from "../_components/inventari-form";

/**
 * Bound al detall amb `.bind(null, id)` perquè la signatura encaixi amb el
 * contracte `(prev, formData) => Promise<state>` de `useActionState`.
 */
export async function updateInventariAction(
  id: string,
  _prev: InventariFormState,
  formData: FormData,
): Promise<InventariFormState> {
  try {
    await inventariService.update(id, Object.fromEntries(formData));
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message, fieldErrors: err.fieldErrors };
    }
    console.error("[updateInventariAction] error inesperat:", err);
    return { error: "Error inesperat. Torna-ho a provar més tard." };
  }

  revalidatePath("/inventari");
  revalidatePath(`/inventari/${id}`);
  redirect("/inventari?msg=actualitzat");
}

export async function baixaInventariAction(id: string): Promise<void> {
  try {
    await inventariService.baixa(id);
  } catch (err) {
    console.error("[baixaInventariAction] error:", err);
    redirect(`/inventari/${id}?msg=error`);
  }
  revalidatePath("/inventari");
  revalidatePath(`/inventari/${id}`);
  redirect(`/inventari/${id}?msg=baixa`);
}

export async function reactivarInventariAction(id: string): Promise<void> {
  try {
    await inventariService.reactivar(id);
  } catch (err) {
    console.error("[reactivarInventariAction] error:", err);
    redirect(`/inventari/${id}?msg=error`);
  }
  revalidatePath("/inventari");
  revalidatePath(`/inventari/${id}`);
  redirect(`/inventari/${id}?msg=reactivat`);
}

export async function eliminarInventariAction(id: string): Promise<void> {
  try {
    await inventariService.eliminar(id);
  } catch (err) {
    if (err instanceof DomainError) {
      // Bé amb amortitzacions: no es pot eliminar; ho mostrem al detall.
      redirect(`/inventari/${id}?msg=error`);
    }
    console.error("[eliminarInventariAction] error inesperat:", err);
    redirect(`/inventari/${id}?msg=error`);
  }
  revalidatePath("/inventari");
  redirect("/inventari?msg=eliminat");
}
