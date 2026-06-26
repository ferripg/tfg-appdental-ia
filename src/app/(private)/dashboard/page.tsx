import { headers } from "next/headers";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { dashboardService } from "@/services/dashboard-service";
import { formatCurrency } from "@/lib/format";
import { GraficMensual } from "./_components/grafic-mensual";

/** Amplada relativa (%) d'una barra respecte del valor més gran del grup. */
function ampladaBarra(total: string, maxim: number): number {
  if (maxim <= 0) return 0;
  return Math.max(2, Math.round((Number(total) / maxim) * 100));
}

export default async function DashboardPage() {
  // La sessió la garanteix el layout (private); la llegim per a la benvinguda.
  const [session, resum] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    dashboardService.resum(),
  ]);
  const user = session!.user;

  const topProveidor = resum.topProveidors[0];
  const topTipus = resum.perTipus[0];
  const maxProveidor = topProveidor ? Number(topProveidor.total) : 0;
  const maxTipus = topTipus ? Number(topTipus.total) : 0;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Visió general
        </p>
        <h1 className="text-4xl leading-tight md:text-5xl">Tauler</h1>
        <p className="max-w-2xl text-muted-foreground">
          Resum de l&apos;activitat de despeses de l&apos;exercici{" "}
          <span className="font-mono">{resum.exercici}</span>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Benvingut, {user.name || user.email}
          </CardTitle>
          <CardDescription>
            Has iniciat sessió com a{" "}
            <span className="font-mono">{user.email}</span>
            {user.role && (
              <>
                {" · "}
                <span className="font-mono uppercase tracking-wider">
                  {user.role}
                </span>
              </>
            )}
            .
          </CardDescription>
        </CardHeader>
      </Card>

      {/* KPIs reals de l'exercici en curs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={`Despesa total ${resum.exercici}`}
          value={formatCurrency(resum.total)}
          hint="Suma de totes les despeses de l'any"
        />
        <Kpi
          label="Despeses registrades"
          value={String(resum.numDespeses)}
          hint="Nombre de moviments de l'any"
        />
        <Kpi
          label="Top proveïdor"
          value={topProveidor ? formatCurrency(topProveidor.total) : "0,00 €"}
          hint={topProveidor ? topProveidor.nom : "Cap proveïdor amb despeses"}
        />
        <Kpi
          label="Tipus principal"
          value={topTipus ? formatCurrency(topTipus.total) : "0,00 €"}
          hint={topTipus ? `${topTipus.codi} · ${topTipus.descripcio}` : "Cap despesa"}
        />
      </section>

      {/* Gràfic mensual */}
      <section className="space-y-4">
        <h2 className="text-2xl">Despeses per mes</h2>
        <Card>
          <CardContent className="pt-6">
            <GraficMensual dades={resum.perMes} />
          </CardContent>
        </Card>
      </section>

      {/* Desglossaments */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Top proveïdors</CardTitle>
            <CardDescription>Per import facturat aquest any.</CardDescription>
          </CardHeader>
          <CardContent>
            {resum.topProveidors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cap despesa amb proveïdor aquest any.
              </p>
            ) : (
              <ul className="space-y-3">
                {resum.topProveidors.map((p) => (
                  <li key={p.proveidorId} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <Link
                        href={`/proveidors/${p.proveidorId}`}
                        className="truncate hover:underline underline-offset-2"
                      >
                        {p.nom}
                      </Link>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(p.total)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${ampladaBarra(p.total, maxProveidor)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Despeses per tipus</CardTitle>
            <CardDescription>Desglossament per categoria fiscal.</CardDescription>
          </CardHeader>
          <CardContent>
            {resum.perTipus.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cap despesa registrada aquest any.
              </p>
            ) : (
              <ul className="space-y-3">
                {resum.perTipus.map((t) => (
                  <li key={t.codi} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate">
                        <span className="font-mono">{t.codi}</span>
                        <span className="text-muted-foreground"> · {t.descripcio}</span>
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(t.total)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${ampladaBarra(t.total, maxTipus)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription className="text-xs uppercase tracking-wider">
          {label}
        </CardDescription>
        <CardTitle className="font-serif text-3xl tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="truncate text-xs text-muted-foreground">
        {hint}
      </CardContent>
    </Card>
  );
}
