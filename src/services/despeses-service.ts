import { z } from "zod";
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
import { facturesRepository } from "@/repositories/factures-repository";
import { inventariRepository } from "@/repositories/inventari-repository";
import { proveidorsRepository } from "@/repositories/proveidors-repository";
import { tipusDespesaRepository } from "@/repositories/tipus-despesa-repository";
import { auditService } from "./audit-service";
import { requireManager, requireSession } from "./auth-service";
import { flattenZodErrors } from "./zod-helpers";

const MAX_INVOICE_BYTES = 5 * 1024 * 1024; // 5 MB

const invoiceFileSchema = z
  .instanceof(File, { error: "Cal adjuntar un fitxer" })
  .refine((f) => f.size > 0, { error: "El fitxer és buit" })
  .refine((f) => f.size <= MAX_INVOICE_BYTES, {
    error: "El fitxer supera el màxim de 5 MB",
  })
  .refine((f) => f.type === "application/pdf", {
    error: "Només s'admeten fitxers PDF",
  });

function fitxerKeyFor(despesaId: string): string {
  return `despesa-${despesaId}.pdf`;
}

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

    // Despeses amortitzables → es generarà un bé d'inventari, que exigeix
    // proveïdor. Per això el proveïdor passa a ser obligatori en aquest cas.
    if (tipus.esAmortitzable && !data.proveidorId) {
      throw new BusinessError("Falta el proveïdor", {
        proveidorId: [
          "Obligatori en despeses amortitzables (es generarà un bé d'inventari)",
        ],
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

    const created = await despesesRepository.create({
      ...data,
      userId: session.user.id,
    });

    // Generació automàtica de l'inventari: si el tipus és amortitzable, el bé
    // hereta les dades de la despesa (% a 0, a omplir després).
    if (tipus.esAmortitzable) {
      await inventariRepository.createFromDespesa(created.id);
    }

    // Auditoria: alta de despesa (operació financera).
    await auditService.record(session.user.id, "CREATE", {
      entitat: "Despesa",
      entitatId: created.id,
      metadata: { import: created.import, numFactura: created.numFactura },
    });

    return created;
  },

  /**
   * Alta amb factura adjunta opcional en un sol pas. El fitxer es valida
   * ABANS de crear la despesa, perquè un PDF invàlid no deixi una despesa
   * òrfena; en canvi, si la pujada a MinIO falla DESPRÉS de crear, la
   * despesa es conserva sense factura (es pot adjuntar més tard des de la
   * fitxa) — no bloquegem l'alta per un error d'emmagatzematge.
   *
   * Permisos: adjuntar en el moment de l'alta forma part de «crear
   * despeses» (permès a tots els rols via requireSession dins de create);
   * modificar la factura d'una despesa EXISTENT queda per a MANAGER+ via
   * uploadInvoice/deleteInvoice.
   */
  async createAmbFactura(input: unknown, file: unknown) {
    let factura: File | null = null;
    if (file instanceof File && file.size > 0) {
      const parsed = invoiceFileSchema.safeParse(file);
      if (!parsed.success) {
        throw new ValidationError("Hi ha errors al formulari", {
          factura: parsed.error.issues.map((i) => i.message),
        });
      }
      factura = parsed.data;
    }

    const created = await despesesService.create(input);

    if (factura) {
      try {
        const key = fitxerKeyFor(created.id);
        const buffer = Buffer.from(await factura.arrayBuffer());
        await facturesRepository.upload(key, buffer, "application/pdf");
        await despesesRepository.setFitxerKey(created.id, key);
      } catch (err) {
        console.error(
          `[despesesService.createAmbFactura] pujada de la factura de ${created.id} ha fallat:`,
          err,
        );
      }
    }

    return created;
  },

  async update(id: string, input: unknown) {
    const session = await requireManager();
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

    // Sempre llegim el tipus (en necessitem `esAmortitzable`); l'estat actiu
    // només es valida si el tipus ha canviat (evita bloquejar edicions quan
    // un tipus s'ha desactivat retroactivament).
    const tipus = await tipusDespesaRepository.findById(data.tipusDespesaId);
    if (!tipus) {
      throw new BusinessError("Tipus de despesa no vàlid", {
        tipusDespesaId: ["Tipus de despesa no trobat"],
      });
    }
    if (data.tipusDespesaId !== current.tipusDespesaId && !tipus.actiu) {
      throw new BusinessError("Tipus de despesa desactivat", {
        tipusDespesaId: ["Aquest tipus està desactivat"],
      });
    }
    if (tipus.esAmortitzable && !data.proveidorId) {
      throw new BusinessError("Falta el proveïdor", {
        proveidorId: [
          "Obligatori en despeses amortitzables (es generarà un bé d'inventari)",
        ],
      });
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

    const updated = await despesesRepository.update(id, data);

    // Si el tipus és amortitzable i la despesa encara no té bé associat, el
    // generem ara (idempotent: si ja en té, no fa res).
    if (tipus.esAmortitzable) {
      await inventariRepository.createFromDespesa(id);
    }

    // Auditoria: modificació de despesa (operació financera).
    await auditService.record(session.user.id, "UPDATE", {
      entitat: "Despesa",
      entitatId: id,
      metadata: { import: updated.import, numFactura: updated.numFactura },
    });

    return updated;
  },

  async delete(id: string) {
    const session = await requireManager();
    const current = await despesesRepository.findById(id);
    if (!current) throw new NotFoundError("Despesa no trobada");

    // Cascade cleanup: si la despesa té factura adjunta, esborra-la de MinIO
    // ABANS del delete a BD. Si MinIO falla, log i continua (no bloquegem el
    // delete fiscal per un fitxer orfe). Patró equivalent al MAN-11.
    if (current.fitxerKey) {
      try {
        await facturesRepository.remove(current.fitxerKey);
      } catch (err) {
        console.error(
          `[despesesService.delete] cleanup factura ${current.fitxerKey} ha fallat:`,
          err,
        );
      }
    }

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

    // Auditoria: esborrat de despesa (només si el delete ha reeixit; si el
    // catch ha rellançat, no s'arriba aquí). Desem les dades clau per deixar
    // rastre del que s'ha eliminat.
    await auditService.record(session.user.id, "DELETE", {
      entitat: "Despesa",
      entitatId: id,
      metadata: { import: current.import, numFactura: current.numFactura },
    });
  },

  async uploadInvoice(despesaId: string, file: unknown) {
    await requireManager();
    const current = await despesesRepository.findById(despesaId);
    if (!current) throw new NotFoundError("Despesa no trobada");

    const parsed = invoiceFileSchema.safeParse(file);
    if (!parsed.success) {
      throw new ValidationError("Fitxer no vàlid", {
        file: parsed.error.issues.map((i) => i.message),
      });
    }

    const key = fitxerKeyFor(despesaId);
    const buffer = Buffer.from(await parsed.data.arrayBuffer());
    await facturesRepository.upload(key, buffer, "application/pdf");
    await despesesRepository.setFitxerKey(despesaId, key);
  },

  async getInvoiceUrl(despesaId: string): Promise<string | null> {
    await requireSession();
    const current = await despesesRepository.findById(despesaId);
    if (!current) throw new NotFoundError("Despesa no trobada");
    if (!current.fitxerKey) return null;
    return facturesRepository.getDownloadUrl(current.fitxerKey);
  },

  async deleteInvoice(despesaId: string) {
    await requireManager();
    const current = await despesesRepository.findById(despesaId);
    if (!current) throw new NotFoundError("Despesa no trobada");
    if (!current.fitxerKey) return;
    await facturesRepository.remove(current.fitxerKey);
    await despesesRepository.setFitxerKey(despesaId, null);
  },
};
