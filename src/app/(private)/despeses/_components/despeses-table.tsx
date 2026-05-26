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
import type { DespesaWithRelations } from "@/domain/despesa";
import { formatCurrency, formatDate } from "@/lib/format";

export function DespesesTable({
  despeses,
}: {
  despeses: DespesaWithRelations[];
}) {
  if (despeses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Encara no hi ha cap despesa amb els filtres actuals.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Data
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Núm factura
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Proveïdor
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Tipus
            </TableHead>
            <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Import
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Pagament
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {despeses.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-mono text-xs whitespace-nowrap">
                {formatDate(d.dataFactura)}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {d.numFactura ?? "—"}
              </TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/despeses/${d.id}`}
                  className="hover:underline underline-offset-2"
                >
                  {d.proveidor?.nom ?? "—"}
                </Link>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5">
                  <Badge variant="outline" className="font-mono">
                    {d.tipusDespesa.codi}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {d.tipusDespesa.descripcio}
                  </span>
                </span>
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatCurrency(d.import)}
              </TableCell>
              <TableCell>
                {d.dataPagament ? (
                  <Badge
                    variant="outline"
                    className="border-primary/40 text-primary"
                  >
                    Pagada
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground">
                    Pendent
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/despeses/${d.id}`}
                  aria-label="Veure detall de la despesa"
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ChevronRight className="size-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
