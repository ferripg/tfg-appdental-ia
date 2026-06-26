import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { informesService } from "@/services/informes-service";
import { formatCurrency, formatDate } from "@/lib/format";
import { InformeFilters } from "./_components/informe-filters";

type SearchParams = Promise<{ des?: string; fins?: string }>;

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export default async function InformesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  // Període obligatori: per defecte, l'any en curs (1 gen – 31 des).
  const year = new Date().getUTCFullYear();
  const desStr = sp.des && YMD.test(sp.des) ? sp.des : `${year}-01-01`;
  const finsStr = sp.fins && YMD.test(sp.fins) ? sp.fins : `${year}-12-31`;
  const des = new Date(`${desStr}T00:00:00Z`);
  const fins = new Date(`${finsStr}T00:00:00Z`);

  const informe = await informesService.despesesPerProveidor({ des, fins });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Informes
        </p>
        <h1 className="text-4xl leading-tight md:text-5xl">
          Despeses per proveïdor
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Despeses del període agrupades per proveïdor, amb el detall de cada
          factura i el subtotal de cada proveïdor. Pots exportar-ho a PDF.
        </p>
      </div>

      <InformeFilters des={desStr} fins={finsStr} />

      {informe.grups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No hi ha cap despesa registrada entre el {formatDate(des)} i el{" "}
            {formatDate(fins)}.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {informe.grups.map((grup) => (
            <section
              key={grup.proveidorId ?? "sense"}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-foreground/20 pb-1.5">
                <h2 className="text-xl">{grup.proveidorNom}</h2>
                {grup.proveidorNif ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    NIF · {grup.proveidorNif}
                  </span>
                ) : null}
              </div>

              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        Data
                      </TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        Núm. factura
                      </TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        Concepte
                      </TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        Tipus
                      </TableHead>
                      <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        Import
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grup.linies.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">
                          {formatDate(l.dataFactura)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {l.numFactura ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{l.descripcio}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {l.tipusCodi}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatCurrency(l.import)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-baseline justify-end gap-4 pr-1 text-sm">
                <span className="text-muted-foreground">
                  Subtotal {grup.proveidorNom}
                </span>
                <span className="font-mono text-base tabular-nums">
                  {formatCurrency(grup.subtotal)}
                </span>
              </div>
            </section>
          ))}

          <div className="flex items-baseline justify-between gap-4 rounded-lg border border-border bg-card/60 px-5 py-4">
            <span className="text-lg">
              Total general{" "}
              <span className="text-sm text-muted-foreground">
                ({informe.numDespeses}{" "}
                {informe.numDespeses === 1 ? "despesa" : "despeses"})
              </span>
            </span>
            <span className="font-mono text-2xl tabular-nums">
              {formatCurrency(informe.totalGeneral)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
