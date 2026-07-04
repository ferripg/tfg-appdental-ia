import { BusinessError } from "@/domain/errors";
import type { ImportacioConfirmRow } from "@/domain/importacio";
import { createFromDespesaTx, maxNumInventari } from "./inventari-repository";
import { prisma } from "./prisma-client";

/**
 * Repositori de la confirmació de la importació IA (IA-23).
 *
 * `confirmRow` executa TOTA la cadena d'una fila — troba/crea proveïdor →
 * troba/crea tipus → crea despesa → genera el bé si el tipus és amortitzable —
 * dins d'UNA SOLA `$transaction`. Si qualsevol pas peta, la fila queda
 * intacta (cap proveïdor o tipus orfe) i la resta del lot no se'n ressent:
 * l'atomicitat és per fila, no per lot.
 *
 * La generació del bé reutilitza els helpers transaccionals
 * d'`inventari-repository` (`maxNumInventari` + `createFromDespesaTx`), la
 * mateixa lògica que la creació manual de despeses amortitzables.
 */

export type ConfirmRowOutcome = {
  despesaId: string;
  proveidorId: string | null;
  proveidorCreat: boolean;
  tipusDespesaId: string;
  tipusCreat: boolean;
  beCreat: boolean;
};

export const importacioRepository = {
  async confirmRow(
    row: ImportacioConfirmRow,
    userId: string,
  ): Promise<ConfirmRowOutcome> {
    return prisma.$transaction(async (tx) => {
      // --- 1. Proveïdor: existent, nou, o cap -----------------------------
      let proveidorId: string | null = null;
      let proveidorCreat = false;
      if (row.proveidor.mode === "existent") {
        const prov = await tx.proveidor.findUnique({
          where: { id: row.proveidor.id },
          select: { id: true, actiu: true },
        });
        if (!prov) throw new BusinessError("Proveïdor no trobat");
        if (!prov.actiu) throw new BusinessError("El proveïdor està desactivat");
        proveidorId = prov.id;
      } else if (row.proveidor.mode === "nou") {
        const creat = await tx.proveidor.create({
          data: {
            nif: row.proveidor.nif,
            nom: row.proveidor.nom,
            adreca: row.proveidor.adreca,
            codiPostal: row.proveidor.codiPostal,
            poblacio: row.proveidor.poblacio,
            email: row.proveidor.email,
            telefon: row.proveidor.telefon,
            actiu: true,
          },
          select: { id: true },
        });
        proveidorId = creat.id;
        proveidorCreat = true;
      }

      // --- 2. Tipus de despesa: existent o nou ----------------------------
      let tipusDespesaId: string;
      let tipusDescripcio: string;
      let esAmortitzable: boolean;
      let tipusCreat = false;
      if (row.tipus.mode === "existent") {
        const tipus = await tx.tipusDespesa.findUnique({
          where: { id: row.tipus.id },
          select: { id: true, descripcio: true, esAmortitzable: true, actiu: true },
        });
        if (!tipus) throw new BusinessError("Tipus de despesa no trobat");
        if (!tipus.actiu)
          throw new BusinessError("El tipus de despesa està desactivat");
        tipusDespesaId = tipus.id;
        tipusDescripcio = tipus.descripcio;
        esAmortitzable = tipus.esAmortitzable;
      } else {
        const creat = await tx.tipusDespesa.create({
          data: {
            codi: row.tipus.codi,
            descripcio: row.tipus.descripcio,
            deduible: row.tipus.deduible,
            esAmortitzable: row.tipus.esAmortitzable,
            grup: row.tipus.grup,
            actiu: true,
          },
          select: { id: true, descripcio: true, esAmortitzable: true },
        });
        tipusDespesaId = creat.id;
        tipusDescripcio = creat.descripcio;
        esAmortitzable = creat.esAmortitzable;
        tipusCreat = true;
      }

      // --- 3. Despesa (el PDF de staging passa a ser el fitxer definitiu) --
      const despesa = await tx.despesa.create({
        data: {
          dataFactura: row.dataFactura,
          import: row.import,
          numFactura: row.numFactura,
          descripcio: row.descripcio,
          fitxerKey: row.fitxerKey,
          tipusDespesaId,
          proveidorId,
          userId,
        },
        select: {
          id: true,
          dataFactura: true,
          import: true,
          descripcio: true,
          numFactura: true,
          proveidorId: true,
        },
      });

      // --- 4. Bé d'inventari si el tipus és amortitzable -------------------
      // (el servei ja ha garantit que hi ha proveïdor en aquest cas)
      let beCreat = false;
      if (esAmortitzable && despesa.proveidorId) {
        const next = (await maxNumInventari(tx)) + 1;
        await createFromDespesaTx(
          tx,
          { ...despesa, tipusDespesa: { descripcio: tipusDescripcio } },
          next,
        );
        beCreat = true;
      }

      return {
        despesaId: despesa.id,
        proveidorId,
        proveidorCreat,
        tipusDespesaId,
        tipusCreat,
        beCreat,
      };
    });
  },

  /**
   * Hi ha ja una despesa amb aquest número de factura per al mateix
   * proveïdor? (avís de duplicat a la revisió, mai bloquejant).
   */
  async existeixDespesaDuplicada(
    numFactura: string,
    proveidorId: string,
  ): Promise<boolean> {
    const count = await prisma.despesa.count({
      where: {
        proveidorId,
        numFactura: { equals: numFactura, mode: "insensitive" },
      },
    });
    return count > 0;
  },

  /**
   * El fitxer de staging està referenciat per alguna despesa? Protecció
   * perquè el descart mai no esborri el PDF d'una fila ja confirmada.
   */
  async fitxerKeyEnUs(fitxerKey: string): Promise<boolean> {
    const count = await prisma.despesa.count({ where: { fitxerKey } });
    return count > 0;
  },

  /** Cerca de proveïdor per nom normalitzat (fallback quan no hi ha NIF). */
  async findProveidorByNomNormalitzat(
    nom: string,
  ): Promise<{ id: string; nom: string } | null> {
    const row = await prisma.proveidor.findFirst({
      where: { nom: { equals: nom.trim(), mode: "insensitive" }, actiu: true },
      select: { id: true, nom: true },
    });
    return row;
  },
};

/** Detecta violacions d'unicitat de Prisma (P2002) per donar missatges clars. */
export function esViolacioUnicitat(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "P2002"
  );
}
