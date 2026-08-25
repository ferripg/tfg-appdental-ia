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
import { valorNet } from "@/domain/amortitzacio";
import type { EstatInventari, InventariWithRelations } from "@/domain/inventari";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  baixaInventariAction,
  eliminarInventariAction,
  reactivarInventariAction,
} from "../[id]/actions";
import { EstatButtons } from "./estat-buttons";

export function EstatBadge({ estat }: { estat: EstatInventari }) {
  if (estat === "ACTIU") {
    return (
      <Badge variant="outline" className="border-primary/40 text-primary">
        Actiu
      </Badge>
    );
  }
  if (estat === "BAIXA") {
    return (
      <Badge variant="secondary" className="text-muted-foreground">
        De baixa
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-destructive/40 text-destructive">
      Eliminat
    </Badge>
  );
}

export function InventariTable({
  bens,
  canEdit,
}: {
  bens: InventariWithRelations[];
  canEdit: boolean;
}) {
  if (bens.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Encara no hi ha cap bé d&apos;inventari amb els filtres actuals. Els
          béns es generen automàticament en registrar despeses d&apos;un tipus
          amortitzable.
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
              Núm
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Descripció
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Adquisició
            </TableHead>
            <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Import
            </TableHead>
            <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Amortitzat
            </TableHead>
            <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Valor net
            </TableHead>
            <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              %
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Estat
            </TableHead>
            <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Accions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bens.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-mono text-xs whitespace-nowrap">
                <Link
                  href={`/inventari/${b.id}`}
                  className="hover:underline underline-offset-2"
                >
                  {b.numInventari}
                </Link>
              </TableCell>
              <TableCell className="font-medium">
                {b.descripcio}
                <span className="block text-xs text-muted-foreground">
                  {b.proveidor.nom}
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs whitespace-nowrap">
                {formatDate(b.dataAdquisicio)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatCurrency(b.importAdquisicio)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                {formatCurrency(b.importAmortitzat)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatCurrency(valorNet(b.importAdquisicio, b.importAmortitzat))}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                {Number(b.percAmortitzacio)}%
              </TableCell>
              <TableCell>
                <EstatBadge estat={b.estat} />
              </TableCell>
              <TableCell className="text-right">
                <RowActions
                  href={`/inventari/${b.id}`}
                  canEdit={canEdit}
                  label={b.numInventari}
                >
                  <EstatButtons
                    compact
                    id={b.id}
                    numInventari={b.numInventari}
                    estat={b.estat}
                    numAmortitzacions={b.numAmortitzacions}
                    baixaAction={baixaInventariAction}
                    reactivarAction={reactivarInventariAction}
                    eliminarAction={eliminarInventariAction}
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
