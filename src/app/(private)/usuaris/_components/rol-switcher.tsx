"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { USER_ROLES, type UserRole } from "@/domain/user";

type SetRoleFn = (id: string, role: UserRole) => Promise<void>;

type Props = {
  id: string;
  label: string;
  currentRole: UserRole;
  action: SetRoleFn;
  /** When the target is the admin who's logged in, the role cannot change
   *  from this UI (self-edit prevention) — the service would refuse anyway.
   *  Hiding the action keeps the affordance clean. */
  disabled?: boolean;
};

const ROLE_DESCRIPTION: Record<UserRole, string> = {
  ADMIN: "Accés total incloent la gestió d'usuaris.",
  MANAGER: "CRUD complet del domini, exports i amortitzacions.",
  OPERARI: "Registrar despeses i consultar llistats. Sense gestió de mestres.",
};

export function RolSwitcher({
  id,
  label,
  currentRole,
  action,
  disabled,
}: Props) {
  const [selected, setSelected] = useState<UserRole>(currentRole);
  const [pending, startTransition] = useTransition();

  const changed = selected !== currentRole;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="role-switch" className="text-xs uppercase tracking-wider">
          Rol assignat
        </Label>
        <select
          id="role-switch"
          value={selected}
          disabled={disabled || pending}
          onChange={(e) => setSelected(e.target.value as UserRole)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring md:max-w-md"
        >
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          {ROLE_DESCRIPTION[selected]}
        </p>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled || !changed || pending}
            suppressHydrationWarning
          >
            Aplica canvi de rol
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Canviar el rol de «{label}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Es passarà de <strong>{currentRole}</strong> a{" "}
              <strong>{selected}</strong>. El canvi té efecte al pròxim accés
              de l&apos;usuari.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel·la</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  await action(id, selected);
                });
              }}
              disabled={pending}
            >
              {pending ? <Loader2 className="animate-spin" /> : "Aplica"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
