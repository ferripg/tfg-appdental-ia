import {
  type AmortitzacioWithBe,
  calcularQuota,
  restaImports,
  sumaImports,
} from "@/domain/amortitzacio";
import { prisma } from "./prisma-client";

/** Inici (1 de gener UTC) de l'any següent a `exercici`, per filtrar per any. */
function endOfYear(exercici: number): Date {
  return new Date(Date.UTC(exercici + 1, 0, 1));
}

export const amortitzacionsRepository = {
  /** Últim exercici amb amortitzacions generades (null si cap). */
  async maxExerciciGenerat(): Promise<number | null> {
    const r = await prisma.amortitzacio.aggregate({ _max: { exercici: true } });
    return r._max.exercici ?? null;
  },

  /**
   * Any d'adquisició més antic entre els béns ACTIU (= primer exercici
   * amortitzable). Null si no hi ha béns actius.
   */
  async oldestBeYear(): Promise<number | null> {
    const r = await prisma.inventari.aggregate({
      where: { estat: "ACTIU" },
      _min: { dataAdquisicio: true },
    });
    const d = r._min.dataAdquisicio;
    return d ? d.getUTCFullYear() : null;
  },

  /** Resum d'amortitzacions agrupat per exercici (per a la pantalla). */
  async resumPerExercici(): Promise<
    { exercici: number; total: string; count: number }[]
  > {
    const rows = await prisma.amortitzacio.groupBy({
      by: ["exercici"],
      _sum: { import: true },
      _count: { _all: true },
      orderBy: { exercici: "desc" },
    });
    return rows.map((r) => ({
      exercici: r.exercici,
      total: (r._sum.import ?? 0).toString(),
      count: r._count._all,
    }));
  },

  /** Amortitzacions d'un exercici, amb dades del bé, per al detall. */
  async findByExercici(exercici: number): Promise<AmortitzacioWithBe[]> {
    const rows = await prisma.amortitzacio.findMany({
      where: { exercici },
      include: {
        inventari: { select: { numInventari: true, descripcio: true } },
      },
      orderBy: { inventari: { numInventari: "asc" } },
    });
    return rows.map((r) => ({
      inventariId: r.inventariId,
      exercici: r.exercici,
      import: r.import.toString(),
      numInventari: r.inventari.numInventari,
      descripcio: r.inventari.descripcio,
    }));
  },

  /**
   * Genera les amortitzacions d'un exercici (transacció atòmica).
   *
   * Per a cada bé ACTIU adquirit l'any de l'exercici o abans, que no estigui
   * ja amortitzat aquest exercici i que tingui quota > 0, crea la fila
   * d'Amortitzacio i acumula `importAmortitzat` (+ `importUltimaAmort`). El
   * càlcul exacte el fa el domini (`calcularQuota`). Els béns de baixa o
   * eliminats queden fora pel filtre `estat: ACTIU`.
   */
  async generarExercici(
    exercici: number,
  ): Promise<{ bensAmortitzats: number; totalAmortitzat: string }> {
    return prisma.$transaction(async (tx) => {
      const bens = await tx.inventari.findMany({
        where: {
          estat: "ACTIU",
          dataAdquisicio: { lt: endOfYear(exercici) },
          amortitzacions: { none: { exercici } },
        },
        select: {
          id: true,
          importAdquisicio: true,
          percAmortitzacio: true,
          importAmortitzat: true,
        },
      });

      let bensAmortitzats = 0;
      let total = "0.00";
      for (const be of bens) {
        const { quota, nouAmortitzat } = calcularQuota(
          be.importAdquisicio.toString(),
          be.percAmortitzacio.toString(),
          be.importAmortitzat.toString(),
        );
        if (quota === "0.00") continue; // % a 0 o ja totalment amortitzat

        await tx.amortitzacio.create({
          data: { inventariId: be.id, exercici, import: quota },
        });
        await tx.inventari.update({
          where: { id: be.id },
          data: { importAmortitzat: nouAmortitzat, importUltimaAmort: quota },
        });
        bensAmortitzats += 1;
        total = sumaImports(total, quota);
      }
      return { bensAmortitzats, totalAmortitzat: total };
    });
  },

  /**
   * Retrocedeix (reverteix) un exercici: per a cada amortització d'aquell any,
   * resta la quota de `importAmortitzat` del bé i recalcula `importUltimaAmort`
   * a partir de l'amortització anterior que li quedi (o null), i després
   * esborra les files d'aquell exercici. Transacció atòmica.
   */
  async retrocedirExercici(exercici: number): Promise<{ revertits: number }> {
    return prisma.$transaction(async (tx) => {
      const files = await tx.amortitzacio.findMany({
        where: { exercici },
        select: { inventariId: true, import: true },
      });

      for (const fila of files) {
        const be = await tx.inventari.findUnique({
          where: { id: fila.inventariId },
          select: { importAmortitzat: true },
        });
        if (!be) continue;

        const nouAmortitzat = restaImports(
          be.importAmortitzat.toString(),
          fila.import.toString(),
        );

        // L'última amortització passa a ser la de l'exercici anterior que
        // encara queda per a aquest bé (o null si no en queda cap).
        const anterior = await tx.amortitzacio.findFirst({
          where: { inventariId: fila.inventariId, exercici: { lt: exercici } },
          orderBy: { exercici: "desc" },
          select: { import: true },
        });

        await tx.inventari.update({
          where: { id: fila.inventariId },
          data: {
            importAmortitzat: nouAmortitzat,
            importUltimaAmort: anterior ? anterior.import.toString() : null,
          },
        });
      }

      await tx.amortitzacio.deleteMany({ where: { exercici } });
      return { revertits: files.length };
    });
  },
};
