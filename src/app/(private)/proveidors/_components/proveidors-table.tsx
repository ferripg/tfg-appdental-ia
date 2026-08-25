import Link from "next/link";
import { RowActions } from "@/components/app/row-actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProveidorWithCount } from "@/domain/proveidor";
import { setActiuAction } from "../[id]/actions";
import { SetActiuButton } from "./desactivar-button";

export function ProveidorsTable({
  proveidors,
  canEdit,
}: {
  proveidors: ProveidorWithCount[];
  canEdit: boolean;
}) {
  if (proveidors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Encara no hi ha cap proveïdor amb els filtres actuals.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border-t border-foreground">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              NIF
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Nom
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Població
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Contacte
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Estat
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Despeses
            </TableHead>
            <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Accions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proveidors.map((p) => (
            <TableRow key={p.id} data-state={p.actiu ? undefined : "selected"}>
              <TableCell className="font-mono text-xs">{p.nif}</TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/proveidors/${p.id}`}
                  className="hover:underline underline-offset-2"
                >
                  {p.nom}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {p.poblacio ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {p.email ?? p.telefon ?? "—"}
              </TableCell>
              <TableCell>
                {p.actiu ? (
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Actiu
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground">
                    Desactivat
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                {p._count.despeses}
              </TableCell>
              <TableCell className="text-right">
                <RowActions
                  href={`/proveidors/${p.id}`}
                  canEdit={canEdit}
                  label={p.nom}
                >
                  <SetActiuButton
                    compact
                    id={p.id}
                    nom={p.nom}
                    actiu={p.actiu}
                    action={setActiuAction}
                  />
                </RowActions>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
