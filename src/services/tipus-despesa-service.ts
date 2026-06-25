import {
  BusinessError,
  NotFoundError,
  ValidationError,
} from "@/domain/errors";
import {
  type TipusDespesaListFilters,
  tipusDespesaInputSchema,
} from "@/domain/tipus-despesa";
import { inventariRepository } from "@/repositories/inventari-repository";
import { tipusDespesaRepository } from "@/repositories/tipus-despesa-repository";
import { auditService } from "./audit-service";
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
    const session = await requireSession();
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

    const created = await tipusDespesaRepository.create(parsed.data);
    if (created.esAmortitzable) {
      await inventariRepository.generateMissingForTipus(created.id);
    }
    await auditService.record(session.user.id, "CREATE", {
      entitat: "TipusDespesa",
      entitatId: created.id,
      metadata: { codi: created.codi, esAmortitzable: created.esAmortitzable },
    });
    return created;
  },

  async update(id: string, input: unknown) {
    const session = await requireSession();
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

    const updated = await tipusDespesaRepository.update(id, parsed.data);

    // En desar el tipus com a amortitzable, generem retroactivament els béns
    // de les despeses existents d'aquest tipus que encara no en tenen (cobreix
    // tant la transició no→sí com una desada posterior amb béns pendents).
    if (updated.esAmortitzable) {
      await inventariRepository.generateMissingForTipus(id);
    }

    await auditService.record(session.user.id, "UPDATE", {
      entitat: "TipusDespesa",
      entitatId: id,
      metadata: { codi: updated.codi, esAmortitzable: updated.esAmortitzable },
    });

    return updated;
  },

  async setActiu(id: string, actiu: boolean) {
    const session = await requireSession();
    const current = await tipusDespesaRepository.findById(id);
    if (!current) throw new NotFoundError("Tipus de despesa no trobat");
    if (current.actiu === actiu) return current;
    const updated = await tipusDespesaRepository.setActiu(id, actiu);
    await auditService.record(session.user.id, "UPDATE", {
      entitat: "TipusDespesa",
      entitatId: id,
      metadata: { codi: current.codi, actiu },
    });
    return updated;
  },
};
