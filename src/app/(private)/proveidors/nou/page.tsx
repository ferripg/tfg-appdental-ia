import Link from "next/link";
import { notFound } from "next/navigation";
import { potGestionarDomini } from "@/domain/permissions";
import { currentRole } from "@/services/auth-service";
import {
  EMPTY_PROVEIDOR_DEFAULTS,
  ProveidorForm,
} from "../_components/proveidor-form";
import { createProveidorAction } from "./actions";

export default async function NouProveidorPage() {
  // RBAC: crear catàlegs és cosa de MANAGER/ADMIN. Amaguem la ruta a OPERARI.
  if (!potGestionarDomini(await currentRole())) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/proveidors" className="hover:text-foreground">
            ← Proveïdors
          </Link>
        </p>
        <h1 className="text-4xl leading-tight md:text-5xl">Nou proveïdor</h1>
        <p className="max-w-2xl text-muted-foreground">
          Introdueix la informació fiscal i de contacte. Només el NIF i el
          nom són obligatoris.
        </p>
      </div>

      <ProveidorForm
        action={createProveidorAction}
        defaults={EMPTY_PROVEIDOR_DEFAULTS}
        submitLabel="Crea el proveïdor"
        cancelHref="/proveidors"
      />
    </div>
  );
}
