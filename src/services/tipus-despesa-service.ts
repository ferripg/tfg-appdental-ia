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

/**
 * Map a Zod issue list to `fieldErrors` keyed by the first path segment.
 *
 * NOTE: duplicated from proveidors-service intentionally. Promotion to a
 * shared `src/services/zod-helpers.ts` will happen at IA-8 (3rd copy).
 * Premature DRY would force a shared shape that may not fit the third
 * CRUD's needs.
 */
function flattenZodErrors(error: unknown): Record<string, string[]> {
  if (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown[] }).issues)
  ) {
    const out: Record<string, string[]> = {};
    for (const issue of (
      error as {
        issues: { path: PropertyKey[]; message: string }[];
      }
    ).issues) {
      const key = issue.path[0] != null ? String(issue.path[0]) : "_form";
      (out[key] ??= []).push(issue.message);
    }
    return out;
  }
  return {};
}

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
