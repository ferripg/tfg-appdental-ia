import { notFound } from "next/navigation";
import { ForbiddenError } from "@/domain/errors";
import { requireManager } from "@/services/auth-service";
import { proveidorsService } from "@/services/proveidors-service";
import { tipusDespesaService } from "@/services/tipus-despesa-service";
import { ImportWizard } from "./_components/import-wizard";

/**
 * Importació de factures amb IA (IA-23).
 *
 * Ruta reservada a MANAGER/ADMIN: la importació pot crear proveïdors i tipus
 * de despesa automàticament, operacions que la matriu de rols (IA-18) reserva
 * a la gestió del domini. Com a /usuaris, la ruta s'amaga amb `notFound()`.
 */
export default async function ImportaFacturesPage() {
  try {
    await requireManager();
  } catch (err) {
    if (err instanceof ForbiddenError) notFound();
    throw err;
  }

  // Catàlegs per als desplegables de la taula de revisió.
  const [tipus, proveidors] = await Promise.all([
    tipusDespesaService.list({ includeInactius: false }),
    proveidorsService.list({ includeInactius: false }),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Operacions · IA
        </p>
        <h1 className="text-4xl leading-tight md:text-5xl">
          Importa factures
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Deixa anar diversos PDF de factures i la IA n&apos;extraurà les
          dades. Revisa i corregeix cada fila abans de confirmar: no es crea
          res sense la teva confirmació.
        </p>
      </div>

      <ImportWizard
        tipus={tipus.map((t) => ({
          id: t.id,
          codi: t.codi,
          descripcio: t.descripcio,
          esAmortitzable: t.esAmortitzable,
        }))}
        proveidors={proveidors.map((p) => ({
          id: p.id,
          nom: p.nom,
          nif: p.nif,
        }))}
      />
    </div>
  );
}
