import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultToast } from "@/components/app/result-toast";
import { NotFoundError } from "@/domain/errors";
import { valorNet } from "@/domain/amortitzacio";
import { inventariService } from "@/services/inventari-service";
import { proveidorsService } from "@/services/proveidors-service";
import { formatCurrency, formatDate } from "@/lib/format";
import { EstatButtons } from "../_components/estat-buttons";
import { EstatBadge } from "../_components/inventari-table";
import { InventariForm } from "../_components/inventari-form";
import { INVENTARI_TOAST_MAP } from "../_components/toast-map";
import {
  baixaInventariAction,
  eliminarInventariAction,
  reactivarInventariAction,
  updateInventariAction,
} from "./actions";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ msg?: string | string[] }>;

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function InventariDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { msg } = await searchParams;

  let be;
  try {
    be = await inventariService.get(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const proveidors = await proveidorsService.list({ includeInactius: false });
  const locked = be.numAmortitzacions > 0;
  const updateAction = updateInventariAction.bind(null, id);

  return (
    <div className="space-y-8">
      <ResultToast msg={msg} map={INVENTARI_TOAST_MAP} />

      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/inventari" className="hover:text-foreground">
            ← Inventari
          </Link>
        </p>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-mono text-4xl leading-tight md:text-5xl">
            {be.numInventari}
          </h1>
          <EstatBadge estat={be.estat} />
        </div>
        <p className="text-lg">{be.descripcio}</p>
        <p className="font-mono text-sm text-muted-foreground">
          Adquirit el {formatDate(be.dataAdquisicio)} · {be.proveidor.nom}
          {be.despesa && (
            <>
              {" · "}
              <Link
                href={`/despeses/${be.despesa.id}`}
                className="hover:text-foreground hover:underline"
              >
                despesa origen
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Resum label="Import adquisició" value={formatCurrency(be.importAdquisicio)} />
        <Resum
          label="Amortitzat"
          value={formatCurrency(be.importAmortitzat)}
          muted
        />
        <Resum
          label="Valor net"
          value={formatCurrency(valorNet(be.importAdquisicio, be.importAmortitzat))}
        />
        <Resum
          label="Amortitzacions"
          value={`${be.numAmortitzacions} ${be.numAmortitzacions === 1 ? "exercici" : "exercicis"}`}
          muted
        />
      </div>

      <InventariForm
        action={updateAction}
        defaults={{
          descripcio: be.descripcio,
          proveidorId: be.proveidorId,
          numFactura: be.numFactura ?? "",
          dataAdquisicio: toDateInput(be.dataAdquisicio),
          importAdquisicio: be.importAdquisicio,
          percAmortitzacio: be.percAmortitzacio,
        }}
        proveidors={proveidors}
        locked={locked}
      />

      <section className="space-y-3 rounded-lg border border-border bg-card/60 p-5">
        <h2 className="text-xl">Estat del bé</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Un bé de baixa deixa d&apos;amortitzar-se però es conserva a
          l&apos;històric. L&apos;eliminació (lògica) només és per a béns creats
          per error i no és possible si té amortitzacions generades.
        </p>
        <EstatButtons
          id={be.id}
          numInventari={be.numInventari}
          estat={be.estat}
          numAmortitzacions={be.numAmortitzacions}
          baixaAction={baixaInventariAction}
          reactivarAction={reactivarInventariAction}
          eliminarAction={eliminarInventariAction}
        />
      </section>
    </div>
  );
}

function Resum({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-lg tabular-nums ${muted ? "text-muted-foreground" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
