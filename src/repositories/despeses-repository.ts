import type {
  Despesa as PrismaDespesa,
  Prisma,
} from "@prisma/client";
import type {
  DespesaInput,
  DespesaListFilters,
  DespesaWithRelations,
} from "@/domain/despesa";
import { prisma } from "./prisma-client";

const INCLUDE = {
  proveidor: { select: { id: true, nom: true, nif: true } },
  tipusDespesa: {
    select: { id: true, codi: true, descripcio: true, esAmortitzable: true },
  },
  registratPer: { select: { id: true, name: true, email: true } },
} as const;

type PrismaDespesaWithJoins = PrismaDespesa & {
  proveidor: { id: string; nom: string; nif: string } | null;
  tipusDespesa: {
    id: string;
    codi: string;
    descripcio: string;
    esAmortitzable: boolean;
  };
  registratPer: { id: string; name: string | null; email: string };
};

/**
 * Map a Prisma row (with joins) to the domain type.
 *
 * `import` arrives as Prisma.Decimal; convert to string via `.toString()`
 * to preserve precision without leaking Decimal.js into the domain. The
 * value is safe for an HTML form and for Prisma to re-accept on update.
 */
function toDomain(d: PrismaDespesaWithJoins): DespesaWithRelations {
  return {
    id: d.id,
    dataFactura: d.dataFactura,
    dataPagament: d.dataPagament,
    import: d.import.toString(),
    numFactura: d.numFactura,
    descripcio: d.descripcio,
    tipusDespesaId: d.tipusDespesaId,
    proveidorId: d.proveidorId,
    fitxerKey: d.fitxerKey,
    userId: d.userId,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    proveidor: d.proveidor,
    tipusDespesa: d.tipusDespesa,
    registratPer: d.registratPer,
  };
}

export const despesesRepository = {
  async findAll(
    filters: DespesaListFilters = {},
  ): Promise<DespesaWithRelations[]> {
    const { search, des, fins, proveidorId, tipusDespesaId } = filters;
    const where: Prisma.DespesaWhereInput = {
      ...(search
        ? {
            OR: [
              { numFactura: { contains: search, mode: "insensitive" } },
              { descripcio: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(des || fins
        ? {
            dataFactura: {
              ...(des ? { gte: des } : {}),
              ...(fins ? { lte: fins } : {}),
            },
          }
        : {}),
      ...(proveidorId ? { proveidorId } : {}),
      ...(tipusDespesaId ? { tipusDespesaId } : {}),
    };

    const rows = await prisma.despesa.findMany({
      where,
      include: INCLUDE,
      orderBy: [{ dataFactura: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(toDomain);
  },

  async findById(id: string): Promise<DespesaWithRelations | null> {
    const row = await prisma.despesa.findUnique({
      where: { id },
      include: INCLUDE,
    });
    return row ? toDomain(row) : null;
  },

  async create(
    data: DespesaInput & { userId: string },
  ): Promise<DespesaWithRelations> {
    const row = await prisma.despesa.create({
      data: {
        dataFactura: data.dataFactura,
        dataPagament: data.dataPagament,
        import: data.import,
        numFactura: data.numFactura,
        descripcio: data.descripcio,
        tipusDespesaId: data.tipusDespesaId,
        proveidorId: data.proveidorId,
        userId: data.userId,
      },
      include: INCLUDE,
    });
    return toDomain(row);
  },

  async update(
    id: string,
    data: DespesaInput,
  ): Promise<DespesaWithRelations> {
    const row = await prisma.despesa.update({
      where: { id },
      data: {
        dataFactura: data.dataFactura,
        dataPagament: data.dataPagament,
        import: data.import,
        numFactura: data.numFactura,
        descripcio: data.descripcio,
        tipusDespesaId: data.tipusDespesaId,
        proveidorId: data.proveidorId,
      },
      include: INCLUDE,
    });
    return toDomain(row);
  },

  async delete(id: string): Promise<void> {
    await prisma.despesa.delete({ where: { id } });
  },
};
