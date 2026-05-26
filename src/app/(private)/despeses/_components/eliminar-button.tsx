"use client";

import { Loader2, Trash2 } from "lucide-react";
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

type DeleteFn = (id: string) => Promise<void>;

type Props = {
  id: string;
  label: string;
  action: DeleteFn;
};

export function EliminarDespesaButton({ id, label, action }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:bg-destructive/10">
          <Trash2 className="size-4" />
          Elimina
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar despesa</AlertDialogTitle>
          <AlertDialogDescription>
            Aquesta acció és <strong>irreversible</strong>. La despesa
            «{label}» s&apos;eliminarà permanentment de la base de dades, i no
            apareixerà a cap llistat ni informe.
            <br />
            Si l&apos;objectiu és deixar-la fora de l&apos;exercici actual,
            considera deixar-la pendent de pagament en comptes d&apos;eliminar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel·la</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await action(id);
              });
            }}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? <Loader2 className="animate-spin" /> : "Elimina definitivament"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
