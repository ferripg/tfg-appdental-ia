import {
  agruparPerProveidor,
  type InformeProveidors,
} from "@/domain/informe-proveidors";
import { despesesRepository } from "@/repositories/despeses-repository";
import { requireSession } from "./auth-service";

/**
 * Servei d'informes (IA-21). De moment només l'informe "Despeses per
 * proveïdor". És una CONSULTA: `requireSession` permet TOTS els rols
 * autenticats (OPERARI inclòs), coherent amb el mode consulta d'IA-18 —
 * NO es restringeix a manager/admin.
 */
export const informesService = {
  async despesesPerProveidor(periode: {
    des: Date;
    fins: Date;
  }): Promise<InformeProveidors> {
    await requireSession();
    // Reaprofitem el filtre de despeses per data de factura (gte/lte). Les
    // despeses es desen a mitjanit UTC, així que `lte: fins` ja inclou tot el
    // dia de fi sense ajustaments.
    const despeses = await despesesRepository.findAll({
      des: periode.des,
      fins: periode.fins,
    });
    return agruparPerProveidor(despeses);
  },
};
