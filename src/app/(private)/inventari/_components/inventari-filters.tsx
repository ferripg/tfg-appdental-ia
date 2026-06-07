import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  search?: string;
  proveidorId?: string;
  estat?: string;
  includeEliminats?: boolean;
  proveidors: Array<{ id: string; nif: string; nom: string }>;
};

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function InventariFilters({
  search,
  proveidorId,
  estat,
  includeEliminats,
  proveidors,
}: Props) {
  return (
    <form
      action="/inventari"
      method="get"
      className="grid gap-3 rounded-lg border border-border bg-card/60 p-3 md:grid-cols-[2fr_1fr_1fr_auto_auto]"
    >
      <div className="space-y-1.5">
        <Label htmlFor="q" className="text-xs uppercase tracking-wider">
          Cerca
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="q"
            name="q"
            defaultValue={search ?? ""}
            placeholder="Núm. inventari o descripció…"
            className="pl-8"
            type="search"
          />
        </div>
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
      <div className="space-y-1.5">
        <Label htmlFor="estat" className="text-xs uppercase tracking-wider">
          Estat
        </Label>
        <select
          id="estat"
          name="estat"
          defaultValue={estat ?? ""}
          className={cn(SELECT_CLASS)}
        >
          <option value="">Actius i de baixa</option>
          <option value="ACTIU">Actius</option>
          <option value="BAIXA">De baixa</option>
          <option value="ELIMINAT">Eliminats</option>
        </select>
      </div>
      <div className="flex items-end pb-1.5">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            name="eliminats"
            value="1"
            defaultChecked={includeEliminats}
            className="size-4 rounded border-input"
          />
          Inclou eliminats
        </label>
      </div>
      <div className="flex items-end">
        <Button type="submit" size="sm" variant="outline" className="w-full">
          Aplica
        </Button>
      </div>
    </form>
  );
}
