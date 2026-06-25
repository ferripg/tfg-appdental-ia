"use client";

import { Loader2 } from "lucide-react";
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

export type DespesaFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export type DespesaFormAction = (
  prev: DespesaFormState,
  formData: FormData,
) => Promise<DespesaFormState>;

type FieldDefaults = {
  dataFactura: string;
  dataPagament: string;
  import: string;
  numFactura: string;
  descripcio: string;
  tipusDespesaId: string;
  proveidorId: string;
};

type Props = {
  action: DespesaFormAction;
  defaults: FieldDefaults;
  submitLabel: string;
  cancelHref: string;
  tipus: Array<{ id: string; codi: string; descripcio: string }>;
  proveidors: Array<{ id: string; nif: string; nom: string }>;
  /** Mode consulta (només lectura): desactiva tots els camps i amaga el desat. */
  readOnly?: boolean;
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

export function DespesaForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
  tipus,
  proveidors,
  readOnly = false,
}: Props) {
  const [state, formAction, pending] = useActionState<
    DespesaFormState,
    FormData
  >(action, null);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <fieldset disabled={readOnly} className="min-w-0 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Factura</CardTitle>
          <CardDescription>
            Dates i número de la factura emesa pel proveïdor.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dataFactura">
              Data de factura <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dataFactura"
              name="dataFactura"
              type="date"
              required
              defaultValue={defaults.dataFactura}
              className={cn(fe.dataFactura && "border-destructive")}
              aria-invalid={!!fe.dataFactura}
            />
            <FieldError messages={fe.dataFactura} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dataPagament">Data de pagament</Label>
            <Input
              id="dataPagament"
              name="dataPagament"
              type="date"
              defaultValue={defaults.dataPagament}
              className={cn(fe.dataPagament && "border-destructive")}
              aria-invalid={!!fe.dataPagament}
            />
            <FieldError messages={fe.dataPagament} />
          </div>

          <div className="space-y-1.5 md:col-span-2">
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
          <CardTitle className="text-xl">Concepte</CardTitle>
          <CardDescription>
            Tipus de despesa, proveïdor i import. El tipus i l&apos;import són
            obligatoris.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tipusDespesaId">
              Tipus de despesa <span className="text-destructive">*</span>
            </Label>
            <select
              id="tipusDespesaId"
              name="tipusDespesaId"
              required
              defaultValue={defaults.tipusDespesaId}
              className={cn(
                SELECT_CLASS,
                fe.tipusDespesaId && "border-destructive",
              )}
              aria-invalid={!!fe.tipusDespesaId}
            >
              <option value="">— Selecciona un tipus —</option>
              {tipus.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.codi} · {t.descripcio}
                </option>
              ))}
            </select>
            <FieldError messages={fe.tipusDespesaId} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proveidorId">Proveïdor</Label>
            <select
              id="proveidorId"
              name="proveidorId"
              defaultValue={defaults.proveidorId}
              className={cn(
                SELECT_CLASS,
                fe.proveidorId && "border-destructive",
              )}
              aria-invalid={!!fe.proveidorId}
            >
              <option value="">— Sense proveïdor —</option>
              {proveidors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} · {p.nif}
                </option>
              ))}
            </select>
            <FieldError messages={fe.proveidorId} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="import">
              Import (€) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="import"
              name="import"
              type="text"
              inputMode="decimal"
              required
              defaultValue={defaults.import}
              placeholder="123.45"
              className={cn(
                "font-mono tabular-nums",
                fe.import && "border-destructive",
              )}
              aria-invalid={!!fe.import}
            />
            <FieldError messages={fe.import} />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="descripcio">Descripció</Label>
            <Textarea
              id="descripcio"
              name="descripcio"
              rows={3}
              defaultValue={defaults.descripcio}
              placeholder="Concepte específic de la despesa (ex. material per a cirurgia oral)"
              className={cn(fe.descripcio && "border-destructive")}
              aria-invalid={!!fe.descripcio}
            />
            <FieldError messages={fe.descripcio} />
          </div>
        </CardContent>
      </Card>
      </fieldset>

      {!readOnly && state?.error && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      {readOnly ? (
        <div className="flex items-center justify-end">
          <Button variant="outline" asChild>
            <Link href={cancelHref}>Torna</Link>
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" asChild>
            <Link href={cancelHref}>Cancel·la</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="animate-spin" />
                Desant…
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      )}
    </form>
  );
}

export const EMPTY_DESPESA_DEFAULTS: FieldDefaults = {
  dataFactura: new Date().toISOString().slice(0, 10),
  dataPagament: "",
  import: "",
  numFactura: "",
  descripcio: "",
  tipusDespesaId: "",
  proveidorId: "",
};
