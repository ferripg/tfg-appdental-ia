import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { dashboardService } from "@/services/dashboard-service";
import { formatCurrency } from "@/lib/format";
import { GraficMensual } from "./_components/grafic-mensual";
import { GraficTipus } from "./_components/grafic-tipus";

/** Amplada relativa (%) d'una barra respecte del valor més gran del grup. */
function ampladaBarra(total: string, maxim: number): number {
  if (maxim <= 0) return 0;
  return Math.max(2, Math.round((Number(total) / maxim) * 100));
}

/**
 * Tauler. Mateix contingut que abans (benvinguda, 4 KPIs, gràfic mensual,
 * top proveïdors amb barres i gràfic per tipus); només canvia la presentació:
 * els KPIs formen una sola franja reglada en lloc de cards, i les seccions
 * es titulen amb una regla editorial en lloc d'anar dins de cards.
 */
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
        <p className="pt-2 text-sm text-muted-foreground">
          <span className="font-serif text-lg text-foreground">
            Benvingut, {user.name || user.email}
          </span>
          <br />
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
        </p>
      </div>

      {/* KPIs reals de l'exercici en curs: una sola franja reglada */}
      <section className="grid grid-cols-1 border-y border-t-foreground border-b-border sm:grid-cols-2 lg:grid-cols-4">
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
      <section className="space-y-5">
        <SectionTitle>Despeses per mes</SectionTitle>
        <GraficMensual dades={resum.perMes} />
      </section>

      {/* Desglossaments */}
      <section className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <SectionTitle hint="Per import facturat aquest any.">
            Top proveïdors
          </SectionTitle>
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
        </div>

        <div className="space-y-5">
          <SectionTitle hint="Desglossament per tipus de despesa.">
            Despeses per tipus
          </SectionTitle>
          {resum.perTipus.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Cap despesa registrada aquest any.
            </p>
          ) : (
            <GraficTipus dades={resum.perTipus} />
          )}
        </div>
      </section>
    </div>
  );
}

/** Títol de secció amb regla inferior (estil editorial), amb descripció opcional. */
function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-foreground pb-2">
      <h2 className="text-2xl">{children}</h2>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Cel·la de la franja de KPIs. Les regles verticals entre cel·les es
 * dibuixen segons el nombre de columnes de cada punt de tall (1 / 2 / 4).
 */
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
    <div className="flex min-w-0 flex-col gap-1.5 border-b border-border py-5 last:border-b-0 sm:border-b-0 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(even)]:pl-6 sm:[&:nth-child(odd)]:pr-6 sm:[&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0 lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:pl-6 lg:[&:not(:last-child)]:pr-6">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="font-serif text-4xl leading-none tabular-nums">{value}</p>
      <p className="truncate text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
