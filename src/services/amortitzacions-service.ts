import type { EstatAmortitzacions } from "@/domain/amortitzacio";
import { BusinessError } from "@/domain/errors";
import { amortitzacionsRepository } from "@/repositories/amortitzacions-repository";
import { requireSession } from "./auth-service";

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
    await requireSession();
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
    return amortitzacionsRepository.generarExercici(exercici);
  },

  /**
   * Retrocedeix un exercici. Només es permet l'ÚLTIM generat (revertir en
   * ordre invers), per mantenir la coherència de l'acumulat.
   */
  async retrocedir(exercici: number) {
    await requireSession();
    const ultim = await amortitzacionsRepository.maxExerciciGenerat();

    if (ultim === null) {
      throw new BusinessError("No hi ha cap exercici generat per retrocedir.");
    }
    if (exercici !== ultim) {
      throw new BusinessError(
        `Només pots retrocedir l'últim exercici generat (${ultim}).`,
      );
    }
    return amortitzacionsRepository.retrocedirExercici(exercici);
  },
};
