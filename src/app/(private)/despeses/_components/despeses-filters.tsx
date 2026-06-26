import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  search?: string;
  des?: string;
  fins?: string;
  proveidorId?: string;
  tipusDespesaId?: string;
  importMin?: string;
  importMax?: string;
  tipus: Array<{ id: string; codi: string; descripcio: string }>;
  proveidors: Array<{ id: string; nif: string; nom: string }>;
};

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function DespesesFilters({
  search,
  des,
  fins,
  proveidorId,
  tipusDespesaId,
  importMin,
  importMax,
  tipus,
  proveidors,
}: Props) {
  return (
    <form
      action="/despeses"
      method="get"
      className="grid gap-3 rounded-lg border border-border bg-card/60 p-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="q" className="text-xs uppercase tracking-wider">
          Cerca
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="q"
            name="q"
            defaultValue={search ?? ""}
            placeholder="Núm factura o descripció…"
            className="pl-8"
            type="search"
          />
        </div>
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
      <div className="space-y-1.5">
        <Label htmlFor="min" className="text-xs uppercase tracking-wider">
          Import mín (€)
        </Label>
        <Input
          id="min"
          name="min"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          defaultValue={importMin ?? ""}
          placeholder="0,00"
          className="font-mono tabular-nums"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="max" className="text-xs uppercase tracking-wider">
          Import màx (€)
        </Label>
        <Input
          id="max"
          name="max"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          defaultValue={importMax ?? ""}
          placeholder="0,00"
          className="font-mono tabular-nums"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tipus" className="text-xs uppercase tracking-wider">
          Tipus
        </Label>
        <select
          id="tipus"
          name="tipus"
          defaultValue={tipusDespesaId ?? ""}
          className={cn(SELECT_CLASS)}
        >
          <option value="">Tots</option>
          {tipus.map((t) => (
            <option key={t.id} value={t.id}>
              {t.codi}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="proveidor" className="text-xs uppercase tracking-wider">
          Proveïdor
        </Label>
        <select
          id="proveidor"
          name="proveidor"
          defaultValue={proveidorId ?? ""}
          className={cn(SELECT_CLASS)}
        >
          <option value="">Tots</option>
          {proveidors.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" size="sm" variant="outline" className="w-full">
          Aplica
        </Button>
      </div>
    </form>
  );
}
