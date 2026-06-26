import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  des: string;
  fins: string;
};

/**
 * Filtre de període (data inici – data fi, obligatori) i botó d'export a PDF.
 * És un GET form que recarrega /informes amb el nou període. L'enllaç de PDF
 * apunta al període APLICAT actualment (des/fins ja resolts a la pàgina).
 */
export function InformeFilters({ des, fins }: Props) {
  const pdfHref = `/informes/pdf?des=${encodeURIComponent(des)}&fins=${encodeURIComponent(fins)}`;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-border bg-card/60 p-3">
      <form
        action="/informes"
        method="get"
        className="flex flex-wrap items-end gap-3"
      >
        <div className="space-y-1.5">
          <Label htmlFor="des" className="text-xs uppercase tracking-wider">
            Data inici
          </Label>
          <Input id="des" name="des" type="date" required defaultValue={des} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fins" className="text-xs uppercase tracking-wider">
            Data fi
          </Label>
          <Input id="fins" name="fins" type="date" required defaultValue={fins} />
        </div>
        <Button type="submit" size="sm" variant="outline">
          Aplica període
        </Button>
      </form>

      <Button asChild size="sm">
        <a href={pdfHref}>
          <FileDown className="size-4" />
          Descarregar PDF
        </a>
      </Button>
    </div>
  );
}
