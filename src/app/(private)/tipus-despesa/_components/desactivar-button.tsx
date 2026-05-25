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
  descripcio: string;
  actiu: boolean;
  action: SetActiuFn;
};

export function SetActiuButton({ id, descripcio, actiu, action }: Props) {
  const [pending, startTransition] = useTransition();
  const target = !actiu;

  const title = actiu ? "Desactivar tipus de despesa" : "Reactivar tipus de despesa";
  const description = actiu
    ? `«${descripcio}» deixarà d'aparèixer com a opció en crear noves despeses. Les despeses existents amb aquest tipus es mantenen intactes.`
    : `«${descripcio}» tornarà a estar disponible en crear noves despeses.`;
  const cta = actiu ? "Desactiva" : "Reactiva";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={actiu ? "outline" : "default"}>
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
