import { Plus } from "lucide-react";
import Link from "next/link";
import { ResultToast } from "@/components/app/result-toast";
import { Button } from "@/components/ui/button";
import { potGestionarDomini } from "@/domain/permissions";
import { currentRole } from "@/services/auth-service";
import { proveidorsService } from "@/services/proveidors-service";
import { ProveidorsFilters } from "./_components/proveidors-filters";
import { ProveidorsTable } from "./_components/proveidors-table";
import { PROVEIDORS_TOAST_MAP } from "./_components/toast-map";

type SearchParams = Promise<{
  q?: string;
  inactius?: string;
  msg?: string | string[];
}>;

export default async function ProveidorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, inactius, msg } = await searchParams;
  const search = q?.trim() || undefined;
  const includeInactius = inactius === "1";

  const proveidors = await proveidorsService.list({ search, includeInactius });
  const canManage = potGestionarDomini(await currentRole());

  return (
    <div className="space-y-8">
      <ResultToast msg={msg} map={PROVEIDORS_TOAST_MAP} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Catàleg
          </p>
          <h1 className="text-4xl leading-tight md:text-5xl">Proveïdors</h1>
          <p className="max-w-2xl text-muted-foreground">
            Mestre de proveïdors usat per despeses i inventari. Mantén
            l&apos;NIF únic i informa l&apos;IBAN si vols emetre
            transferències.
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/proveidors/nou">
              <Plus className="size-4" />
              Nou proveïdor
            </Link>
          </Button>
        )}
      </div>

      <ProveidorsFilters search={search} includeInactius={includeInactius} />

      <ProveidorsTable proveidors={proveidors} />
    </div>
  );
}
