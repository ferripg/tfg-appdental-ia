import { randomUUID } from "node:crypto";
import { z } from "zod";
import { BusinessError, DomainError, ValidationError } from "@/domain/errors";
import {
  type CatalegTipusEntry,
  type FacturaExtreta,
  IMPORTACIO_MAX_BYTES,
  IMPORTACIO_MAX_FITXERS,
  type ImportacioConfirmResum,
  type ImportacioConfirmRow,
  type ImportacioConfirmRowResult,
  importacioConfirmRowSchema,
  type ImportacioMatching,
  type ImportacioRow,
} from "@/domain/importacio";
import { extraccioRepository } from "@/repositories/extraccio-repository";
import { facturesRepository } from "@/repositories/factures-repository";
import {
  esViolacioUnicitat,
  importacioRepository,
} from "@/repositories/importacio-repository";
import { proveidorsRepository } from "@/repositories/proveidors-repository";
import { tipusDespesaRepository } from "@/repositories/tipus-despesa-repository";
import { auditService } from "./audit-service";
import { requireManager } from "./auth-service";
import { flattenZodErrors } from "./zod-helpers";

/**
 * Servei d'importació de factures amb IA (IA-23).
 *
 * Flux en dues fases, sempre amb revisió humana entremig:
 *  1. `extreuFactura` — puja el PDF a MinIO amb clau de staging
 *     (`import/<uuid>.pdf`), l'envia a Claude i retorna la fila de revisió
 *     amb el matching contra la BD. MAI persisteix res al domini.
 *  2. `confirma` — l'usuari ha revisat i editat; cada fila s'executa en una
 *     transacció pròpia (vegeu `importacio-repository`). El PDF de staging
 *     passa a ser el `fitxerKey` definitiu de la despesa, sense còpies.
 *
 * Permisos: MANAGER/ADMIN (la importació pot crear proveïdors i tipus, que
 * la matriu de rols reserva a la gestió del domini — IA-18).
 */

const pdfFileSchema = z
  .instanceof(File, { error: "Cal adjuntar un fitxer" })
  .refine((f) => f.size > 0, { error: "El fitxer és buit" })
  .refine((f) => f.size <= IMPORTACIO_MAX_BYTES, {
    error: "El fitxer supera el màxim de 5 MB",
  })
  .refine((f) => f.type === "application/pdf", {
    error: "Només s'admeten fitxers PDF",
  });

const confirmInputSchema = z
  .array(importacioConfirmRowSchema)
  .min(1, { error: "Cap fila seleccionada" })
  .max(IMPORTACIO_MAX_FITXERS, {
    error: `Màxim ${IMPORTACIO_MAX_FITXERS} factures per lot`,
  });

const descartaInputSchema = z
  .array(z.string().regex(/^import\/[a-zA-Z0-9-]+\.pdf$/))
  .max(IMPORTACIO_MAX_FITXERS);

/** Normalització de NIF idèntica a la del schema de proveïdor. */
function normalitzaNif(nif: string): string {
  return nif.trim().toUpperCase().replace(/[\s-]/g, "");
}

/**
 * Matching de l'extracció contra la BD: proveïdor per NIF (prioritari) o per
 * nom normalitzat (amb avís a la UI), tipus pel codi triat per Claude, i
 * detecció de duplicats numFactura+proveïdor.
 */
async function calculaMatching(
  extraccio: FacturaExtreta,
): Promise<ImportacioMatching> {
  let proveidorId: string | null = null;
  let proveidorNom: string | null = null;
  let proveidorMatch: "nif" | "nom" | null = null;

  if (extraccio.proveidor.nif) {
    const prov = await proveidorsRepository.findByNif(
      normalitzaNif(extraccio.proveidor.nif),
    );
    if (prov) {
      proveidorId = prov.id;
      proveidorNom = prov.nom;
      proveidorMatch = "nif";
    }
  }
  if (!proveidorId && extraccio.proveidor.nom) {
    const prov = await importacioRepository.findProveidorByNomNormalitzat(
      extraccio.proveidor.nom,
    );
    if (prov) {
      proveidorId = prov.id;
      proveidorNom = prov.nom;
      proveidorMatch = "nom";
    }
  }

  let tipusDespesaId: string | null = null;
  if (extraccio.tipusExistentCodi) {
    const tipus = await tipusDespesaRepository.findByCodi(
      extraccio.tipusExistentCodi.trim().toUpperCase(),
    );
    if (tipus?.actiu) tipusDespesaId = tipus.id;
  }
  // Si Claude proposa un tipus "nou" amb un codi que ja existeix, l'aprofitem.
  if (!tipusDespesaId && extraccio.tipusNou) {
    const tipus = await tipusDespesaRepository.findByCodi(
      extraccio.tipusNou.codi.trim().toUpperCase(),
    );
    if (tipus?.actiu) tipusDespesaId = tipus.id;
  }

  const duplicat =
    proveidorId && extraccio.numFactura
      ? await importacioRepository.existeixDespesaDuplicada(
          extraccio.numFactura,
          proveidorId,
        )
      : false;

  return { proveidorId, proveidorNom, proveidorMatch, tipusDespesaId, duplicat };
}

/**
 * Validacions de negoci d'una fila abans de la transacció, amb normalització
 * "d'última hora": si el proveïdor/tipus NOU ja existeix ara (creat per una
 * fila anterior del mateix lot o per un altre usuari), es converteix en
 * "existent" en lloc de petar per unicitat.
 */
async function preparaFila(
  row: ImportacioConfirmRow,
): Promise<ImportacioConfirmRow> {
  let proveidor = row.proveidor;
  if (proveidor.mode === "nou") {
    const existent = await proveidorsRepository.findByNif(proveidor.nif);
    if (existent && !existent.actiu) {
      throw new BusinessError(
        `Ja existeix un proveïdor desactivat amb el NIF ${proveidor.nif}; reactiva'l abans d'importar`,
      );
    }
    if (existent) proveidor = { mode: "existent", id: existent.id };
  }

  let tipus = row.tipus;
  if (tipus.mode === "nou") {
    const existent = await tipusDespesaRepository.findByCodi(tipus.codi);
    if (existent && !existent.actiu) {
      throw new BusinessError(
        `Ja existeix un tipus desactivat amb el codi ${tipus.codi}; reactiva'l abans d'importar`,
      );
    }
    if (existent) tipus = { mode: "existent", id: existent.id };
  }

  // Regla de negoci (mateixa que el flux manual): tipus amortitzable ⇒ es
  // generarà un bé d'inventari, que exigeix proveïdor.
  const esAmortitzable =
    tipus.mode === "nou"
      ? tipus.esAmortitzable
      : ((await tipusDespesaRepository.findById(tipus.id))?.esAmortitzable ??
        false);
  if (esAmortitzable && proveidor.mode === "cap") {
    throw new BusinessError(
      "El tipus és amortitzable: cal un proveïdor per generar el bé d'inventari",
    );
  }

  return { ...row, proveidor, tipus };
}

export const importacioService = {
  /**
   * Fase 1 — puja UN PDF a staging i n'extreu les dades amb Claude.
   * Retorna sempre una fila (ok o error): els errors d'una factura no han
   * de trencar mai la resta del lot, per això aquí no es llança.
   */
  async extreuFactura(file: unknown, nomFitxer: string): Promise<ImportacioRow> {
    await requireManager();

    const parsed = pdfFileSchema.safeParse(file);
    if (!parsed.success) {
      return {
        estat: "error",
        fitxerKey: null,
        nomFitxer,
        error: parsed.error.issues.map((i) => i.message).join(" · "),
      };
    }

    const fitxerKey = `import/${randomUUID()}.pdf`;
    const buffer = Buffer.from(await parsed.data.arrayBuffer());

    try {
      await facturesRepository.upload(fitxerKey, buffer, "application/pdf");

      const cataleg: CatalegTipusEntry[] = (
        await tipusDespesaRepository.findAll()
      ).map((t) => ({
        codi: t.codi,
        descripcio: t.descripcio,
        esAmortitzable: t.esAmortitzable,
      }));

      const extraccio = await extraccioRepository.extreuFactura(buffer, cataleg);

      if (!extraccio.esFactura) {
        return {
          estat: "error",
          fitxerKey,
          nomFitxer,
          error: "El document no sembla una factura",
        };
      }
      if (extraccio.conteMultiplesFactures) {
        return {
          estat: "error",
          fitxerKey,
          nomFitxer,
          error:
            "El PDF conté més d'una factura; separa-les en fitxers individuals",
        };
      }

      return {
        estat: "ok",
        fitxerKey,
        nomFitxer,
        extraccio,
        matching: await calculaMatching(extraccio),
      };
    } catch (err) {
      if (err instanceof DomainError) {
        return { estat: "error", fitxerKey, nomFitxer, error: err.message };
      }
      console.error(`[importacioService.extreuFactura] ${nomFitxer}:`, err);
      return {
        estat: "error",
        fitxerKey,
        nomFitxer,
        error: "Error inesperat en processar el fitxer",
      };
    }
  },

  /**
   * Fase 2 — confirma les files revisades per l'usuari. Cada fila és una
   * transacció independent: les que fallen no aturen les altres i el seu
   * error es retorna per mostrar-lo a la seva fila.
   */
  async confirma(input: unknown): Promise<ImportacioConfirmResum> {
    const session = await requireManager();

    const parsed = confirmInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        "Hi ha files amb errors de validació",
        flattenZodErrors(parsed.error),
      );
    }

    const files: ImportacioConfirmRowResult[] = [];
    for (const rowInput of parsed.data) {
      const base = { fitxerKey: rowInput.fitxerKey, nomFitxer: rowInput.nomFitxer };
      try {
        const row = await preparaFila(rowInput);
        const outcome = await importacioRepository.confirmRow(
          row,
          session.user.id,
        );

        // Auditoria amb origen "import-ia" per distingir-ho del CRUD manual.
        if (outcome.proveidorCreat && row.proveidor.mode === "nou") {
          await auditService.record(session.user.id, "CREATE", {
            entitat: "Proveidor",
            entitatId: outcome.proveidorId,
            metadata: {
              nom: row.proveidor.nom,
              nif: row.proveidor.nif,
              origen: "import-ia",
            },
          });
        }
        if (outcome.tipusCreat && row.tipus.mode === "nou") {
          await auditService.record(session.user.id, "CREATE", {
            entitat: "TipusDespesa",
            entitatId: outcome.tipusDespesaId,
            metadata: {
              codi: row.tipus.codi,
              descripcio: row.tipus.descripcio,
              origen: "import-ia",
            },
          });
        }
        await auditService.record(session.user.id, "CREATE", {
          entitat: "Despesa",
          entitatId: outcome.despesaId,
          metadata: {
            import: row.import,
            numFactura: row.numFactura,
            origen: "import-ia",
            fitxer: row.nomFitxer,
            beGenerat: outcome.beCreat,
          },
        });

        files.push({
          ...base,
          ok: true,
          despesaId: outcome.despesaId,
          proveidorCreat: outcome.proveidorCreat,
          tipusCreat: outcome.tipusCreat,
          beCreat: outcome.beCreat,
        });
      } catch (err) {
        if (err instanceof DomainError) {
          files.push({ ...base, ok: false, error: err.message });
        } else if (esViolacioUnicitat(err)) {
          files.push({
            ...base,
            ok: false,
            error: "Conflicte d'unicitat (NIF de proveïdor o codi de tipus repetit)",
          });
        } else {
          console.error(
            `[importacioService.confirma] ${base.nomFitxer}:`,
            err,
          );
          files.push({ ...base, ok: false, error: "Error inesperat" });
        }
      }
    }

    return {
      files,
      despesesCreades: files.filter((f) => f.ok).length,
      proveidorsCreats: files.filter((f) => f.proveidorCreat).length,
      tipusCreats: files.filter((f) => f.tipusCreat).length,
      bensCreats: files.filter((f) => f.beCreat).length,
    };
  },

  /**
   * Neteja del staging: esborra de MinIO els PDFs de les files descartades.
   * Mai no toca un fitxer que ja pertanyi a una despesa confirmada, i els
   * errors d'esborrat només es registren (fitxer orfe ≠ operació fallida).
   */
  async descarta(input: unknown): Promise<void> {
    await requireManager();
    const parsed = descartaInputSchema.safeParse(input);
    if (!parsed.success) return;

    for (const key of parsed.data) {
      try {
        if (await importacioRepository.fitxerKeyEnUs(key)) continue;
        await facturesRepository.remove(key);
      } catch (err) {
        console.error(`[importacioService.descarta] ${key}:`, err);
      }
    }
  },
};
