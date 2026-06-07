import { z } from "zod";

/** Estats d'un bé d'inventari. */
export const ESTATS_INVENTARI = ["ACTIU", "BAIXA", "ELIMINAT"] as const;
export type EstatInventari = (typeof ESTATS_INVENTARI)[number];

/** Coerce buit/undefined → null per a camps de text opcionals. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null));

/** Data obligatòria des d'un <input type="date"> (YYYY-MM-DD → Date UTC). */
const dateRequired = z
  .string()
  .min(1, { error: "La data és obligatòria" })
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), {
    error: "Format de data invàlid",
  })
  .transform((v) => new Date(`${v}T00:00:00Z`));

/** Import > 0 amb 2 decimals, conservat com a string (precisió Decimal). */
const importPositive = z
  .string()
  .min(1, { error: "L'import és obligatori" })
  .transform((v) => v.trim().replace(",", "."))
  .pipe(
    z.string().regex(/^\d+(\.\d{1,2})?$/, {
      error: "Format invàlid (ex: 123.45)",
    }),
  )
  .refine((v) => Number(v) > 0, {
    error: "L'import ha de ser superior a 0",
  });

/** Percentatge 0–100 amb fins a 2 decimals, conservat com a string. */
const percentatge = z
  .string()
  .min(1, { error: "El percentatge és obligatori" })
  .transform((v) => v.trim().replace(",", "."))
  .pipe(
    z.string().regex(/^\d{1,3}(\.\d{1,2})?$/, {
      error: "Format invàlid (ex: 12.5)",
    }),
  )
  .refine((v) => Number(v) >= 0 && Number(v) <= 100, {
    error: "Ha d'estar entre 0 i 100",
  });

/**
 * Schema d'EDICIÓ d'un bé. L'inventari no es crea mai des d'un formulari
 * (es genera des de les despeses amortitzables), només s'edita. El servei
 * decideix quins camps són realment editables segons si el bé ja té
 * amortitzacions generades (vegeu inventari-service).
 */
export const inventariEditSchema = z.object({
  descripcio: z
    .string()
    .trim()
    .min(2, { error: "Mínim 2 caràcters" })
    .max(255, { error: "Màxim 255 caràcters" }),
  proveidorId: z.string().min(1, { error: "Selecciona un proveïdor" }),
  numFactura: optionalText(50),
  dataAdquisicio: dateRequired,
  importAdquisicio: importPositive,
  percAmortitzacio: percentatge,
});

export type InventariEditInput = z.output<typeof inventariEditSchema>;

/** Entitat de domini (imports com a string per precisió). */
export type Inventari = {
  id: string;
  numInventari: string;
  dataAdquisicio: Date;
  descripcio: string;
  importAdquisicio: string;
  importAmortitzat: string;
  percAmortitzacio: string;
  importUltimaAmort: string | null;
  numFactura: string | null;
  estat: EstatInventari;
  anyBaixa: number | null;
  proveidorId: string;
  despesaId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Enriquida amb el proveïdor i el recompte d'amortitzacions. */
export type InventariWithRelations = Inventari & {
  proveidor: { id: string; nom: string; nif: string };
  despesa: { id: string; numFactura: string | null } | null;
  numAmortitzacions: number;
};

/** Filtres de llistat parsejats dels search params. */
export type InventariListFilters = {
  search?: string;
  proveidorId?: string;
  estat?: EstatInventari;
  /** Per omissió els béns ELIMINAT s'amaguen; aquest flag els inclou. */
  includeEliminats?: boolean;
};
