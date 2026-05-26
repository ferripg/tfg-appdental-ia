import { z } from "zod";

/** Coerce empty / undefined into null for nullable text fields. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null));

/**
 * HTML <input type="date"> ships "YYYY-MM-DD". Parse to a Date anchored at
 * UTC midnight to avoid local-timezone drift across server / client.
 * Display layer formats with Intl.DateTimeFormat('ca-ES').
 */
const dateRequired = z
  .string()
  .min(1, { error: "La data és obligatòria" })
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), {
    error: "Format de data invàlid",
  })
  .transform((v) => new Date(`${v}T00:00:00Z`));

const dateOptional = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? new Date(`${v}T00:00:00Z`) : null))
  .refine((v) => v === null || !Number.isNaN(v.getTime()), {
    error: "Data invàlida",
  });

/**
 * Accept "123.45" o "123,45", normalise to dot decimal, validate format,
 * require > 0. We keep import as a string in the domain to preserve the
 * 2-decimal precision Prisma stores (Decimal(12,2)) without depending on
 * Decimal.js outside repositories.
 */
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

const optionalCuid = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

export const despesaInputSchema = z.object({
  dataFactura: dateRequired,
  dataPagament: dateOptional,
  import: importPositive,
  numFactura: optionalText(50),
  descripcio: optionalText(500),
  tipusDespesaId: z
    .string()
    .min(1, { error: "Selecciona un tipus de despesa" }),
  proveidorId: optionalCuid,
});

/** Validated input ready for persistence (no id, no timestamps, no userId). */
export type DespesaInput = z.output<typeof despesaInputSchema>;

/** Full domain entity (without joins). */
export type Despesa = DespesaInput & {
  id: string;
  fitxerKey: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Enriched type returned by repository — embeds FK rows the UI displays. */
export type DespesaWithRelations = Despesa & {
  proveidor: { id: string; nom: string; nif: string } | null;
  tipusDespesa: {
    id: string;
    codi: string;
    descripcio: string;
    esAmortitzable: boolean;
  };
  registratPer: { id: string; name: string | null; email: string };
};

/** List filters parsed from search params. */
export type DespesaListFilters = {
  search?: string;
  des?: Date;
  fins?: Date;
  proveidorId?: string;
  tipusDespesaId?: string;
};
