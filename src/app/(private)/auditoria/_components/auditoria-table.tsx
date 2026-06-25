import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ACCIO_LABELS,
  type AuditJson,
  type AuditLogEntry,
  familiaDeAccio,
  type FamiliaAccio,
} from "@/domain/audit";
import { formatDateTime } from "@/lib/format";

// Color del badge segons la família de l'acció (mateix patró que ROLE_BADGE
// de la taula d'usuaris): verd per auth, ambre per seguretat, etc.
const FAMILIA_CLASS: Record<FamiliaAccio, string> = {
  auth: "border-primary/40 text-primary",
  seguretat: "border-amber-500/40 text-amber-600 dark:text-amber-400",
  fiscal: "border-sky-500/40 text-sky-600 dark:text-sky-400",
  dades: "border-muted-foreground/30 text-muted-foreground",
};

/** Resum llegible del JSON de context: "clau: valor · clau: valor". */
function formatMetadata(metadata: AuditJson | null): string | null {
  if (!metadata) return null;
  const parts = Object.entries(metadata)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${String(v)}`);
  return parts.length ? parts.join(" · ") : null;
}

export function AuditoriaTable({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No hi ha cap registre d&apos;auditoria amb els filtres actuals.
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
              Data i hora
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Usuari
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Acció
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Entitat
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Detall
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              IP
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => {
            const detall = formatMetadata(e.metadata);
            return (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">
                  {formatDateTime(e.timestamp)}
                </TableCell>
                <TableCell className="text-sm">
                  {e.user ? (
                    <span title={e.userId ?? undefined}>
                      {e.user.name ?? e.user.email}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={FAMILIA_CLASS[familiaDeAccio(e.accio)]}
                  >
                    {ACCIO_LABELS[e.accio]}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {e.entitat ? (
                    <>
                      {e.entitat}
                      {e.entitatId ? (
                        <span className="opacity-60"> · {e.entitatId}</span>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                  {detall ?? "—"}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {e.ip ?? "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
