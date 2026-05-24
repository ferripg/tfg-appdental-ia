import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { NotFoundError } from "@/domain/errors";
import { proveidorsService } from "@/services/proveidors-service";
import { ResultToast } from "../_components/result-toast";
import { SetActiuButton } from "../_components/desactivar-button";
import { ProveidorForm } from "../_components/proveidor-form";
import { setActiuAction, updateProveidorAction } from "./actions";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ msg?: string | string[] }>;

export default async function ProveidorDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { msg } = await searchParams;

  let proveidor;
  try {
    proveidor = await proveidorsService.get(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const updateAction = updateProveidorAction.bind(null, id);

  return (
    <div className="space-y-8">
      <ResultToast msg={msg} />

      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/proveidors" className="hover:text-foreground">
            ← Proveïdors
          </Link>
        </p>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-4xl leading-tight md:text-5xl">{proveidor.nom}</h1>
          {proveidor.actiu ? (
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
          NIF · {proveidor.nif}
        </p>
        <p className="text-xs text-muted-foreground">
          {proveidor._count.despeses} despeses i {proveidor._count.inventari}{" "}
          elements d&apos;inventari registrats.
        </p>
      </div>

      <ProveidorForm
        action={updateAction}
        defaults={{
          nif: proveidor.nif,
          nom: proveidor.nom,
          codiBis: proveidor.codiBis ?? "",
          actiu: proveidor.actiu,
          adreca: proveidor.adreca ?? "",
          codiPostal: proveidor.codiPostal ?? "",
          poblacio: proveidor.poblacio ?? "",
          email: proveidor.email ?? "",
          telefon: proveidor.telefon ?? "",
          personaContacte: proveidor.personaContacte ?? "",
          iban: proveidor.iban ?? "",
          notes: proveidor.notes ?? "",
        }}
        submitLabel="Desa els canvis"
        cancelHref="/proveidors"
      />

      <section className="space-y-3 rounded-lg border border-border bg-card/60 p-5">
        <h2 className="text-xl">Estat del proveïdor</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Desactivar el proveïdor el treu dels llistats per defecte però
          manté tot el seu històric de despeses i inventari intacte. Sempre
          pots reactivar-lo més endavant.
        </p>
        <div>
          <SetActiuButton
            id={proveidor.id}
            nom={proveidor.nom}
            actiu={proveidor.actiu}
            action={setActiuAction}
          />
        </div>
      </section>
    </div>
  );
}
