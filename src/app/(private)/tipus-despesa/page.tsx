import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { tipusDespesaService } from "@/services/tipus-despesa-service";
import { ResultToast } from "./_components/result-toast";
import { TipusDespesaFilters } from "./_components/tipus-despesa-filters";
import { TipusDespesaTable } from "./_components/tipus-despesa-table";

type SearchParams = Promise<{
  q?: string;
  inactius?: string;
  msg?: string | string[];
}>;

export default async function TipusDespesaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, inactius, msg } = await searchParams;
  const search = q?.trim() || undefined;
  const includeInactius = inactius === "1";

  const tipus = await tipusDespesaService.list({ search, includeInactius });

  return (
    <div className="space-y-8">
      <ResultToast msg={msg} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Catàleg
          </p>
          <h1 className="text-4xl leading-tight md:text-5xl">
            Tipus de despesa
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Categories fiscals usades en registrar despeses. El codi és únic
            i serveix per a buscar ràpidament; el grup PGC encaixa amb el
            Pla General Comptable.
          </p>
        </div>
        <Button asChild>
          <Link href="/tipus-despesa/nou">
            <Plus className="size-4" />
            Nou tipus
          </Link>
        </Button>
      </div>

      <TipusDespesaFilters
        search={search}
        includeInactius={includeInactius}
      />

      <TipusDespesaTable tipus={tipus} />
    </div>
  );
}
