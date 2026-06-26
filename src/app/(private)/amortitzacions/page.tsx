import { Calculator, RotateCcw } from "lucide-react";
import Link from "next/link";
import { ResultToast } from "@/components/app/result-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { potGestionarDomini } from "@/domain/permissions";
import { amortitzacionsService } from "@/services/amortitzacions-service";
import { currentRole } from "@/services/auth-service";
import { formatCurrency } from "@/lib/format";
import { ConfirmActionButton } from "./_components/confirm-action-button";
import { AMORTITZACIONS_TOAST_MAP } from "./_components/toast-map";
import {
  generarExerciciAction,
  retrocedirExerciciAction,
} from "./actions";

type SearchParams = Promise<{ msg?: string | string[]; ex?: string }>;

export default async function AmortitzacionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const [estat, resum] = await Promise.all([
    amortitzacionsService.getEstat(),
    amortitzacionsService.getResum(),
  ]);

  const canManage = potGestionarDomini(await currentRole());

  const exSeleccionat = sp.ex && /^\d{4}$/.test(sp.ex) ? Number(sp.ex) : null;
  const detall =
    exSeleccionat !== null
      ? await amortitzacionsService.getDetallExercici(exSeleccionat)
      : [];

  return (
    <div className="space-y-8">
      <ResultToast msg={sp.msg} map={AMORTITZACIONS_TOAST_MAP} />

      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/inventari" className="hover:text-foreground">
            ← Inventari
          </Link>
        </p>
        <h1 className="text-4xl leading-tight md:text-5xl">Amortitzacions</h1>
        <p className="max-w-2xl text-muted-foreground">
          Amortització lineal anual dels béns d&apos;inventari. Els exercicis es
          generen en ordre, un darrere l&apos;altre, sense saltar anys; només
          es pot retrocedir l&apos;últim generat.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card/60 p-5">
        <div className="flex-1 space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Últim exercici generat
          </p>
          <p className="font-mono text-2xl tabular-nums">
            {estat.ultimExercici ?? "—"}
          </p>
        </div>
        <div className="flex-1 space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Pròxim a generar
          </p>
          <p className="font-mono text-2xl tabular-nums">
            {estat.proximExercici ?? "—"}
          </p>
        </div>
        {canManage && (
        <div className="flex items-center gap-3">
          {estat.proximExercici !== null && (
            <ConfirmActionButton
              action={generarExerciciAction.bind(null, estat.proximExercici)}
              label={`Generar ${estat.proximExercici}`}
              icon={<Calculator className="size-4" />}
              title={`Generar amortitzacions ${estat.proximExercici}`}
              description={`Es calcularan i desaran les amortitzacions de l'exercici ${estat.proximExercici} per a tots els béns actius adquirits aquell any o abans. Pots retrocedir-ho després.`}
              cta="Genera"
            />
          )}
          {estat.ultimExercici !== null && (
            <ConfirmActionButton
              action={retrocedirExerciciAction.bind(null, estat.ultimExercici)}
              label={`Retrocedir ${estat.ultimExercici}`}
              icon={<RotateCcw className="size-4" />}
              variant="outline"
              destructive
              title={`Retrocedir l'exercici ${estat.ultimExercici}`}
              description={`S'esborraran les amortitzacions de l'exercici ${estat.ultimExercici} i es revertirà l'import acumulat de cada bé. Aquesta acció és reversible tornant a generar-lo.`}
              cta="Retrocedeix"
            />
          )}
        </div>
        )}
      </div>

      {resum.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Encara no s&apos;ha generat cap exercici d&apos;amortització.
            {estat.proximExercici !== null
              ? ` Pots començar generant l'exercici ${estat.proximExercici}.`
              : " Primer cal tenir béns d'inventari actius."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Exercici
                </TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Béns amortitzats
                </TableHead>
                <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Total amortitzat
                </TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {resum.map((r) => (
                <TableRow key={r.exercici}>
                  <TableCell className="font-mono tabular-nums">
                    {r.exercici}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.count}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(r.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        href={
                          exSeleccionat === r.exercici
                            ? "/amortitzacions"
                            : `/amortitzacions?ex=${r.exercici}`
                        }
                      >
                        {exSeleccionat === r.exercici ? "Amaga" : "Detall"}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {exSeleccionat !== null && detall.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl">Detall de l&apos;exercici {exSeleccionat}</h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Núm
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Bé
                  </TableHead>
                  <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Quota
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detall.map((a) => (
                  <TableRow key={a.inventariId}>
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/inventari/${a.inventariId}`}
                        className="hover:underline underline-offset-2"
                      >
                        {a.numInventari}
                      </Link>
                    </TableCell>
                    <TableCell>{a.descripcio}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(a.import)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
