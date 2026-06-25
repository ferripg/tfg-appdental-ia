import {
  BusinessError,
  NotFoundError,
  ValidationError,
} from "@/domain/errors";
import {
  type ProveidorListFilters,
  proveidorInputSchema,
} from "@/domain/proveidor";
import { proveidorsRepository } from "@/repositories/proveidors-repository";
import { auditService } from "./audit-service";
import { requireManager, requireSession } from "./auth-service";
import { flattenZodErrors } from "./zod-helpers";

export const proveidorsService = {
  async list(filters: ProveidorListFilters) {
    await requireSession();
    return proveidorsRepository.findAll(filters);
  },

  async get(id: string) {
    await requireSession();
    const proveidor = await proveidorsRepository.findById(id);
    if (!proveidor) throw new NotFoundError("Proveïdor no trobat");
    return proveidor;
  },

  async create(input: unknown) {
    const session = await requireManager();
    const parsed = proveidorInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        "Hi ha errors al formulari",
        flattenZodErrors(parsed.error),
      );
    }

    const existing = await proveidorsRepository.findByNif(parsed.data.nif);
    if (existing) {
      throw new BusinessError("Ja existeix un proveïdor amb aquest NIF", {
        nif: ["Ja existeix un proveïdor amb aquest NIF"],
      });
    }

    const created = await proveidorsRepository.create(parsed.data);
    await auditService.record(session.user.id, "CREATE", {
      entitat: "Proveidor",
      entitatId: created.id,
      metadata: { nom: created.nom, nif: created.nif },
    });
    return created;
  },

  async update(id: string, input: unknown) {
    const session = await requireManager();
    const current = await proveidorsRepository.findById(id);
    if (!current) throw new NotFoundError("Proveïdor no trobat");

    const parsed = proveidorInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        "Hi ha errors al formulari",
        flattenZodErrors(parsed.error),
      );
    }

    // NIF unique check only if it changed.
    if (parsed.data.nif !== current.nif) {
      const dup = await proveidorsRepository.findByNif(parsed.data.nif);
      if (dup) {
        throw new BusinessError("Ja existeix un proveïdor amb aquest NIF", {
          nif: ["Ja existeix un proveïdor amb aquest NIF"],
        });
      }
    }

    const updated = await proveidorsRepository.update(id, parsed.data);
    await auditService.record(session.user.id, "UPDATE", {
      entitat: "Proveidor",
      entitatId: id,
      metadata: { nom: updated.nom, nif: updated.nif },
    });
    return updated;
  },

  async setActiu(id: string, actiu: boolean) {
    const session = await requireManager();
    const current = await proveidorsRepository.findById(id);
    if (!current) throw new NotFoundError("Proveïdor no trobat");
    if (current.actiu === actiu) return current;
    const updated = await proveidorsRepository.setActiu(id, actiu);
    await auditService.record(session.user.id, "UPDATE", {
      entitat: "Proveidor",
      entitatId: id,
      metadata: { nom: current.nom, actiu },
    });
    return updated;
  },
};
