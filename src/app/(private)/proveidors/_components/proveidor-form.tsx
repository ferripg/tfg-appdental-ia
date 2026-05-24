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
import { cn } from "@/lib/utils";

export type ProveidorFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export type ProveidorFormAction = (
  prev: ProveidorFormState,
  formData: FormData,
) => Promise<ProveidorFormState>;

type FieldDefaults = {
  nif: string;
  nom: string;
  codiBis: string;
  actiu: boolean;
  adreca: string;
  codiPostal: string;
  poblacio: string;
  email: string;
  telefon: string;
  personaContacte: string;
  iban: string;
  notes: string;
};

type ProveidorFormProps = {
  action: ProveidorFormAction;
  defaults: FieldDefaults;
  submitLabel: string;
  cancelHref: string;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {messages.join(" · ")}
    </p>
  );
}

export function ProveidorForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
}: ProveidorFormProps) {
  const [state, formAction, pending] = useActionState<
    ProveidorFormState,
    FormData
  >(action, null);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Identificació</CardTitle>
          <CardDescription>
            Dades fiscals i nom comercial del proveïdor.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nif">
              NIF / CIF <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nif"
              name="nif"
              required
              defaultValue={defaults.nif}
              placeholder="B12345674"
              className={cn(fe.nif && "border-destructive")}
              aria-invalid={!!fe.nif}
            />
            <FieldError messages={fe.nif} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nom">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nom"
              name="nom"
              required
              defaultValue={defaults.nom}
              placeholder="Material Pharma SL"
              className={cn(fe.nom && "border-destructive")}
              aria-invalid={!!fe.nom}
            />
            <FieldError messages={fe.nom} />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="codiBis">Codi alternatiu (opcional)</Label>
            <Input
              id="codiBis"
              name="codiBis"
              defaultValue={defaults.codiBis}
              placeholder="Codi intern de l'ERP antic, si escau"
            />
            <FieldError messages={fe.codiBis} />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                id="actiu"
                name="actiu"
                defaultChecked={defaults.actiu}
              />
              Proveïdor actiu (apareix a les llistes per defecte)
            </label>
            <FieldError messages={fe.actiu} />
          </div>
        </CardContent>

        <Separator />

        <CardHeader>
          <CardTitle className="text-xl">Adreça</CardTitle>
          <CardDescription>Domicili fiscal o de facturació.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-[2fr_1fr_2fr]">
          <div className="space-y-1.5 md:col-span-3">
            <Label htmlFor="adreca">Carrer i número</Label>
            <Input
              id="adreca"
              name="adreca"
              defaultValue={defaults.adreca}
              placeholder="Carrer Major, 12, 2n 1a"
            />
            <FieldError messages={fe.adreca} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="codiPostal">Codi postal</Label>
            <Input
              id="codiPostal"
              name="codiPostal"
              defaultValue={defaults.codiPostal}
              placeholder="08010"
              inputMode="numeric"
              className={cn(fe.codiPostal && "border-destructive")}
              aria-invalid={!!fe.codiPostal}
            />
            <FieldError messages={fe.codiPostal} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="poblacio">Població</Label>
            <Input
              id="poblacio"
              name="poblacio"
              defaultValue={defaults.poblacio}
              placeholder="Girona"
            />
            <FieldError messages={fe.poblacio} />
          </div>
        </CardContent>

        <Separator />

        <CardHeader>
          <CardTitle className="text-xl">Contacte</CardTitle>
          <CardDescription>Canal preferent de comunicació.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correu electrònic</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={defaults.email}
              placeholder="comandes@proveidor.cat"
              className={cn(fe.email && "border-destructive")}
              aria-invalid={!!fe.email}
            />
            <FieldError messages={fe.email} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefon">Telèfon</Label>
            <Input
              id="telefon"
              name="telefon"
              type="tel"
              defaultValue={defaults.telefon}
              placeholder="972 12 34 56"
            />
            <FieldError messages={fe.telefon} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="personaContacte">Persona de contacte</Label>
            <Input
              id="personaContacte"
              name="personaContacte"
              defaultValue={defaults.personaContacte}
              placeholder="Anna Puig"
            />
            <FieldError messages={fe.personaContacte} />
          </div>
        </CardContent>

        <Separator />

        <CardHeader>
          <CardTitle className="text-xl">Facturació</CardTitle>
          <CardDescription>
            Compte bancari per a transferències i notes addicionals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              name="iban"
              defaultValue={defaults.iban}
              placeholder="ES91 2100 0418 4502 0005 1332"
              className={cn("font-mono", fe.iban && "border-destructive")}
              aria-invalid={!!fe.iban}
            />
            <FieldError messages={fe.iban} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={defaults.notes}
              placeholder="Condicions de pagament, observacions internes…"
              rows={4}
            />
            <FieldError messages={fe.notes} />
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
    </form>
  );
}

export const EMPTY_PROVEIDOR_DEFAULTS: FieldDefaults = {
  nif: "",
  nom: "",
  codiBis: "",
  actiu: true,
  adreca: "",
  codiPostal: "",
  poblacio: "",
  email: "",
  telefon: "",
  personaContacte: "",
  iban: "",
  notes: "",
};
