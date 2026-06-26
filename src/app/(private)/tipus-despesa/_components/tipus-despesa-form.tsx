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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { GRUPS_PGC } from "@/domain/pgc";
import { cn } from "@/lib/utils";

// Estil del desplegable, alineat amb l'alçada i l'aspecte dels Inputs del form.
const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export type TipusDespesaFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export type TipusDespesaFormAction = (
  prev: TipusDespesaFormState,
  formData: FormData,
) => Promise<TipusDespesaFormState>;

type FieldDefaults = {
  codi: string;
  descripcio: string;
  deduible: boolean;
  esAmortitzable: boolean;
  actiu: boolean;
  grup: string;
  concepte: string;
};

type Props = {
  action: TipusDespesaFormAction;
  defaults: FieldDefaults;
  submitLabel: string;
  cancelHref: string;
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

export function TipusDespesaForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
  readOnly = false,
}: Props) {
  const [state, formAction, pending] = useActionState<
    TipusDespesaFormState,
    FormData
  >(action, null);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <fieldset disabled={readOnly} className="min-w-0 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Identificació</CardTitle>
          <CardDescription>
            Codi únic intern i descripció visible als llistats.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-[1fr_2fr]">
          <div className="space-y-1.5">
            <Label htmlFor="codi">
              Codi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="codi"
              name="codi"
              required
              defaultValue={defaults.codi}
              placeholder="MAT"
              className={cn("font-mono uppercase", fe.codi && "border-destructive")}
              aria-invalid={!!fe.codi}
            />
            <FieldError messages={fe.codi} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcio">
              Descripció <span className="text-destructive">*</span>
            </Label>
            <Input
              id="descripcio"
              name="descripcio"
              required
              defaultValue={defaults.descripcio}
              placeholder="Material consumibles d'oficina"
              className={cn(fe.descripcio && "border-destructive")}
              aria-invalid={!!fe.descripcio}
            />
            <FieldError messages={fe.descripcio} />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                id="actiu"
                name="actiu"
                defaultChecked={defaults.actiu}
              />
              Tipus actiu (apareix als llistats per defecte)
            </label>
            <FieldError messages={fe.actiu} />
          </div>
        </CardContent>

        <Separator />

        <CardHeader>
          <CardTitle className="text-xl">Classificació fiscal</CardTitle>
          <CardDescription>
            Encaix amb el Pla General Comptable i comportament fiscal.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-[1fr_2fr]">
          <div className="space-y-1.5">
            <Label htmlFor="grup">Grup PGC</Label>
            <select
              id="grup"
              name="grup"
              defaultValue={defaults.grup}
              className={cn(SELECT_CLASS, fe.grup && "border-destructive")}
              aria-invalid={!!fe.grup}
            >
              <option value="">—</option>
              {GRUPS_PGC.map((g) => (
                <option key={g.valor} value={g.valor}>
                  {g.valor} — {g.nom}
                </option>
              ))}
            </select>
            <FieldError messages={fe.grup} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="concepte">Concepte (descripció extensa, opcional)</Label>
            <Textarea
              id="concepte"
              name="concepte"
              rows={4}
              defaultValue={defaults.concepte}
              placeholder="Explicació detallada del tipus: criteris d'aplicació, exemples concrets, notes per a la persona que registra la despesa…"
              className={cn(fe.concepte && "border-destructive")}
              aria-invalid={!!fe.concepte}
            />
            <p className="text-xs text-muted-foreground">
              Text llarg per documentar quan i com aplicar aquest tipus
              (visible només a la fitxa).
            </p>
            <FieldError messages={fe.concepte} />
          </div>

          <div className="space-y-3 md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                id="deduible"
                name="deduible"
                defaultChecked={defaults.deduible}
              />
              Deduïble fiscalment
            </label>
            <FieldError messages={fe.deduible} />

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                id="esAmortitzable"
                name="esAmortitzable"
                defaultChecked={defaults.esAmortitzable}
              />
              Amortitzable (genera entrada d&apos;inventari quan es registra
              una despesa d&apos;aquest tipus)
            </label>
            <FieldError messages={fe.esAmortitzable} />
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

export const EMPTY_TIPUS_DESPESA_DEFAULTS: FieldDefaults = {
  codi: "",
  descripcio: "",
  deduible: true,
  esAmortitzable: false,
  actiu: true,
  grup: "",
  concepte: "",
};
