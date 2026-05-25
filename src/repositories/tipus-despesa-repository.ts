import type { TipusDespesa as PrismaTipusDespesa } from "@prisma/client";
import type {
  TipusDespesa,
  TipusDespesaInput,
  TipusDespesaListFilters,
  TipusDespesaWithCount,
} from "@/domain/tipus-despesa";
import { prisma } from "./prisma-client";

/**
 * Map a raw Prisma row into the pure domain type. Keeps `null` (not
 * `undefined`) for optional fields so the rest of the codebase has a
 * single, predictable contract — same convention as proveidors.
 */
function toDomain(t: PrismaTipusDespesa): TipusDespesa {
  return {
    id: t.id,
    codi: t.codi,
    descripcio: t.descripcio,
    deduible: t.deduible,
    esAmortitzable: t.esAmortitzable,
    actiu: t.actiu,
    grup: t.grup,
    concepte: t.concepte,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export const tipusDespesaRepository = {
  async findAll(
    filters: TipusDespesaListFilters = {},
  ): Promise<TipusDespesaWithCount[]> {
    const { search, includeInactius } = filters;
    const rows = await prisma.tipusDespesa.findMany({
      where: {
        ...(includeInactius ? {} : { actiu: true }),
        ...(search
          ? {
              OR: [
                { codi: { contains: search, mode: "insensitive" } },
                { descripcio: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { despeses: true } } },
      orderBy: [{ actiu: "desc" }, { codi: "asc" }],
    });
    return rows.map((r) => ({ ...toDomain(r), _count: r._count }));
  },

  async findById(id: string): Promise<TipusDespesaWithCount | null> {
    const row = await prisma.tipusDespesa.findUnique({
      where: { id },
      include: { _count: { select: { despeses: true } } },
    });
    return row ? { ...toDomain(row), _count: row._count } : null;
  },

  async findByCodi(codi: string): Promise<TipusDespesa | null> {
    const row = await prisma.tipusDespesa.findUnique({ where: { codi } });
    return row ? toDomain(row) : null;
  },

  async create(data: TipusDespesaInput): Promise<TipusDespesa> {
    const row = await prisma.tipusDespesa.create({ data });
    return toDomain(row);
  },

  async update(id: string, data: TipusDespesaInput): Promise<TipusDespesa> {
    const row = await prisma.tipusDespesa.update({ where: { id }, data });
    return toDomain(row);
  },

  async setActiu(id: string, actiu: boolean): Promise<TipusDespesa> {
    const row = await prisma.tipusDespesa.update({
      where: { id },
      data: { actiu },
    });
    return toDomain(row);
  },
};
