import type { EstatAmortitzacions } from "@/domain/amortitzacio";
import { BusinessError } from "@/domain/errors";
import { amortitzacionsRepository } from "@/repositories/amortitzacions-repository";
import { auditService } from "./audit-service";
import { requireManager, requireSession } from "./auth-service";

/**
 * Calcula l'estat seqüencial del procés d'amortització:
 * - últim exercici generat (o null),
 * - pròxim exercici generable = últim + 1, o l'any del bé més antic si encara
 *   no se n'ha generat cap (o null si no hi ha béns amortitzables).
 */
async function calcularEstat(): Promise<EstatAmortitzacions> {
  const ultimExercici = await amortitzacionsRepository.maxExerciciGenerat();
  if (ultimExercici !== null) {
    return { ultimExercici, proximExercici: ultimExercici + 1 };
  }
  const oldest = await amortitzacionsRepository.oldestBeYear();
  return { ultimExercici: null, proximExercici: oldest };
}

export const amortitzacionsService = {
  async getEstat() {
    await requireSession();
    return calcularEstat();
  },

  async getResum() {
    await requireSession();
    return amortitzacionsRepository.resumPerExercici();
  },

  async getDetallExercici(exercici: number) {
    await requireSession();
    return amortitzacionsRepository.findByExercici(exercici);
  },

  /**
   * Genera les amortitzacions d'un exercici. Només es permet el PRÒXIM
   * exercici (seqüencial, no es poden saltar anys).
   */
  async generar(exercici: number) {
    const session = await requireManager();
    const { proximExercici } = await calcularEstat();

    if (proximExercici === null) {
      throw new BusinessError(
        "No hi ha béns amortitzables actius: no es pot generar cap exercici.",
      );
    }
    if (exercici !== proximExercici) {
      throw new BusinessError(
        `Només pots generar l'exercici ${proximExercici} (no es poden saltar anys).`,
      );
    }
    const resultat = await amortitzacionsRepository.generarExercici(exercici);

    // Auditoria: generació d'un exercici d'amortitzacions (operació fiscal).
    await auditService.record(session.user.id, "AMORTITZACIONS_GENERATED", {
      entitat: "Amortitzacio",
      entitatId: String(exercici),
      metadata: {
        exercici,
        bensAmortitzats: resultat.bensAmortitzats,
        totalAmortitzat: resultat.totalAmortitzat,
      },
    });

    return resultat;
  },

  /**
   * Retrocedeix un exercici. Només es permet l'ÚLTIM generat (revertir en
   * ordre invers), per mantenir la coherència de l'acumulat.
   */
  async retrocedir(exercici: number) {
    const session = await requireManager();
    const ultim = await amortitzacionsRepository.maxExerciciGenerat();

    if (ultim === null) {
      throw new BusinessError("No hi ha cap exercici generat per retrocedir.");
    }
    if (exercici !== ultim) {
      throw new BusinessError(
        `Només pots retrocedir l'últim exercici generat (${ultim}).`,
      );
    }
    const resultat = await amortitzacionsRepository.retrocedirExercici(exercici);

    // Auditoria: retrocés d'un exercici d'amortitzacions (operació fiscal).
    await auditService.record(session.user.id, "AMORTITZACIONS_RETROCEDIDES", {
      entitat: "Amortitzacio",
      entitatId: String(exercici),
      metadata: { exercici, revertits: resultat.revertits },
    });

    return resultat;
  },
};
