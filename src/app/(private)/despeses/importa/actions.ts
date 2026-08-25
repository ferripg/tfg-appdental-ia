"use server";

import { revalidatePath } from "next/cache";
import { DomainError } from "@/domain/errors";
import type {
  ImportacioConfirmResum,
  ImportacioRow,
} from "@/domain/importacio";
import { importacioService } from "@/services/importacio-service";

/**
 * Actions de la importació de factures amb IA (IA-23).
 *
 * `extreuFacturaAction` es crida UNA VEGADA PER PDF des de la cua del client
 * (concurrència limitada allà): així la taula de revisió s'omple
 * incrementalment i un fitxer problemàtic només afecta la seva fila.
 */

export async function extreuFacturaAction(
  formData: FormData,
): Promise<ImportacioRow> {
  const file = formData.get("file");
  const nomFitxer =
    (file instanceof File && file.name) ||
    (formData.get("nom") as string | null) ||
    "fitxer.pdf";

  try {
    return await importacioService.extreuFactura(file, nomFitxer);
  } catch (err) {
    // El servei ja converteix els errors previsibles en files d'error; aquí
    // només cauen sessió caducada / permisos / imprevistos.
    const missatge =
      err instanceof DomainError ? err.message : "Error inesperat al servidor";
    if (!(err instanceof DomainError)) {
      console.error("[extreuFacturaAction] error inesperat:", err);
    }
    return { estat: "error", fitxerKey: null, nomFitxer, error: missatge };
  }
}

export async function confirmaImportacioAction(
  rows: unknown,
): Promise<{ resum?: ImportacioConfirmResum; error?: string }> {
  try {
    const resum = await importacioService.confirma(rows);
    // La confirmació pot haver creat despeses, proveïdors, tipus i béns.
    revalidatePath("/despeses");
    revalidatePath("/proveidors");
    revalidatePath("/tipus-despesa");
    revalidatePath("/inventari");
    revalidatePath("/dashboard");
    return { resum };
  } catch (err) {
    if (err instanceof DomainError) {
      // La ValidationError del servei porta el detall agrupat per índex de
      // fila ("0" → ["NIF no vàlid"]). El traduïm a nom de fitxer perquè el
      // toast digui exactament quina fila i quin motiu, no un genèric.
      let error = err.message;
      if (err.fieldErrors && Array.isArray(rows)) {
        const detalls = Object.entries(err.fieldErrors)
          .slice(0, 5)
          .map(([clau, motius]) => {
            const fila = rows[Number(clau)] as { nomFitxer?: string } | undefined;
            const nom = fila?.nomFitxer ?? `fila ${clau}`;
            return `${nom}: ${motius.join(", ")}`;
          });
        if (detalls.length) error = `${err.message} — ${detalls.join(" · ")}`;
      }
      return { error };
    }
    console.error("[confirmaImportacioAction] error inesperat:", err);
    return { error: "Error inesperat. Torna-ho a provar més tard." };
  }
}

export async function descartaImportacioAction(
  fitxerKeys: string[],
): Promise<void> {
  try {
    await importacioService.descarta(fitxerKeys);
  } catch (err) {
    // Neteja best-effort: un staging orfe no ha de molestar l'usuari.
    console.error("[descartaImportacioAction] error inesperat:", err);
  }
}
