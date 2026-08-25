import { Calculator } from "lucide-react";
import Link from "next/link";
import { ResultToast } from "@/components/app/result-toast";
import { Button } from "@/components/ui/button";
import type { EstatInventari } from "@/domain/inventari";
import { potGestionarDomini } from "@/domain/permissions";
import { currentRole } from "@/services/auth-service";
import { inventariService } from "@/services/inventari-service";
import { proveidorsService } from "@/services/proveidors-service";
import { InventariFilters } from "./_components/inventari-filters";
import { InventariTable } from "./_components/inventari-table";
import { INVENTARI_TOAST_MAP } from "./_components/toast-map";

type SearchParams = Promise<{
  q?: string;
  proveidor?: string;
  estat?: string;
  eliminats?: string;
  msg?: string | string[];
}>;

const ESTATS: EstatInventari[] = ["ACTIU", "BAIXA", "ELIMINAT"];

export default async function InventariPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const search = sp.q?.trim() || undefined;
  const proveidorId = sp.proveidor?.trim() || undefined;
  const estat = ESTATS.includes(sp.estat as EstatInventari)
    ? (sp.estat as EstatInventari)
    : undefined;
  const includeEliminats = sp.eliminats === "1";

  const [bens, proveidors] = await Promise.all([
    inventariService.list({ search, proveidorId, estat, includeEliminats }),
    proveidorsService.list({ includeInactius: false }),
  ]);
  const canManage = potGestionarDomini(await currentRole());

  return (
    <div className="space-y-8">
      <ResultToast msg={sp.msg} map={INVENTARI_TOAST_MAP} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Immobilitzat
          </p>
          <h1 className="text-4xl leading-tight md:text-5xl">Inventari</h1>
          <p className="max-w-2xl text-muted-foreground">
            Béns amortitzables de la clínica. Es generen automàticament en
            registrar una despesa d&apos;un tipus marcat com a amortitzable; el
            percentatge d&apos;amortització s&apos;omple després des del detall.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/amortitzacions">
            <Calculator className="size-4" />
            Amortitzacions
          </Link>
        </Button>
      </div>

      <InventariFilters
        search={search}
        proveidorId={proveidorId}
        estat={estat}
        includeEliminats={includeEliminats}
        proveidors={proveidors}
      />

      <InventariTable bens={bens} canEdit={canManage} />
    </div>
  );
}
