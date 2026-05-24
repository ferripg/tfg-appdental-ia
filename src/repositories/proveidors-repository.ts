import type { Proveidor as PrismaProveidor } from "@prisma/client";
import type {
  Proveidor,
  ProveidorInput,
  ProveidorListFilters,
  ProveidorWithCount,
} from "@/domain/proveidor";
import { prisma } from "./prisma-client";

/**
 * Map a raw Prisma row into the pure domain type.
 *
 * Keeps `null` (not `undefined`) for optional fields so the rest of the
 * codebase has a single, predictable contract.
 */
function toDomain(p: PrismaProveidor): Proveidor {
  return {
    id: p.id,
    nif: p.nif,
    nom: p.nom,
    codiBis: p.codiBis,
    actiu: p.actiu,
    adreca: p.adreca,
    codiPostal: p.codiPostal,
    poblacio: p.poblacio,
    email: p.email,
    telefon: p.telefon,
    personaContacte: p.personaContacte,
    iban: p.iban,
    notes: p.notes,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export const proveidorsRepository = {
  async findAll(
    filters: ProveidorListFilters = {},
  ): Promise<ProveidorWithCount[]> {
    const { search, includeInactius } = filters;
    const rows = await prisma.proveidor.findMany({
      where: {
        ...(includeInactius ? {} : { actiu: true }),
        ...(search
          ? {
              OR: [
                { nom: { contains: search, mode: "insensitive" } },
                { nif: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { despeses: true, inventari: true } } },
      orderBy: [{ actiu: "desc" }, { nom: "asc" }],
    });
    return rows.map((r) => ({ ...toDomain(r), _count: r._count }));
  },

  async findById(id: string): Promise<ProveidorWithCount | null> {
    const row = await prisma.proveidor.findUnique({
      where: { id },
      include: { _count: { select: { despeses: true, inventari: true } } },
    });
    return row ? { ...toDomain(row), _count: row._count } : null;
  },

  async findByNif(nif: string): Promise<Proveidor | null> {
    const row = await prisma.proveidor.findUnique({ where: { nif } });
    return row ? toDomain(row) : null;
  },

  async create(data: ProveidorInput): Promise<Proveidor> {
    const row = await prisma.proveidor.create({ data });
    return toDomain(row);
  },

  async update(id: string, data: ProveidorInput): Promise<Proveidor> {
    const row = await prisma.proveidor.update({ where: { id }, data });
    return toDomain(row);
  },

  async setActiu(id: string, actiu: boolean): Promise<Proveidor> {
    const row = await prisma.proveidor.update({
      where: { id },
      data: { actiu },
    });
    return toDomain(row);
  },
};
