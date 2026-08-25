import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModeConsultaBanner } from "@/components/app/mode-consulta-banner";
import { ResultToast } from "@/components/app/result-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotFoundError } from "@/domain/errors";
import { potGestionarDomini } from "@/domain/permissions";
import { currentRole } from "@/services/auth-service";
import { proveidorsService } from "@/services/proveidors-service";
import { ProveidorForm } from "../_components/proveidor-form";
import { PROVEIDORS_TOAST_MAP } from "../_components/toast-map";
import { updateProveidorAction } from "./actions";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ msg?: string | string[]; mode?: string }>;

export default async function ProveidorDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { msg, mode } = await searchParams;

  let proveidor;
  try {
    proveidor = await proveidorsService.get(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  // RBAC: OPERARI consulta en només lectura; MANAGER/ADMIN poden editar.
  // La fitxa s'obre sempre en mode consulta; l'edició és un pas explícit
  // (?mode=edita) via el botó «Edita», mai l'estat per defecte.
  const canEdit = potGestionarDomini(await currentRole());
  const editant = canEdit && mode === "edita";
  const updateAction = updateProveidorAction.bind(null, id);

  return (
    <div className="space-y-8">
      <ResultToast msg={msg} map={PROVEIDORS_TOAST_MAP} />

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
          {canEdit && !editant && (
            <Button asChild className="ms-auto">
              <Link href={`/proveidors/${proveidor.id}?mode=edita`}>
                <Pencil className="size-4" />
                Edita
              </Link>
            </Button>
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

      {!canEdit && <ModeConsultaBanner />}

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
        cancelHref={editant ? `/proveidors/${proveidor.id}` : "/proveidors"}
        readOnly={!editant}
      />
    </div>
  );
}
