"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";
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

type SetActiuFn = (id: string, actiu: boolean) => Promise<void>;

type Props = {
  id: string;
  nom: string;
  actiu: boolean;
  action: SetActiuFn;
  /** Versió petita per encabir el botó a les files dels llistats. */
  compact?: boolean;
};

export function SetActiuButton({ id, nom, actiu, action, compact }: Props) {
  const [pending, startTransition] = useTransition();
  const target = !actiu;

  const title = actiu ? "Desactivar proveïdor" : "Reactivar proveïdor";
  const description = actiu
    ? `«${nom}» deixarà d'aparèixer als llistats per defecte. Pots reactivar-lo en qualsevol moment.`
    : `«${nom}» tornarà a aparèixer als llistats. Pots desactivar-lo de nou si cal.`;
  const cta = actiu ? "Desactiva" : "Reactiva";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={actiu ? "outline" : "default"}
          size={compact ? "sm" : "default"}
          suppressHydrationWarning
        >
          {actiu ? "Desactivar" : "Reactivar"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel·la</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await action(id, target);
              });
            }}
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : cta}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
