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
import { USER_ROLES, type UserRole } from "@/domain/user";
import { cn } from "@/lib/utils";

export type UsuariFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export type UsuariFormAction = (
  prev: UsuariFormState,
  formData: FormData,
) => Promise<UsuariFormState>;

type Mode = "create" | "edit";

type Defaults = {
  name: string;
  email: string;
  role: UserRole;
  actiu: boolean;
};

type Props = {
  mode: Mode;
  action: UsuariFormAction;
  defaults: Defaults;
  /** When editing, the admin can't change the role here (use the dedicated
   *  rol switcher on the detail page). This flag disables the field. */
  roleEditable?: boolean;
  /** Disables the `actiu` checkbox when editing — `actiu` is changed via
   *  the dedicated AlertDialog on the detail page. */
  actiuEditable?: boolean;
  submitLabel: string;
  cancelHref: string;
};

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrador — accés total inclosa la gestió d'usuaris",
  MANAGER: "Gestor — CRUD complet del domini i exports",
  OPERARI: "Operari — registrar despeses i consultar llistats",
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {messages.join(" · ")}
    </p>
  );
}

export function UsuariForm({
  mode,
  action,
  defaults,
  roleEditable = mode === "create",
  actiuEditable = mode === "create",
  submitLabel,
  cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState<
    UsuariFormState,
    FormData
  >(action, null);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Identitat</CardTitle>
          <CardDescription>
            Dades públiques de l&apos;usuari dins l&apos;aplicació.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Nom complet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={defaults.name}
              placeholder="Maria Garcia"
              className={cn(fe.name && "border-destructive")}
              aria-invalid={!!fe.name}
            />
            <FieldError messages={fe.name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={defaults.email}
              placeholder="maria@clinica.test"
              className={cn(fe.email && "border-destructive")}
              aria-invalid={!!fe.email}
            />
            <FieldError messages={fe.email} />
          </div>
        </CardContent>

        <Separator />

        <CardHeader>
          <CardTitle className="text-xl">Permisos i estat</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Tria el rol i defineix una contrasenya temporal. L'usuari l'haurà de canviar al primer accés."
              : "El rol i l'estat es canvien des dels controls específics del detall (a sota del formulari)."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="role">
              Rol <span className="text-destructive">*</span>
            </Label>
            <select
              id="role"
              name="role"
              required
              defaultValue={defaults.role}
              disabled={!roleEditable}
              aria-invalid={!!fe.role}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring",
                fe.role && "border-destructive",
              )}
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <FieldError messages={fe.role} />
          </div>

          {mode === "create" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">
                Contrasenya temporal{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="text"
                required
                autoComplete="new-password"
                placeholder="Operari123"
                className={cn(
                  "font-mono",
                  fe.password && "border-destructive",
                )}
                aria-invalid={!!fe.password}
              />
              <p className="text-xs text-muted-foreground">
                Mínim 8 caràcters, almenys una majúscula i un dígit.
                Comunica-la a l&apos;usuari per un canal segur — al primer
                accés se li forçarà el canvi.
              </p>
              <FieldError messages={fe.password} />
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                id="actiu"
                name="actiu"
                defaultChecked={defaults.actiu}
                disabled={!actiuEditable}
              />
              Usuari actiu (pot iniciar sessió)
            </label>
            <FieldError messages={fe.actiu} />
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

export const EMPTY_USUARI_DEFAULTS: Defaults = {
  name: "",
  email: "",
  role: "OPERARI",
  actiu: true,
};
