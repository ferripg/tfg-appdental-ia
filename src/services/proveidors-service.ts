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
import { requireSession } from "./auth-service";

/** Map a Zod flattened error to fieldErrors with at least one message per field. */
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
    await requireSession();
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

    return proveidorsRepository.create(parsed.data);
  },

  async update(id: string, input: unknown) {
    await requireSession();
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

    return proveidorsRepository.update(id, parsed.data);
  },

  async setActiu(id: string, actiu: boolean) {
    await requireSession();
    const current = await proveidorsRepository.findById(id);
    if (!current) throw new NotFoundError("Proveïdor no trobat");
    if (current.actiu === actiu) return current;
    return proveidorsRepository.setActiu(id, actiu);
  },
};
