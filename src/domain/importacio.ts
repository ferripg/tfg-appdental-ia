import { z } from "zod";
import { despesaInputSchema } from "./despesa";
import { proveidorInputSchema } from "./proveidor";
import { tipusDespesaInputSchema } from "./tipus-despesa";

/**
 * Domini de la importació de factures amb IA (IA-23).
 *
 * Tres blocs:
 *  1. `facturaExtretaSchema` — la sortida ESTRUCTURADA que demanem a Claude
 *     (via `output_config.format`). Les `.describe()` viatgen al JSON Schema
 *     i guien el model camp a camp.
 *  2. `ImportacioRow` — la fila que el servidor retorna al client per a la
 *     pantalla de revisió (extracció + resultat del matching, serialitzable).
 *  3. `importacioConfirmRowSchema` — el que el client envia en confirmar,
 *     revalidat al servidor. Reutilitza els schemas de camp existents de
 *     despesa/proveïdor/tipus (`.shape.<camp>`) per no duplicar regles.
 */

// ---------------------------------------------------------------------------
// Límits del lot
// ---------------------------------------------------------------------------

export const IMPORTACIO_MAX_FITXERS = 20;
export const IMPORTACIO_MAX_BYTES = 5 * 1024 * 1024; // mateix límit que la factura adjunta
/** Crides concurrents a l'API des del client (rate limits prudents). */
export const IMPORTACIO_CONCURRENCIA = 4;

// ---------------------------------------------------------------------------
// 1. Sortida estructurada de Claude
// ---------------------------------------------------------------------------

export const tipusNouSuggeritSchema = z.object({
  codi: z
    .string()
    .describe(
      "Codi curt NOU en majúscules (2-10 caràcters alfanumèrics) que no coincideixi amb cap codi del catàleg",
    ),
  descripcio: z.string().describe("Descripció breu del tipus, en català"),
  deduible: z
    .boolean()
    .describe("true per defecte per a despeses ordinàries del negoci"),
  esAmortitzable: z
    .boolean()
    .describe(
      "true NOMÉS per a béns d'inversió duradors: equipament, maquinària, mobiliari, informàtica",
    ),
  grup: z
    .number()
    .int()
    .nullable()
    .describe(
      "Grup del Pla General Comptable (1-9): 2 si és immobilitzat/amortitzable, 6 per a compres i serveis corrents",
    ),
});

export const facturaExtretaSchema = z.object({
  esFactura: z
    .boolean()
    .describe(
      "false si el document NO és una factura (pressupost, albarà, document irrellevant o il·legible)",
    ),
  conteMultiplesFactures: z
    .boolean()
    .describe("true si el document conté MÉS D'UNA factura diferent"),
  proveidor: z.object({
    nom: z.string().nullable().describe("Raó social de QUI EMET la factura"),
    nif: z
      .string()
      .nullable()
      .describe("NIF/CIF de l'emissor, tal com apareix al document"),
    adreca: z.string().nullable().describe("Adreça (carrer i número) de l'emissor"),
    codiPostal: z.string().nullable().describe("Codi postal de l'emissor (5 dígits)"),
    poblacio: z.string().nullable().describe("Població de l'emissor"),
    email: z.string().nullable().describe("Correu electrònic de l'emissor"),
    telefon: z.string().nullable().describe("Telèfon de l'emissor"),
  }),
  numFactura: z.string().nullable().describe("Número de la factura"),
  dataFactura: z
    .string()
    .nullable()
    .describe("Data de la factura en format ISO YYYY-MM-DD"),
  baseImposable: z
    .number()
    .nullable()
    .describe("Base imposable en euros, decimal amb punt"),
  ivaPercentatge: z.number().nullable().describe("Percentatge d'IVA aplicat (ex: 21)"),
  ivaImport: z.number().nullable().describe("Quota d'IVA en euros"),
  total: z.number().nullable().describe("Import TOTAL de la factura en euros"),
  concepte: z
    .string()
    .nullable()
    .describe("Resum breu en català del que es factura (màx 500 caràcters)"),
  tipusExistentCodi: z
    .string()
    .nullable()
    .describe(
      "Codi del catàleg de tipus de despesa que millor encaixa; null NOMÉS si cap hi encaixa raonablement",
    ),
  tipusNou: tipusNouSuggeritSchema
    .nullable()
    .describe("Proposta de tipus NOU, només quan tipusExistentCodi és null"),
  confianca: z
    .enum(["alta", "mitjana", "baixa"])
    .describe(
      "alta = tot clarament llegible; mitjana = algun camp dubtós; baixa = document difícil de llegir",
    ),
  campsDubtosos: z
    .array(z.string())
    .describe(
      'Noms dels camps llegits amb inseguretat (ex: "nif", "total", "dataFactura")',
    ),
});

export type FacturaExtreta = z.infer<typeof facturaExtretaSchema>;
export type TipusNouSuggerit = z.infer<typeof tipusNouSuggeritSchema>;

/** Entrada del catàleg que es passa a Claude perquè reutilitzi tipus existents. */
export type CatalegTipusEntry = {
  codi: string;
  descripcio: string;
  esAmortitzable: boolean;
};

// ---------------------------------------------------------------------------
// 2. Fila de revisió (resposta del servidor al client, serialitzable)
// ---------------------------------------------------------------------------

/** Resultat del matching servidor contra la BD, adjuntat a cada fila extreta. */
export type ImportacioMatching = {
  /** Proveïdor existent aparellat (per NIF o, si no, per nom normalitzat). */
  proveidorId: string | null;
  proveidorNom: string | null;
  proveidorMatch: "nif" | "nom" | null;
  /** Tipus existent aparellat pel codi que ha triat Claude. */
  tipusDespesaId: string | null;
  /** Ja existeix una despesa amb el mateix numFactura i proveïdor. */
  duplicat: boolean;
};

export type ImportacioRow =
  | {
      estat: "ok";
      fitxerKey: string;
      nomFitxer: string;
      extraccio: FacturaExtreta;
      matching: ImportacioMatching;
    }
  | {
      estat: "error";
      fitxerKey: string | null; // null si ni tan sols s'ha pogut pujar
      nomFitxer: string;
      error: string;
    };

// ---------------------------------------------------------------------------
// 3. Confirmació (client → servidor), revalidada amb Zod
// ---------------------------------------------------------------------------

/** Camps del proveïdor NOU: reutilitza les regles del schema de proveïdor. */
const proveidorNouSchema = z.object({
  nif: proveidorInputSchema.shape.nif,
  nom: proveidorInputSchema.shape.nom,
  adreca: proveidorInputSchema.shape.adreca,
  codiPostal: proveidorInputSchema.shape.codiPostal,
  poblacio: proveidorInputSchema.shape.poblacio,
  email: proveidorInputSchema.shape.email,
  telefon: proveidorInputSchema.shape.telefon,
});

/** Camps del tipus NOU: codi/descripcio amb les regles del schema de tipus. */
const tipusNouConfirmSchema = z.object({
  codi: tipusDespesaInputSchema.shape.codi,
  descripcio: tipusDespesaInputSchema.shape.descripcio,
  deduible: z.boolean(),
  esAmortitzable: z.boolean(),
  grup: z
    .number()
    .int()
    .min(1, { error: "El grup ha de ser un enter entre 1 i 9" })
    .max(9, { error: "El grup ha de ser un enter entre 1 i 9" })
    .nullable(),
});

export const importacioConfirmRowSchema = z.object({
  fitxerKey: z
    .string()
    .regex(/^import\/[a-zA-Z0-9-]+\.pdf$/, { error: "Clau de fitxer no vàlida" }),
  nomFitxer: z.string().trim().min(1).max(255),

  // Camps de la despesa: mateixes regles que el formulari manual.
  dataFactura: despesaInputSchema.shape.dataFactura,
  numFactura: despesaInputSchema.shape.numFactura,
  descripcio: despesaInputSchema.shape.descripcio,
  import: despesaInputSchema.shape.import,

  proveidor: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("cap") }),
    z.object({ mode: z.literal("existent"), id: z.string().min(1) }),
    z.object({ mode: z.literal("nou") }).extend(proveidorNouSchema.shape),
  ]),

  tipus: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("existent"), id: z.string().min(1) }),
    z.object({ mode: z.literal("nou") }).extend(tipusNouConfirmSchema.shape),
  ]),
});

export type ImportacioConfirmRow = z.output<typeof importacioConfirmRowSchema>;

/** Resultat per fila de la confirmació (cada fila és una transacció pròpia). */
export type ImportacioConfirmRowResult = {
  fitxerKey: string;
  nomFitxer: string;
  ok: boolean;
  error?: string;
  despesaId?: string;
  proveidorCreat?: boolean;
  tipusCreat?: boolean;
  beCreat?: boolean;
};

export type ImportacioConfirmResum = {
  files: ImportacioConfirmRowResult[];
  despesesCreades: number;
  proveidorsCreats: number;
  tipusCreats: number;
  bensCreats: number;
};
