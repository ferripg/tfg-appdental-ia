import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultToast } from "@/components/app/result-toast";
import { Badge } from "@/components/ui/badge";
import { NotFoundError } from "@/domain/errors";
import { tipusDespesaService } from "@/services/tipus-despesa-service";
import { SetActiuButton } from "../_components/desactivar-button";
import { TIPUS_DESPESA_TOAST_MAP } from "../_components/toast-map";
import { TipusDespesaForm } from "../_components/tipus-despesa-form";
import { setActiuAction, updateTipusDespesaAction } from "./actions";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ msg?: string | string[] }>;

export default async function TipusDespesaDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { msg } = await searchParams;

  let tipus;
  try {
    tipus = await tipusDespesaService.get(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const updateAction = updateTipusDespesaAction.bind(null, id);

  return (
    <div className="space-y-8">
      <ResultToast msg={msg} map={TIPUS_DESPESA_TOAST_MAP} />

      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/tipus-despesa" className="hover:text-foreground">
            ← Tipus de despesa
          </Link>
        </p>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-4xl leading-tight md:text-5xl">
            {tipus.descripcio}
          </h1>
          {tipus.actiu ? (
            <Badge variant="outline" className="border-primary/40 text-primary">
              Actiu
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground">
              Desactivat
            </Badge>
          )}
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          Codi · {tipus.codi}
          {tipus.grup != null && (
            <>
              {" · "}Grup PGC {tipus.grup}
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {tipus._count.despeses} despeses registrades amb aquest tipus.
        </p>
      </div>

      {tipus.concepte && (
        <section className="space-y-2 rounded-lg border border-border bg-accent/30 p-5">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Concepte
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {tipus.concepte}
          </p>
        </section>
      )}

      <TipusDespesaForm
        action={updateAction}
        defaults={{
          codi: tipus.codi,
          descripcio: tipus.descripcio,
          deduible: tipus.deduible,
          esAmortitzable: tipus.esAmortitzable,
          actiu: tipus.actiu,
          grup: tipus.grup != null ? String(tipus.grup) : "",
          concepte: tipus.concepte ?? "",
        }}
        submitLabel="Desa els canvis"
        cancelHref="/tipus-despesa"
      />

      <section className="space-y-3 rounded-lg border border-border bg-card/60 p-5">
        <h2 className="text-xl">Estat del tipus de despesa</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Desactivar el tipus el treu de les opcions a l&apos;hora de crear
          noves despeses, però manté intactes totes les despeses ja
          registrades. Pots reactivar-lo quan vulguis.
        </p>
        <div>
          <SetActiuButton
            id={tipus.id}
            descripcio={tipus.descripcio}
            actiu={tipus.actiu}
            action={setActiuAction}
          />
        </div>
      </section>
    </div>
  );
}
