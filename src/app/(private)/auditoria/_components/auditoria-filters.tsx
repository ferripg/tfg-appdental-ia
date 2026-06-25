import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ACCIO_LABELS,
  type AccioAudit,
  AUDIT_ACCIONS,
  familiaDeAccio,
  type FamiliaAccio,
} from "@/domain/audit";

type Props = {
  accio?: AccioAudit;
  des?: string;
  fins?: string;
};

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// Agrupació de les accions per família, per organitzar el desplegable en
// <optgroup> i facilitar trobar l'acció buscada.
const GRUPS: { familia: FamiliaAccio; label: string }[] = [
  { familia: "auth", label: "Autenticació" },
  { familia: "seguretat", label: "Seguretat" },
  { familia: "dades", label: "Dades" },
  { familia: "fiscal", label: "Fiscal" },
];

export function AuditoriaFilters({ accio, des, fins }: Props) {
  return (
    <form
      action="/auditoria"
      method="get"
      className="grid gap-3 rounded-lg border border-border bg-card/60 p-3 md:grid-cols-[2fr_1fr_1fr_auto]"
    >
      <div className="space-y-1.5">
        <Label htmlFor="accio" className="text-xs uppercase tracking-wider">
          Acció
        </Label>
        <select
          id="accio"
          name="accio"
          defaultValue={accio ?? ""}
          className={cn(SELECT_CLASS)}
        >
          <option value="">Totes</option>
          {GRUPS.map((grup) => (
            <optgroup key={grup.familia} label={grup.label}>
              {AUDIT_ACCIONS.filter(
                (a) => familiaDeAccio(a) === grup.familia,
              ).map((a) => (
                <option key={a} value={a}>
                  {ACCIO_LABELS[a]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="des" className="text-xs uppercase tracking-wider">
          Des de
        </Label>
        <Input id="des" name="des" type="date" defaultValue={des ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fins" className="text-xs uppercase tracking-wider">
          Fins
        </Label>
        <Input id="fins" name="fins" type="date" defaultValue={fins ?? ""} />
      </div>
      <div className="flex items-end">
        <Button type="submit" size="sm" variant="outline" className="w-full">
          Aplica
        </Button>
      </div>
    </form>
  );
}
