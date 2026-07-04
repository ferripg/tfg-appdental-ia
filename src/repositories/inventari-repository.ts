import type { Inventari as PrismaInventari, Prisma } from "@prisma/client";
import type {
  EstatInventari,
  Inventari,
  InventariEditInput,
  InventariListFilters,
  InventariWithRelations,
} from "@/domain/inventari";
import { prisma } from "./prisma-client";

const INCLUDE = {
  proveidor: { select: { id: true, nom: true, nif: true } },
  despesa: { select: { id: true, numFactura: true } },
  _count: { select: { amortitzacions: true } },
} as const;

type PrismaInventariWithJoins = PrismaInventari & {
  proveidor: { id: string; nom: string; nif: string };
  despesa: { id: string; numFactura: string | null } | null;
  _count: { amortitzacions: number };
};

/** Decimal → string (`.toString()`) per preservar precisió sense fugir Decimal.js. */
function toDomain(i: PrismaInventariWithJoins): InventariWithRelations {
  return {
    id: i.id,
    numInventari: i.numInventari,
    dataAdquisicio: i.dataAdquisicio,
    descripcio: i.descripcio,
    importAdquisicio: i.importAdquisicio.toString(),
    importAmortitzat: i.importAmortitzat.toString(),
    percAmortitzacio: i.percAmortitzacio.toString(),
    importUltimaAmort: i.importUltimaAmort ? i.importUltimaAmort.toString() : null,
    numFactura: i.numFactura,
    estat: i.estat as EstatInventari,
    anyBaixa: i.anyBaixa,
    proveidorId: i.proveidorId,
    despesaId: i.despesaId,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
    proveidor: i.proveidor,
    despesa: i.despesa,
    numAmortitzacions: i._count.amortitzacions,
  };
}

/** Formata un enter seqüencial com a número d'inventari llegible. */
function formatNum(n: number): string {
  return `INV-${String(n).padStart(4, "0")}`;
}

/**
 * Màxim suffix numèric usat fins ara (0 si no n'hi ha cap). Llegim tots els
 * números (taula petita d'una clínica) i en traiem el màxim, robust a forats
 * i a passar de 9999. Es passa un client (tx o prisma) per fer-ho dins la
 * mateixa transacció que la inserció.
 *
 * EXPORTAT (IA-23): la importació de factures reutilitza la generació del bé
 * dins la SEVA transacció per fila (proveïdor→tipus→despesa→bé atòmics).
 */
export async function maxNumInventari(
  client: Prisma.TransactionClient,
): Promise<number> {
  const rows = await client.inventari.findMany({
    select: { numInventari: true },
  });
  let max = 0;
  for (const { numInventari } of rows) {
    const n = Number.parseInt(numInventari.replace(/^INV-/, ""), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

export type DespesaParaInventari = {
  id: string;
  dataFactura: Date;
  import: Prisma.Decimal;
  descripcio: string | null;
  numFactura: string | null;
  proveidorId: string | null;
  tipusDespesa: { descripcio: string };
};

/**
 * Crea un bé d'inventari a partir d'una despesa (dins una transacció).
 * Hereta data, import, factura i proveïdor de la despesa; descripció = la de
 * la despesa o, si és buida, la del tipus; percentatge a 0 (s'omple després).
 * Retorna null si la despesa no té proveïdor o ja té un bé associat.
 * EXPORTAT (IA-23): vegeu la nota de `maxNumInventari`.
 */
export async function createFromDespesaTx(
  tx: Prisma.TransactionClient,
  despesa: DespesaParaInventari,
  nextNumber: number,
): Promise<void> {
  // El proveïdor és obligatori al bé; si la despesa no en té, no es genera.
  // El guard narroweja el tipus i evita un non-null assertion.
  if (!despesa.proveidorId) return;
  await tx.inventari.create({
    data: {
      numInventari: formatNum(nextNumber),
      dataAdquisicio: despesa.dataFactura,
      descripcio: despesa.descripcio?.trim() || despesa.tipusDespesa.descripcio,
      importAdquisicio: despesa.import,
      percAmortitzacio: 0,
      numFactura: despesa.numFactura,
      proveidorId: despesa.proveidorId,
      despesaId: despesa.id,
    },
  });
}

export const inventariRepository = {
  async findAll(
    filters: InventariListFilters = {},
  ): Promise<InventariWithRelations[]> {
    const { search, proveidorId, estat, includeEliminats } = filters;
    const where: Prisma.InventariWhereInput = {
      ...(estat
        ? { estat }
        : includeEliminats
          ? {}
          : { estat: { not: "ELIMINAT" } }),
      ...(proveidorId ? { proveidorId } : {}),
      ...(search
        ? {
            OR: [
              { numInventari: { contains: search, mode: "insensitive" } },
              { descripcio: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const rows = await prisma.inventari.findMany({
      where,
      include: INCLUDE,
      orderBy: [{ numInventari: "asc" }],
    });
    return rows.map(toDomain);
  },

  async findById(id: string): Promise<InventariWithRelations | null> {
    const row = await prisma.inventari.findUnique({
      where: { id },
      include: INCLUDE,
    });
    return row ? toDomain(row) : null;
  },

  async update(id: string, data: InventariEditInput): Promise<Inventari> {
    const row = await prisma.inventari.update({
      where: { id },
      data: {
        descripcio: data.descripcio,
        proveidorId: data.proveidorId,
        numFactura: data.numFactura,
        dataAdquisicio: data.dataAdquisicio,
        importAdquisicio: data.importAdquisicio,
        percAmortitzacio: data.percAmortitzacio,
      },
      include: INCLUDE,
    });
    return toDomain(row);
  },

  /**
   * Edició restringida: només els camps segurs quan el bé ja té
   * amortitzacions (no es pot tocar import/%/data sense desquadrar els
   * càlculs ja fets).
   */
  async updateSafeFields(
    id: string,
    data: Pick<InventariEditInput, "descripcio" | "proveidorId" | "numFactura">,
  ): Promise<Inventari> {
    const row = await prisma.inventari.update({
      where: { id },
      data: {
        descripcio: data.descripcio,
        proveidorId: data.proveidorId,
        numFactura: data.numFactura,
      },
      include: INCLUDE,
    });
    return toDomain(row);
  },

  async setEstat(
    id: string,
    estat: EstatInventari,
    anyBaixa: number | null,
  ): Promise<Inventari> {
    const row = await prisma.inventari.update({
      where: { id },
      data: { estat, anyBaixa },
      include: INCLUDE,
    });
    return toDomain(row);
  },

  /**
   * Genera el bé d'una despesa acabada de crear (o actualitzada) si encara no
   * en té. Idempotent: si ja existeix un bé per a la despesa, no fa res.
   * El caller ha garantit que el tipus és amortitzable i que hi ha proveïdor.
   */
  async createFromDespesa(despesaId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const despesa = await tx.despesa.findUnique({
        where: { id: despesaId },
        select: {
          id: true,
          dataFactura: true,
          import: true,
          descripcio: true,
          numFactura: true,
          proveidorId: true,
          tipusDespesa: { select: { descripcio: true } },
          inventari: { select: { id: true } },
        },
      });
      if (!despesa || !despesa.proveidorId || despesa.inventari) return;

      const next = (await maxNumInventari(tx)) + 1;
      await createFromDespesaTx(tx, despesa, next);
    });
  },

  /**
   * Generació RETROACTIVA: crea els béns de totes les despeses d'un tipus que
   * encara no en tenen i que tenen proveïdor. Idempotent. Retorna quants se
   * n'han generat i quants s'han omès per no tenir proveïdor (no es pot crear
   * un bé sense proveïdor, que és obligatori).
   */
  async generateMissingForTipus(
    tipusDespesaId: string,
  ): Promise<{ generats: number; omesos: number }> {
    return prisma.$transaction(async (tx) => {
      const ambProveidor = await tx.despesa.findMany({
        where: {
          tipusDespesaId,
          proveidorId: { not: null },
          inventari: { is: null },
        },
        select: {
          id: true,
          dataFactura: true,
          import: true,
          descripcio: true,
          numFactura: true,
          proveidorId: true,
          tipusDespesa: { select: { descripcio: true } },
        },
        orderBy: { dataFactura: "asc" },
      });

      const omesos = await tx.despesa.count({
        where: {
          tipusDespesaId,
          proveidorId: null,
          inventari: { is: null },
        },
      });

      let next = await maxNumInventari(tx);
      for (const despesa of ambProveidor) {
        next += 1;
        await createFromDespesaTx(tx, despesa, next);
      }
      return { generats: ambProveidor.length, omesos };
    });
  },
};
