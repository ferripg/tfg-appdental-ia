import {
  calcularResumDespeses,
  type ResumDashboard,
} from "@/domain/dashboard";
import { despesesRepository } from "@/repositories/despeses-repository";
import { requireSession } from "./auth-service";

/**
 * Servei del tauler (IA-13). És una visió general de LECTURA: `requireSession`
 * permet tots els rols autenticats. Calcula els indicadors de l'EXERCICI EN
 * CURS reaprofitant el filtre de despeses per data (gte/lte sobre dataFactura).
 */
export const dashboardService = {
  async resum(): Promise<ResumDashboard & { exercici: number }> {
    await requireSession();
    const exercici = new Date().getUTCFullYear();
    const des = new Date(Date.UTC(exercici, 0, 1));
    const fins = new Date(Date.UTC(exercici, 11, 31));
    const despeses = await despesesRepository.findAll({ des, fins });
    return { exercici, ...calcularResumDespeses(despeses) };
  },
};
