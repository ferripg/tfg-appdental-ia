import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  search?: string;
  includeInactius?: boolean;
};

export function ProveidorsFilters({ search, includeInactius }: Props) {
  return (
    <form
      action="/proveidors"
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card/60 p-3"
    >
      <div className="min-w-[16rem] flex-1 space-y-1.5">
        <Label htmlFor="q" className="text-xs uppercase tracking-wider">
          Cerca
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="q"
            name="q"
            defaultValue={search ?? ""}
            placeholder="Nom o NIF…"
            className="pl-8"
            type="search"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm">
        <Checkbox
          id="inactius"
          name="inactius"
          value="1"
          defaultChecked={includeInactius}
        />
        Mostra desactivats
      </label>
      <Button type="submit" size="sm" variant="outline">
        Aplica filtres
      </Button>
    </form>
  );
}
