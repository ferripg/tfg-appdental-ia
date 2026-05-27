import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultToast } from "@/components/app/result-toast";
import { Button } from "@/components/ui/button";
import { ForbiddenError } from "@/domain/errors";
import { USER_ROLES, type UserRole } from "@/domain/user";
import { usersService } from "@/services/users-service";
import { UsuarisFilters } from "./_components/usuaris-filters";
import { UsuarisTable } from "./_components/usuaris-table";
import { USUARIS_TOAST_MAP } from "./_components/toast-map";

type SearchParams = Promise<{
  q?: string;
  role?: string;
  inactius?: string;
  msg?: string | string[];
}>;

function parseRole(value: string | undefined): UserRole | undefined {
  if (!value) return undefined;
  return (USER_ROLES as readonly string[]).includes(value)
    ? (value as UserRole)
    : undefined;
}

export default async function UsuarisPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, role, inactius, msg } = await searchParams;
  const search = q?.trim() || undefined;
  const includeInactius = inactius === "1";
  const roleFilter = parseRole(role);

  let users;
  try {
    users = await usersService.list({
      search,
      role: roleFilter,
      includeInactius,
    });
  } catch (err) {
    // Hide the route from non-admins: pretend it doesn't exist.
    if (err instanceof ForbiddenError) notFound();
    throw err;
  }

  return (
    <div className="space-y-8">
      <ResultToast msg={msg} map={USUARIS_TOAST_MAP} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Administració
          </p>
          <h1 className="text-4xl leading-tight md:text-5xl">Usuaris</h1>
          <p className="max-w-2xl text-muted-foreground">
            Gestiona qui pot accedir a l&apos;aplicació i amb quin rol. Els
            usuaris desactivats no poden iniciar sessió però mantenen
            l&apos;històric.
          </p>
        </div>
        <Button asChild>
          <Link href="/usuaris/nou">
            <Plus className="size-4" />
            Nou usuari
          </Link>
        </Button>
      </div>

      <UsuarisFilters
        search={search}
        role={roleFilter}
        includeInactius={includeInactius}
      />

      <UsuarisTable users={users} />
    </div>
  );
}
