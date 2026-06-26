/**
 * Domini de l'informe "Despeses per proveïdor" (IA-21) — pur, sense Prisma.
 *
 * Agrupa les despeses d'un període per proveïdor, amb el detall de cada
 * despesa, el subtotal per proveïdor i el total general. Els imports se sumen
 * de manera EXACTA (cèntims/bigint via `sumaImports`), mai amb floats, perquè
 * els subtotals i el total quadrin sempre. Les despeses sense proveïdor es
 * recullen en un grup propi "(Sense proveïdor)" perquè el total inclogui-les
 * i quadri amb la suma de totes les despeses del període.
 */

import { sumaImports } from "./amortitzacio";
import type { DespesaWithRelations } from "./despesa";

/** Una línia de detall de l'informe (una despesa). */
export type InformeLinia = {
  id: string;
  numFactura: string | null;
  dataFactura: Date;
  descripcio: string;
  tipusCodi: string;
  tipusDescripcio: string;
  import: string;
};

/** Grup d'un proveïdor amb les seves línies i el subtotal. */
export type InformeGrupProveidor = {
  proveidorId: string | null;
  proveidorNom: string;
  proveidorNif: string | null;
  linies: InformeLinia[];
  subtotal: string;
};

/** Resultat complet de l'informe per a un període. */
export type InformeProveidors = {
  grups: InformeGrupProveidor[];
  totalGeneral: string;
  numDespeses: number;
};

const SENSE_PROVEIDOR = "__sense__";

/**
 * Agrupa una llista de despeses (ja filtrades pel període) per proveïdor.
 * Ordena: grups per nom de proveïdor (el grup "sense proveïdor" al final);
 * línies per data de factura ascendent dins de cada grup.
 */
export function agruparPerProveidor(
  despeses: DespesaWithRelations[],
): InformeProveidors {
  const mapa = new Map<string, InformeGrupProveidor>();

  for (const d of despeses) {
    const clau = d.proveidor?.id ?? SENSE_PROVEIDOR;
    let grup = mapa.get(clau);
    if (!grup) {
      grup = {
        proveidorId: d.proveidor?.id ?? null,
        proveidorNom: d.proveidor?.nom ?? "(Sense proveïdor)",
        proveidorNif: d.proveidor?.nif ?? null,
        linies: [],
        subtotal: "0.00",
      };
      mapa.set(clau, grup);
    }
    grup.linies.push({
      id: d.id,
      numFactura: d.numFactura,
      dataFactura: d.dataFactura,
      descripcio: d.descripcio,
      tipusCodi: d.tipusDespesa.codi,
      tipusDescripcio: d.tipusDespesa.descripcio,
      import: d.import,
    });
    grup.subtotal = sumaImports(grup.subtotal, d.import);
  }

  for (const grup of mapa.values()) {
    grup.linies.sort(
      (a, b) => a.dataFactura.getTime() - b.dataFactura.getTime(),
    );
  }

  const grups = [...mapa.values()].sort((a, b) => {
    if (a.proveidorId === null) return 1; // "sense proveïdor" sempre al final
    if (b.proveidorId === null) return -1;
    return a.proveidorNom.localeCompare(b.proveidorNom, "ca");
  });

  const totalGeneral = grups.reduce(
    (acc, g) => sumaImports(acc, g.subtotal),
    "0.00",
  );

  return { grups, totalGeneral, numDespeses: despeses.length };
}
