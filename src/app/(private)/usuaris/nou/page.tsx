import Link from "next/link";
import { notFound } from "next/navigation";
import { ForbiddenError } from "@/domain/errors";
import { requireAdmin } from "@/services/auth-service";
import {
  EMPTY_USUARI_DEFAULTS,
  UsuariForm,
} from "../_components/usuari-form";
import { createUsuariAction } from "./actions";

export default async function NouUsuariPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof ForbiddenError) notFound();
    throw err;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/usuaris" className="hover:text-foreground">
            ← Usuaris
          </Link>
        </p>
        <h1 className="text-4xl leading-tight md:text-5xl">Nou usuari</h1>
        <p className="max-w-2xl text-muted-foreground">
          Es crearà l&apos;usuari amb la contrasenya temporal que indiquis.
          Comunica-la per un canal segur.
        </p>
      </div>

      <UsuariForm
        mode="create"
        action={createUsuariAction}
        defaults={EMPTY_USUARI_DEFAULTS}
        submitLabel="Crea l'usuari"
        cancelHref="/usuaris"
      />
    </div>
  );
}
