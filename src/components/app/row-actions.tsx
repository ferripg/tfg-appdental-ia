import { Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Botons d'acció per a cada fila d'un llistat del domini: «Veure» obre la
 * fitxa en mode consulta (per defecte) i «Edita» l'obre directament en mode
 * edició (`?mode=edita`). El botó d'editar només es mostra si el rol de
 * l'usuari pot gestionar el domini (MANAGER/ADMIN) — la fitxa torna a
 * validar el permís al servidor, això és només UI.
 */
export function RowActions({
  href,
  canEdit,
  label,
  children,
}: {
  /** Ruta de la fitxa, sense query string (p. ex. `/proveidors/abc`). */
  href: string;
  canEdit: boolean;
  /** Nom de l'element, per a l'aria-label dels botons. */
  label: string;
  /** Accions extra (desactivar/eliminar…), només visibles si canEdit. */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
      <Button asChild variant="ghost" size="sm">
        <Link href={href} aria-label={`Consulta ${label}`}>
          <Eye className="size-3.5" />
          Veure
        </Link>
      </Button>
      {canEdit && (
        <Button asChild variant="outline" size="sm">
          <Link href={`${href}?mode=edita`} aria-label={`Edita ${label}`}>
            <Pencil className="size-3.5" />
            Edita
          </Link>
        </Button>
      )}
      {canEdit && children}
    </div>
  );
}
