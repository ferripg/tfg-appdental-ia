import { Eye } from "lucide-react";

/**
 * Avís que la fitxa s'està veient en mode consulta (només lectura). El mostren
 * les pàgines de detall del domini quan el rol de l'usuari no permet editar
 * (OPERARI), de manera que quedi clar per què no hi ha accions de desar.
 */
export function ModeConsultaBanner() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
      <Eye className="size-4 shrink-0" />
      <span>
        Mode consulta — pots veure totes les dades d&apos;aquesta fitxa, però no
        editar-les.
      </span>
    </div>
  );
}
