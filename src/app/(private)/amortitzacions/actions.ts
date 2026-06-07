"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { amortitzacionsService } from "@/services/amortitzacions-service";

/**
 * Bound al servidor amb `.bind(null, exercici)` perquè el client no pugui
 * triar un any arbitrari: el botó només pot disparar l'exercici que la
 * pàgina ha calculat com a vàlid.
 */
export async function generarExerciciAction(exercici: number): Promise<void> {
  try {
    await amortitzacionsService.generar(exercici);
  } catch (err) {
    console.error("[generarExerciciAction] error:", err);
    redirect("/amortitzacions?msg=error");
  }
  revalidatePath("/amortitzacions");
  revalidatePath("/inventari");
  redirect(`/amortitzacions?msg=generat&ex=${exercici}`);
}

export async function retrocedirExerciciAction(exercici: number): Promise<void> {
  try {
    await amortitzacionsService.retrocedir(exercici);
  } catch (err) {
    console.error("[retrocedirExerciciAction] error:", err);
    redirect("/amortitzacions?msg=error");
  }
  revalidatePath("/amortitzacions");
  revalidatePath("/inventari");
  redirect("/amortitzacions?msg=retrocedit");
}
