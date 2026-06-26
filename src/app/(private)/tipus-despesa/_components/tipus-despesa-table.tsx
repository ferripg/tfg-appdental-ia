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
import { nomGrupPGC } from "@/domain/pgc";
import type { TipusDespesaWithCount } from "@/domain/tipus-despesa";

function YesNoBadge({ value }: { value: boolean }) {
  return value ? (
    <Badge variant="outline" className="border-primary/40 text-primary">
      Sí
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground">
      No
    </Badge>
  );
}

export function TipusDespesaTable({
  tipus,
}: {
  tipus: TipusDespesaWithCount[];
}) {
  if (tipus.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Encara no hi ha cap tipus de despesa amb els filtres actuals.
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
              Codi
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Descripció
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Grup
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Deduïble
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Amortitzable
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Estat
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Despeses
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tipus.map((t) => (
            <TableRow key={t.id} data-state={t.actiu ? undefined : "selected"}>
              <TableCell className="font-mono text-xs">{t.codi}</TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/tipus-despesa/${t.id}`}
                  className="hover:underline underline-offset-2"
                >
                  {t.descripcio}
                </Link>
              </TableCell>
              <TableCell
                className="font-mono text-xs text-muted-foreground"
                title={nomGrupPGC(t.grup) ?? undefined}
              >
                {t.grup ?? "—"}
              </TableCell>
              <TableCell>
                <YesNoBadge value={t.deduible} />
              </TableCell>
              <TableCell>
                <YesNoBadge value={t.esAmortitzable} />
              </TableCell>
              <TableCell>
                {t.actiu ? (
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
                {t._count.despeses}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/tipus-despesa/${t.id}`}
                  aria-label={`Veure detall de ${t.descripcio}`}
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
