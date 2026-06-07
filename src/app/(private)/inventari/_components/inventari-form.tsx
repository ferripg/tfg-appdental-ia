"use client";

import { Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type InventariFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export type InventariFormAction = (
  prev: InventariFormState,
  formData: FormData,
) => Promise<InventariFormState>;

type FieldDefaults = {
  descripcio: string;
  proveidorId: string;
  numFactura: string;
  dataAdquisicio: string;
  importAdquisicio: string;
  percAmortitzacio: string;
};

type Props = {
  action: InventariFormAction;
  defaults: FieldDefaults;
  proveidors: Array<{ id: string; nif: string; nom: string }>;
  /** Si el bé ja té amortitzacions, import/%/data queden bloquejats. */
  locked: boolean;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {messages.join(" · ")}
    </p>
  );
}

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50";

export function InventariForm({ action, defaults, proveidors, locked }: Props) {
  const [state, formAction, pending] = useActionState<
    InventariFormState,
    FormData
  >(action, null);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Dades del bé</CardTitle>
          <CardDescription>
            Els béns d&apos;inventari es generen automàticament des de les
            despeses amortitzables. Aquí pots completar-ne les dades.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="descripcio">
              Descripció <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="descripcio"
              name="descripcio"
              rows={2}
              required
              defaultValue={defaults.descripcio}
              placeholder="Ex. Equip de raigs X panoràmic"
              className={cn(fe.descripcio && "border-destructive")}
              aria-invalid={!!fe.descripcio}
            />
            <FieldError messages={fe.descripcio} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proveidorId">
              Proveïdor <span className="text-destructive">*</span>
            </Label>
            <select
              id="proveidorId"
              name="proveidorId"
              required
              defaultValue={defaults.proveidorId}
              className={cn(SELECT_CLASS, fe.proveidorId && "border-destructive")}
              aria-invalid={!!fe.proveidorId}
            >
              <option value="">— Selecciona un proveïdor —</option>
              {proveidors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} · {p.nif}
                </option>
              ))}
            </select>
            <FieldError messages={fe.proveidorId} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="numFactura">Número de factura</Label>
            <Input
              id="numFactura"
              name="numFactura"
              defaultValue={defaults.numFactura}
              placeholder="F-2026/00123"
              className={cn("font-mono", fe.numFactura && "border-destructive")}
              aria-invalid={!!fe.numFactura}
            />
            <FieldError messages={fe.numFactura} />
          </div>
        </CardContent>

        <Separator />

        <CardHeader>
          <CardTitle className="text-xl">
            Amortització
            {locked && (
              <span className="ml-2 inline-flex items-center gap-1 align-middle font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <Lock className="size-3" /> bloquejat
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {locked
              ? "Aquest bé ja té amortitzacions generades: import, percentatge i data no es poden modificar. Retrocedeix les amortitzacions per desbloquejar-los."
              : "Defineix el percentatge d'amortització anual. L'import i la data s'hereten de la despesa, però pots ajustar-los mentre no hi hagi amortitzacions."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="dataAdquisicio">
              Data d&apos;adquisició <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dataAdquisicio"
              name="dataAdquisicio"
              type="date"
              required
              readOnly={locked}
              defaultValue={defaults.dataAdquisicio}
              className={cn(
                locked && "bg-muted/50 text-muted-foreground",
                fe.dataAdquisicio && "border-destructive",
              )}
              aria-invalid={!!fe.dataAdquisicio}
            />
            <FieldError messages={fe.dataAdquisicio} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="importAdquisicio">
              Import (€) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="importAdquisicio"
              name="importAdquisicio"
              type="text"
              inputMode="decimal"
              required
              readOnly={locked}
              defaultValue={defaults.importAdquisicio}
              placeholder="8900.00"
              className={cn(
                "font-mono tabular-nums",
                locked && "bg-muted/50 text-muted-foreground",
                fe.importAdquisicio && "border-destructive",
              )}
              aria-invalid={!!fe.importAdquisicio}
            />
            <FieldError messages={fe.importAdquisicio} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="percAmortitzacio">
              % anual <span className="text-destructive">*</span>
            </Label>
            <Input
              id="percAmortitzacio"
              name="percAmortitzacio"
              type="text"
              inputMode="decimal"
              required
              readOnly={locked}
              defaultValue={defaults.percAmortitzacio}
              placeholder="10"
              className={cn(
                "font-mono tabular-nums",
                locked && "bg-muted/50 text-muted-foreground",
                fe.percAmortitzacio && "border-destructive",
              )}
              aria-invalid={!!fe.percAmortitzacio}
            />
            <FieldError messages={fe.percAmortitzacio} />
          </div>
        </CardContent>
      </Card>

      {state?.error && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" asChild>
          <Link href="/inventari">Cancel·la</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              Desant…
            </>
          ) : (
            "Desa els canvis"
          )}
        </Button>
      </div>
    </form>
  );
}
