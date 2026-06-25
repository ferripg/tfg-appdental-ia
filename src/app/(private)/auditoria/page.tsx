import { notFound } from "next/navigation";
import { isAccioAudit } from "@/domain/audit";
import { ForbiddenError } from "@/domain/errors";
import { auditService } from "@/services/audit-service";
import { requireAdmin } from "@/services/auth-service";
import { AuditoriaFilters } from "./_components/auditoria-filters";
import { AuditoriaTable } from "./_components/auditoria-table";

type SearchParams = Promise<{
  accio?: string;
  des?: string;
  fins?: string;
}>;

function parseDate(v?: string): Date | undefined {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Gate d'administrador a la PÀGINA (no al servei): així evitem l'import
  // circular lib/auth → audit-service → auth-service → lib/auth (vegeu la nota
  // a audit-service). Patró "amaga la ruta" idèntic a /usuaris: un no-admin
  // rep un 404 i no sap que la ruta existeix.
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof ForbiddenError) notFound();
    throw err;
  }

  const sp = await searchParams;
  const accio = sp.accio && isAccioAudit(sp.accio) ? sp.accio : undefined;
  const des = parseDate(sp.des);
  const fins = parseDate(sp.fins);

  const entries = await auditService.list({ accio, des, fins });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Administració
        </p>
        <h1 className="text-4xl leading-tight md:text-5xl">Auditoria</h1>
        <p className="max-w-2xl text-muted-foreground">
          Historial d&apos;esdeveniments d&apos;accés i de les operacions que
          canvien dades sensibles (usuaris, despeses, inventari, amortitzacions).
          Les consultes i lectures no es registren. Es mostren els 200 registres
          més recents que compleixen els filtres.
        </p>
      </div>

      <AuditoriaFilters accio={accio} des={sp.des ?? ""} fins={sp.fins ?? ""} />

      <AuditoriaTable entries={entries} />
    </div>
  );
}
