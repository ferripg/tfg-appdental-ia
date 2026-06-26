/**
 * Domini del tauler (IA-13) — agregació pura de despeses per al dashboard.
 *
 * Sense Prisma. Tots els imports se sumen de manera EXACTA en cèntims
 * (`sumaImports`), mai amb floats, perquè el total anual i els desglossaments
 * quadrin. L'ordenació (top proveïdors, per tipus) compara els imports en
 * cèntims sencers; el `number` només s'usa per ordenar, no per acumular.
 */

import { sumaImports } from "./amortitzacio";
import type { DespesaWithRelations } from "./despesa";

export type ResumProveidor = {
  proveidorId: string;
  nom: string;
  nif: string;
  total: string;
};

export type ResumTipus = {
  codi: string;
  descripcio: string;
  total: string;
};

/** Total d'un mes (1 = gener … 12 = desembre). Sempre hi ha les 12 entrades. */
export type ResumMes = {
  mes: number;
  total: string;
};

export type ResumDashboard = {
  total: string;
  numDespeses: number;
  topProveidors: ResumProveidor[];
  perTipus: ResumTipus[];
  perMes: ResumMes[];
};

/** Nombre màxim de proveïdors al rànquing "top proveïdors". */
const MAX_TOP_PROVEIDORS = 5;

/** Cèntims sencers d'un import "X.XX" — només per ordenar (no per acumular). */
function centims(value: string): number {
  return Math.round(Number(value) * 100);
}

/**
 * Calcula els indicadors del tauler a partir de les despeses d'un període
 * (normalment l'any en curs): total, top proveïdors per import, desglossament
 * per tipus i evolució mensual (12 mesos, 0,00 als mesos sense despeses).
 */
export function calcularResumDespeses(
  despeses: DespesaWithRelations[],
): ResumDashboard {
  let total = "0.00";
  const perProveidor = new Map<string, ResumProveidor>();
  const perTipusMap = new Map<string, ResumTipus>();
  const mesos = Array.from({ length: 12 }, () => "0.00");

  for (const d of despeses) {
    total = sumaImports(total, d.import);

    const mes = d.dataFactura.getUTCMonth(); // 0-11
    mesos[mes] = sumaImports(mesos[mes], d.import);

    const tipus = perTipusMap.get(d.tipusDespesa.codi);
    if (tipus) {
      tipus.total = sumaImports(tipus.total, d.import);
    } else {
      perTipusMap.set(d.tipusDespesa.codi, {
        codi: d.tipusDespesa.codi,
        descripcio: d.tipusDespesa.descripcio,
        total: d.import,
      });
    }

    // El top proveïdors només compta despeses amb proveïdor assignat.
    if (d.proveidor) {
      const prov = perProveidor.get(d.proveidor.id);
      if (prov) {
        prov.total = sumaImports(prov.total, d.import);
      } else {
        perProveidor.set(d.proveidor.id, {
          proveidorId: d.proveidor.id,
          nom: d.proveidor.nom,
          nif: d.proveidor.nif,
          total: d.import,
        });
      }
    }
  }

  const topProveidors = [...perProveidor.values()]
    .sort((a, b) => centims(b.total) - centims(a.total))
    .slice(0, MAX_TOP_PROVEIDORS);

  const perTipus = [...perTipusMap.values()].sort(
    (a, b) => centims(b.total) - centims(a.total),
  );

  const perMes = mesos.map((t, i) => ({ mes: i + 1, total: t }));

  return {
    total,
    numDespeses: despeses.length,
    topProveidors,
    perTipus,
    perMes,
  };
}
