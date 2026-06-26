import { Plus } from "lucide-react";
import Link from "next/link";
import { ResultToast } from "@/components/app/result-toast";
import { Button } from "@/components/ui/button";
import { despesesService } from "@/services/despeses-service";
import { proveidorsService } from "@/services/proveidors-service";
import { tipusDespesaService } from "@/services/tipus-despesa-service";
import { DespesesFilters } from "./_components/despeses-filters";
import { DespesesTable } from "./_components/despeses-table";
import { DESPESES_TOAST_MAP } from "./_components/toast-map";

type SearchParams = Promise<{
  q?: string;
  des?: string;
  fins?: string;
  proveidor?: string;
  tipus?: string;
  min?: string;
  max?: string;
  msg?: string | string[];
}>;

function parseDate(v?: string): Date | undefined {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Normalitza un import del filtre ("123,4" → "123.4") i el valida ≥ 0. */
function parseImport(v?: string): string | undefined {
  if (!v) return undefined;
  const norm = v.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(norm)) return undefined;
  return norm;
}

export default async function DespesesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const search = sp.q?.trim() || undefined;
  const des = parseDate(sp.des);
  const fins = parseDate(sp.fins);
  const proveidorId = sp.proveidor?.trim() || undefined;
  const tipusDespesaId = sp.tipus?.trim() || undefined;
  const importMin = parseImport(sp.min);
  const importMax = parseImport(sp.max);

  const [despeses, tipus, proveidors] = await Promise.all([
    despesesService.list({
      search,
      des,
      fins,
      proveidorId,
      tipusDespesaId,
      importMin,
      importMax,
    }),
    tipusDespesaService.list({ includeInactius: false }),
    proveidorsService.list({ includeInactius: false }),
  ]);

  return (
    <div className="space-y-8">
      <ResultToast msg={sp.msg} map={DESPESES_TOAST_MAP} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Operacions
          </p>
          <h1 className="text-4xl leading-tight md:text-5xl">Despeses</h1>
          <p className="max-w-2xl text-muted-foreground">
            Registre fiscal de despeses. Cada moviment està associat a un
            tipus i, opcionalment, a un proveïdor; les dates de factura i de
            pagament permeten distingir-ne l&apos;estat fiscal.
          </p>
        </div>
        <Button asChild>
          <Link href="/despeses/nou">
            <Plus className="size-4" />
            Nova despesa
          </Link>
        </Button>
      </div>

      <DespesesFilters
        search={search}
        des={sp.des ?? ""}
        fins={sp.fins ?? ""}
        proveidorId={proveidorId}
        tipusDespesaId={tipusDespesaId}
        importMin={sp.min ?? ""}
        importMax={sp.max ?? ""}
        tipus={tipus}
        proveidors={proveidors}
      />

      <DespesesTable despeses={despeses} />
    </div>
  );
}
