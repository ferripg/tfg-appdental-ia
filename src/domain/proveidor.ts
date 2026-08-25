import { z } from "zod";
import { isValidIBAN } from "./validators/iban";
import { isValidNIF, normalitzaNIF } from "./validators/nif";

/** Coerce empty strings / undefined into `null` for nullable text fields. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null));

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || z.email().safeParse(v).success, {
    error: "Adreça electrònica no vàlida",
  });

const optionalCodiPostal = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{5}$/.test(v), {
    error: "El codi postal ha de tenir 5 dígits",
  });

const optionalIban = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v.replace(/\s/g, "").toUpperCase() : null))
  .refine((v) => v === null || isValidIBAN(v), {
    error: "IBAN no vàlid",
  });

export const proveidorInputSchema = z.object({
  nif: z
    .string()
    .trim()
    .min(1, { error: "El NIF és obligatori" })
    // normalitzaNIF també treu el prefix «ES» del NIF-IVA: així es DESA el
    // CIF pelat i la detecció de duplicats per NIF troba el proveïdor
    // encara que la factura porti el format intracomunitari.
    .transform(normalitzaNIF)
    .refine(isValidNIF, { error: "NIF no vàlid" }),
  nom: z
    .string()
    .trim()
    .min(1, { error: "El nom és obligatori" })
    .max(255, { error: "Màxim 255 caràcters" }),
  codiBis: optionalText(50),
  actiu: z.boolean(),
  adreca: optionalText(255),
  codiPostal: optionalCodiPostal,
  poblacio: optionalText(100),
  email: optionalEmail,
  telefon: optionalText(20),
  personaContacte: optionalText(100),
  iban: optionalIban,
  notes: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
});

/** Validated input ready for persistence (no id, no timestamps). */
export type ProveidorInput = z.output<typeof proveidorInputSchema>;

/** Full domain entity returned by the repository. */
export type Proveidor = ProveidorInput & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

/** List rows include the count of FK relations to decide UI affordances. */
export type ProveidorWithCount = Proveidor & {
  _count: { despeses: number; inventari: number };
};

/** List filters parsed from search params. */
export type ProveidorListFilters = {
  search?: string;
  includeInactius?: boolean;
};
