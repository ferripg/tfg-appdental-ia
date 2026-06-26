import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserListItem, UserRole } from "@/domain/user";

const ROLE_BADGE: Record<UserRole, { label: string; className: string }> = {
  ADMIN: { label: "Admin", className: "border-primary/40 text-primary" },
  MANAGER: {
    label: "Manager",
    className: "border-amber-500/40 text-amber-600 dark:text-amber-400",
  },
  OPERARI: {
    label: "Operari",
    className: "border-muted-foreground/30 text-muted-foreground",
  },
};

export function UsuarisTable({ users }: { users: UserListItem[] }) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No hi ha cap usuari amb els filtres actuals.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Nom
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Email
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Rol
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Estat
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const badge = ROLE_BADGE[u.role];
            return (
              <TableRow key={u.id} data-state={u.actiu ? undefined : "selected"}>
                <TableCell className="font-medium">
                  <Link
                    href={`/usuaris/${u.id}`}
                    className="hover:underline underline-offset-2"
                  >
                    {u.name ?? <span className="text-muted-foreground">—</span>}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {u.email}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={badge.className}>
                    {badge.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.actiu ? (
                    <Badge
                      variant="outline"
                      className="border-primary/40 text-primary"
                    >
                      Actiu
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">
                      Desactivat
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/usuaris/${u.id}`}
                    aria-label={`Veure detall de ${u.name ?? u.email}`}
                    className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
