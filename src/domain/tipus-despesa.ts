import { z } from "zod";

/** Trims, coerces empty → null and enforces max length. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null));

/**
 * Plan General Comptable group: integer in [1, 9] when present.
 * HTML number inputs deliver strings, so we coerce manually instead of
 * `z.coerce.number()` (which would also accept "5.7" or "abc" → NaN).
 */
const optionalGrupPGC = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? Number(v) : null))
  .refine(
    (v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 9),
    { error: "El grup ha de ser un enter entre 1 i 9" },
  );

export const tipusDespesaInputSchema = z.object({
  codi: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(
      z.string().regex(/^[A-Z0-9]{2,10}$/, {
        error: "El codi ha de tenir entre 2 i 10 caràcters alfanumèrics",
      }),
    ),
  descripcio: z
    .string()
    .trim()
    .min(2, { error: "Mínim 2 caràcters" })
    .max(255, { error: "Màxim 255 caràcters" }),
  deduible: z.boolean(),
  esAmortitzable: z.boolean(),
  actiu: z.boolean(),
  grup: optionalGrupPGC,
  concepte: optionalText(5000),
});

/** Validated input ready for persistence (no id, no timestamps). */
export type TipusDespesaInput = z.output<typeof tipusDespesaInputSchema>;

/** Full domain entity returned by the repository. */
export type TipusDespesa = TipusDespesaInput & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

/** List rows include the count of FK relations to decide UI affordances. */
export type TipusDespesaWithCount = TipusDespesa & {
  _count: { despeses: number };
};

/** List filters parsed from search params. */
export type TipusDespesaListFilters = {
  search?: string;
  includeInactius?: boolean;
};
