import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultToast } from "@/components/app/result-toast";
import { Badge } from "@/components/ui/badge";
import { ForbiddenError, NotFoundError } from "@/domain/errors";
import { requireAdmin } from "@/services/auth-service";
import { usersService } from "@/services/users-service";
import { UsuariForm } from "../_components/usuari-form";
import { USUARIS_TOAST_MAP } from "../_components/toast-map";
import { updateUsuariAction } from "./actions";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ msg?: string | string[] }>;

export default async function UsuariDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { msg } = await searchParams;

  // Read the current admin session before loading the target — needed to
  // detect self-edit and disable the controls (the service refuses the
  // operation anyway, but disabling avoids a useless round-trip).
  let session;
  try {
    session = await requireAdmin();
  } catch (err) {
    if (err instanceof ForbiddenError) notFound();
    throw err;
  }

  let user;
  try {
    user = await usersService.get(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const isSelf = session.user.id === user.id;
  const updateAction = updateUsuariAction.bind(null, id);

  return (
    <div className="space-y-8">
      <ResultToast msg={msg} map={USUARIS_TOAST_MAP} />

      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/usuaris" className="hover:text-foreground">
            ← Usuaris
          </Link>
        </p>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-4xl leading-tight md:text-5xl">
            {user.name ?? user.email}
          </h1>
          {user.actiu ? (
            <Badge variant="outline" className="border-primary/40 text-primary">
              Actiu
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground">
              Desactivat
            </Badge>
          )}
          {isSelf && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Tu mateix
            </Badge>
          )}
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          {user.email} · Rol actual <strong>{user.role}</strong>
          {user.lastLoginAt
            ? ` · Últim accés ${user.lastLoginAt.toLocaleDateString("ca-ES")}`
            : " · Encara no ha iniciat sessió"}
        </p>
      </div>

      <UsuariForm
        mode="edit"
        action={updateAction}
        defaults={{
          name: user.name ?? "",
          email: user.email,
          role: user.role,
          actiu: user.actiu,
        }}
        roleEditable={!isSelf}
        actiuEditable={!isSelf}
        submitLabel="Desa els canvis"
        cancelHref="/usuaris"
      />
    </div>
  );
}
