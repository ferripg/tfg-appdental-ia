import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Metric = {
  label: string;
  value: string;
  hint: string;
};

const METRICS: Metric[] = [
  {
    label: "Despesa anual",
    value: "—",
    hint: "Suma de despeses de l'exercici en curs",
  },
  {
    label: "Aquest mes",
    value: "—",
    hint: "Despeses registrades en els últims 30 dies",
  },
  {
    label: "Top proveïdor",
    value: "—",
    hint: "Proveïdor amb més volum facturat",
  },
  {
    label: "Amortitzacions",
    value: "—",
    hint: "Elements pendents d'amortitzar enguany",
  },
];

export default async function DashboardPage() {
  // Session is guaranteed by the (private) layout, but we read it here to
  // render the welcome message without an additional prop drilling layer.
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user;

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Visió general
        </p>
        <h1 className="text-4xl leading-tight md:text-5xl">Tauler</h1>
        <p className="max-w-2xl text-muted-foreground">
          Activitat resumida de la clínica. Les xifres reals s&apos;activaran
          a mesura que entrin els mòduls de despeses, proveïdors i inventari.
        </p>
      </div>

      {/* Welcome card */}
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

      {/* Metric cards (Sprint 3 placeholders) */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl">Indicadors</h2>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Disponible a Sprint 3
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric) => (
            <Card key={metric.label} size="sm">
              <CardHeader>
                <CardDescription className="text-xs uppercase tracking-wider">
                  {metric.label}
                </CardDescription>
                <CardTitle className="font-serif text-4xl">
                  {metric.value}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {metric.hint}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
