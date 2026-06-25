import Link from "next/link";
import { notFound } from "next/navigation";
import { ModeConsultaBanner } from "@/components/app/mode-consulta-banner";
import { ResultToast } from "@/components/app/result-toast";
import { Badge } from "@/components/ui/badge";
import { NotFoundError } from "@/domain/errors";
import { potGestionarDomini } from "@/domain/permissions";
import { currentRole } from "@/services/auth-service";
import { despesesService } from "@/services/despeses-service";
import { proveidorsService } from "@/services/proveidors-service";
import { tipusDespesaService } from "@/services/tipus-despesa-service";
import { formatCurrency, formatDate } from "@/lib/format";
import { DespesaForm } from "../_components/despesa-form";
import { EliminarDespesaButton } from "../_components/eliminar-button";
import { FacturaSection } from "../_components/factura-section";
import { DESPESES_TOAST_MAP } from "../_components/toast-map";
import {
  deleteDespesaAction,
  deleteInvoiceAction,
  updateDespesaAction,
  uploadInvoiceAction,
} from "./actions";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ msg?: string | string[] }>;

function toDateInput(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function DespesaDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { msg } = await searchParams;

  let despesa;
  try {
    despesa = await despesesService.get(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const [tipus, proveidors, downloadUrl] = await Promise.all([
    tipusDespesaService.list({ includeInactius: false }),
    proveidorsService.list({ includeInactius: false }),
    despesa.fitxerKey ? despesesService.getInvoiceUrl(id) : Promise.resolve(null),
  ]);

  // RBAC: OPERARI consulta en només lectura; MANAGER/ADMIN poden editar.
  const canEdit = potGestionarDomini(await currentRole());

  const updateAction = updateDespesaAction.bind(null, id);
  const uploadAction = uploadInvoiceAction.bind(null, id);
  const removeFactura = deleteInvoiceAction.bind(null, id);

  return (
    <div className="space-y-8">
      <ResultToast msg={msg} map={DESPESES_TOAST_MAP} />

      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/despeses" className="hover:text-foreground">
            ← Despeses
          </Link>
        </p>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-4xl leading-tight md:text-5xl">
            {formatCurrency(despesa.import)}
          </h1>
          {despesa.dataPagament ? (
            <Badge variant="outline" className="border-primary/40 text-primary">
              Pagada · {formatDate(despesa.dataPagament)}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground">
              Pendent de pagament
            </Badge>
          )}
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          {formatDate(despesa.dataFactura)}
          {despesa.numFactura && <> · Factura {despesa.numFactura}</>}
          {" · "}
          <span>{despesa.tipusDespesa.codi}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Registrada per {despesa.registratPer.name || despesa.registratPer.email}{" "}
          el {formatDate(despesa.createdAt)}.
        </p>
      </div>

      {!canEdit && <ModeConsultaBanner />}

      <FacturaSection
        fitxerKey={despesa.fitxerKey}
        downloadUrl={downloadUrl}
        uploadAction={uploadAction}
        deleteAction={removeFactura}
        canEdit={canEdit}
      />

      <DespesaForm
        action={updateAction}
        defaults={{
          dataFactura: toDateInput(despesa.dataFactura),
          dataPagament: toDateInput(despesa.dataPagament),
          import: despesa.import,
          numFactura: despesa.numFactura ?? "",
          descripcio: despesa.descripcio ?? "",
          tipusDespesaId: despesa.tipusDespesaId,
          proveidorId: despesa.proveidorId ?? "",
        }}
        submitLabel="Desa els canvis"
        cancelHref="/despeses"
        tipus={tipus}
        proveidors={proveidors}
        readOnly={!canEdit}
      />

      {canEdit && (
        <section className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="text-xl">Zona perillosa</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Eliminar la despesa la treu permanentment de la base de dades. No
            hi ha forma de recuperar-la. Si la despesa té un element
            d&apos;inventari associat (despeses amortitzables), Prisma
            refusarà l&apos;eliminació.
          </p>
          <div>
            <EliminarDespesaButton
              id={despesa.id}
              label={`${despesa.tipusDespesa.codi} · ${formatCurrency(despesa.import)}`}
              action={deleteDespesaAction}
            />
          </div>
        </section>
      )}
    </div>
  );
}
