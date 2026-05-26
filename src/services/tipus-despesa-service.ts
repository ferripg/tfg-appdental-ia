import {
  BusinessError,
  NotFoundError,
  ValidationError,
} from "@/domain/errors";
import {
  type TipusDespesaListFilters,
  tipusDespesaInputSchema,
} from "@/domain/tipus-despesa";
import { tipusDespesaRepository } from "@/repositories/tipus-despesa-repository";
import { requireSession } from "./auth-service";
import { flattenZodErrors } from "./zod-helpers";

export const tipusDespesaService = {
  async list(filters: TipusDespesaListFilters) {
    await requireSession();
    return tipusDespesaRepository.findAll(filters);
  },

  async get(id: string) {
    await requireSession();
    const tipusDespesa = await tipusDespesaRepository.findById(id);
    if (!tipusDespesa) throw new NotFoundError("Tipus de despesa no trobat");
    return tipusDespesa;
  },

  async create(input: unknown) {
    await requireSession();
    const parsed = tipusDespesaInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        "Hi ha errors al formulari",
        flattenZodErrors(parsed.error),
      );
    }

    const existing = await tipusDespesaRepository.findByCodi(parsed.data.codi);
    if (existing) {
      throw new BusinessError("Ja existeix un tipus amb aquest codi", {
        codi: ["Ja existeix un tipus amb aquest codi"],
      });
    }

    return tipusDespesaRepository.create(parsed.data);
  },

  async update(id: string, input: unknown) {
    await requireSession();
    const current = await tipusDespesaRepository.findById(id);
    if (!current) throw new NotFoundError("Tipus de despesa no trobat");

    const parsed = tipusDespesaInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        "Hi ha errors al formulari",
        flattenZodErrors(parsed.error),
      );
    }

    // Codi unique check only if it changed.
    if (parsed.data.codi !== current.codi) {
      const dup = await tipusDespesaRepository.findByCodi(parsed.data.codi);
      if (dup) {
        throw new BusinessError("Ja existeix un tipus amb aquest codi", {
          codi: ["Ja existeix un tipus amb aquest codi"],
        });
      }
    }

    return tipusDespesaRepository.update(id, parsed.data);
  },

  async setActiu(id: string, actiu: boolean) {
    await requireSession();
    const current = await tipusDespesaRepository.findById(id);
    if (!current) throw new NotFoundError("Tipus de despesa no trobat");
    if (current.actiu === actiu) return current;
    return tipusDespesaRepository.setActiu(id, actiu);
  },
};
