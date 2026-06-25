import {
  BusinessError,
  NotFoundError,
  ValidationError,
} from "@/domain/errors";
import {
  type InventariListFilters,
  inventariEditSchema,
} from "@/domain/inventari";
import { inventariRepository } from "@/repositories/inventari-repository";
import { proveidorsRepository } from "@/repositories/proveidors-repository";
import { auditService } from "./audit-service";
import { requireSession } from "./auth-service";
import { flattenZodErrors } from "./zod-helpers";

export const inventariService = {
  async list(filters: InventariListFilters) {
    await requireSession();
    return inventariRepository.findAll(filters);
  },

  async get(id: string) {
    await requireSession();
    const be = await inventariRepository.findById(id);
    if (!be) throw new NotFoundError("Bé d'inventari no trobat");
    return be;
  },

  /**
   * Edició d'un bé. Els béns no es creen a mà (es generen des de les
   * despeses amortitzables), però sí que es poden editar.
   *
   * Integritat comptable: si el bé JA té amortitzacions generades, import,
   * percentatge i data d'adquisició queden bloquejats (modificar-los
   * desquadraria els càlculs ja fets); només es poden tocar descripció,
   * proveïdor i número de factura. Si no té amortitzacions, tot és editable.
   */
  async update(id: string, input: unknown) {
    const session = await requireSession();
    const current = await inventariRepository.findById(id);
    if (!current) throw new NotFoundError("Bé d'inventari no trobat");
    if (current.estat === "ELIMINAT") {
      throw new BusinessError("No pots editar un bé eliminat");
    }

    const parsed = inventariEditSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        "Hi ha errors al formulari",
        flattenZodErrors(parsed.error),
      );
    }
    const data = parsed.data;

    // FK: proveïdor existent i actiu (obligatori).
    const prov = await proveidorsRepository.findById(data.proveidorId);
    if (!prov) {
      throw new BusinessError("Proveïdor no vàlid", {
        proveidorId: ["Proveïdor no trobat"],
      });
    }
    if (!prov.actiu && data.proveidorId !== current.proveidorId) {
      throw new BusinessError("Proveïdor desactivat", {
        proveidorId: ["Aquest proveïdor està desactivat"],
      });
    }

    if (current.numAmortitzacions > 0) {
      const importCanviat =
        Number(data.importAdquisicio) !== Number(current.importAdquisicio);
      const percCanviat =
        Number(data.percAmortitzacio) !== Number(current.percAmortitzacio);
      const dataCanviada =
        data.dataAdquisicio.getTime() !== current.dataAdquisicio.getTime();

      if (importCanviat || percCanviat || dataCanviada) {
        throw new BusinessError(
          "Aquest bé ja té amortitzacions generades: no en pots canviar l'import, el percentatge ni la data. Retrocedeix les amortitzacions primer.",
          {
            ...(importCanviat
              ? { importAdquisicio: ["Bloquejat: hi ha amortitzacions"] }
              : {}),
            ...(percCanviat
              ? { percAmortitzacio: ["Bloquejat: hi ha amortitzacions"] }
              : {}),
            ...(dataCanviada
              ? { dataAdquisicio: ["Bloquejat: hi ha amortitzacions"] }
              : {}),
          },
        );
      }
      const actualitzat = await inventariRepository.updateSafeFields(id, {
        descripcio: data.descripcio,
        proveidorId: data.proveidorId,
        numFactura: data.numFactura,
      });
      await auditService.record(session.user.id, "UPDATE", {
        entitat: "Inventari",
        entitatId: id,
        metadata: { num: current.numInventari, camps: "segurs" },
      });
      return actualitzat;
    }

    const actualitzat = await inventariRepository.update(id, data);
    await auditService.record(session.user.id, "UPDATE", {
      entitat: "Inventari",
      entitatId: id,
      metadata: { num: current.numInventari },
    });
    return actualitzat;
  },

  /** Dona de baixa un bé (deixa d'amortitzar). Registra l'any de baixa. */
  async baixa(id: string) {
    const session = await requireSession();
    const current = await inventariRepository.findById(id);
    if (!current) throw new NotFoundError("Bé d'inventari no trobat");
    if (current.estat === "ELIMINAT") {
      throw new BusinessError("Un bé eliminat no es pot donar de baixa");
    }
    if (current.estat === "BAIXA") return current;
    const anyBaixa = new Date().getUTCFullYear();
    const actualitzat = await inventariRepository.setEstat(id, "BAIXA", anyBaixa);
    await auditService.record(session.user.id, "UPDATE", {
      entitat: "Inventari",
      entitatId: id,
      metadata: { num: current.numInventari, estat: "BAIXA", anyBaixa },
    });
    return actualitzat;
  },

  /** Reverteix una baixa: el bé torna a estar actiu i amortitzable. */
  async reactivar(id: string) {
    const session = await requireSession();
    const current = await inventariRepository.findById(id);
    if (!current) throw new NotFoundError("Bé d'inventari no trobat");
    if (current.estat !== "BAIXA") return current;
    const actualitzat = await inventariRepository.setEstat(id, "ACTIU", null);
    await auditService.record(session.user.id, "UPDATE", {
      entitat: "Inventari",
      entitatId: id,
      metadata: { num: current.numInventari, estat: "ACTIU" },
    });
    return actualitzat;
  },

  /**
   * Eliminació (lògica, estat ELIMINAT) per a béns creats per error. Es
   * bloqueja si el bé té amortitzacions: en aquest cas no era un error i
   * cal retrocedir-les abans, per no deixar amortitzacions òrfenes als
   * informes d'exercicis.
   */
  async eliminar(id: string) {
    const session = await requireSession();
    const current = await inventariRepository.findById(id);
    if (!current) throw new NotFoundError("Bé d'inventari no trobat");
    if (current.estat === "ELIMINAT") return current;
    if (current.numAmortitzacions > 0) {
      throw new BusinessError(
        "Aquest bé té amortitzacions generades; retrocedeix-les abans d'eliminar-lo.",
      );
    }
    const actualitzat = await inventariRepository.setEstat(
      id,
      "ELIMINAT",
      current.anyBaixa,
    );
    await auditService.record(session.user.id, "DELETE", {
      entitat: "Inventari",
      entitatId: id,
      metadata: { num: current.numInventari },
    });
    return actualitzat;
  },
};
