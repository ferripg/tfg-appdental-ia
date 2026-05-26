import {
  BusinessError,
  NotFoundError,
  ValidationError,
} from "@/domain/errors";
import {
  type DespesaListFilters,
  despesaInputSchema,
} from "@/domain/despesa";
import { despesesRepository } from "@/repositories/despeses-repository";
import { proveidorsRepository } from "@/repositories/proveidors-repository";
import { tipusDespesaRepository } from "@/repositories/tipus-despesa-repository";
import { requireSession } from "./auth-service";
import { flattenZodErrors } from "./zod-helpers";

export const despesesService = {
  async list(filters: DespesaListFilters) {
    await requireSession();
    return despesesRepository.findAll(filters);
  },

  async get(id: string) {
    await requireSession();
    const despesa = await despesesRepository.findById(id);
    if (!despesa) throw new NotFoundError("Despesa no trobada");
    return despesa;
  },

  async create(input: unknown) {
    const session = await requireSession();
    const parsed = despesaInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        "Hi ha errors al formulari",
        flattenZodErrors(parsed.error),
      );
    }
    const data = parsed.data;

    // Business rule: pagament posterior o igual a la factura.
    if (data.dataPagament && data.dataPagament < data.dataFactura) {
      throw new ValidationError("Hi ha errors al formulari", {
        dataPagament: [
          "La data de pagament ha de ser igual o posterior a la data de factura",
        ],
      });
    }

    // FK existence + active (tipus obligatori).
    const tipus = await tipusDespesaRepository.findById(data.tipusDespesaId);
    if (!tipus) {
      throw new BusinessError("Tipus de despesa no vàlid", {
        tipusDespesaId: ["Tipus de despesa no trobat"],
      });
    }
    if (!tipus.actiu) {
      throw new BusinessError("Tipus de despesa desactivat", {
        tipusDespesaId: ["Aquest tipus està desactivat"],
      });
    }

    if (data.proveidorId) {
      const prov = await proveidorsRepository.findById(data.proveidorId);
      if (!prov) {
        throw new BusinessError("Proveïdor no vàlid", {
          proveidorId: ["Proveïdor no trobat"],
        });
      }
      if (!prov.actiu) {
        throw new BusinessError("Proveïdor desactivat", {
          proveidorId: ["Aquest proveïdor està desactivat"],
        });
      }
    }

    return despesesRepository.create({ ...data, userId: session.user.id });
  },

  async update(id: string, input: unknown) {
    await requireSession();
    const current = await despesesRepository.findById(id);
    if (!current) throw new NotFoundError("Despesa no trobada");

    const parsed = despesaInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        "Hi ha errors al formulari",
        flattenZodErrors(parsed.error),
      );
    }
    const data = parsed.data;

    if (data.dataPagament && data.dataPagament < data.dataFactura) {
      throw new ValidationError("Hi ha errors al formulari", {
        dataPagament: [
          "La data de pagament ha de ser igual o posterior a la data de factura",
        ],
      });
    }

    // FK checks only if changed (evita reaccions a desactivacions retroactives
    // sobre despeses ja existents).
    if (data.tipusDespesaId !== current.tipusDespesaId) {
      const tipus = await tipusDespesaRepository.findById(data.tipusDespesaId);
      if (!tipus) {
        throw new BusinessError("Tipus de despesa no vàlid", {
          tipusDespesaId: ["Tipus de despesa no trobat"],
        });
      }
      if (!tipus.actiu) {
        throw new BusinessError("Tipus de despesa desactivat", {
          tipusDespesaId: ["Aquest tipus està desactivat"],
        });
      }
    }
    if (data.proveidorId && data.proveidorId !== current.proveidorId) {
      const prov = await proveidorsRepository.findById(data.proveidorId);
      if (!prov) {
        throw new BusinessError("Proveïdor no vàlid", {
          proveidorId: ["Proveïdor no trobat"],
        });
      }
      if (!prov.actiu) {
        throw new BusinessError("Proveïdor desactivat", {
          proveidorId: ["Aquest proveïdor està desactivat"],
        });
      }
    }

    return despesesRepository.update(id, data);
  },

  async delete(id: string) {
    await requireSession();
    const current = await despesesRepository.findById(id);
    if (!current) throw new NotFoundError("Despesa no trobada");
    try {
      await despesesRepository.delete(id);
    } catch (err) {
      // Prisma P2003: foreign key constraint failed (Inventari associat).
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: unknown }).code === "P2003"
      ) {
        throw new BusinessError(
          "No es pot eliminar: aquesta despesa té un element d'inventari associat",
        );
      }
      throw err;
    }
  },
};
