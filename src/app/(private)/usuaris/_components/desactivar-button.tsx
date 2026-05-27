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
  label: string;
  actiu: boolean;
  action: SetActiuFn;
  disabled?: boolean;
};

export function SetActiuButton({ id, label, actiu, action, disabled }: Props) {
  const [pending, startTransition] = useTransition();
  const target = !actiu;

  const title = actiu ? "Desactivar usuari" : "Reactivar usuari";
  const description = actiu
    ? `«${label}» no podrà iniciar sessió fins que el tornis a activar. Les seves dades es mantenen intactes.`
    : `«${label}» tornarà a poder iniciar sessió. Pots desactivar-lo de nou si cal.`;
  const cta = actiu ? "Desactiva" : "Reactiva";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={actiu ? "outline" : "default"}
          disabled={disabled}
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
