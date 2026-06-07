"use client";

import { ArchiveRestore, Loader2, PackageMinus, Trash2 } from "lucide-react";
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
import type { EstatInventari } from "@/domain/inventari";

type ActionFn = (id: string) => Promise<void>;

type Props = {
  id: string;
  numInventari: string;
  estat: EstatInventari;
  numAmortitzacions: number;
  baixaAction: ActionFn;
  reactivarAction: ActionFn;
  eliminarAction: ActionFn;
};

function ConfirmButton({
  id,
  action,
  trigger,
  title,
  description,
  cta,
  destructive,
}: {
  id: string;
  action: ActionFn;
  trigger: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  destructive?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
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
                await action(id);
              });
            }}
            disabled={pending}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : cta}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function EstatButtons({
  id,
  numInventari,
  estat,
  numAmortitzacions,
  baixaAction,
  reactivarAction,
  eliminarAction,
}: Props) {
  const teAmortitzacions = numAmortitzacions > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {estat === "ACTIU" && (
        <ConfirmButton
          id={id}
          action={baixaAction}
          title="Donar de baixa"
          description={`«${numInventari}» deixarà d'amortitzar-se a partir d'ara i constarà com a bé de baixa. Sempre el podràs reactivar.`}
          cta="Dona de baixa"
          trigger={
            <Button variant="outline">
              <PackageMinus className="size-4" />
              Dona de baixa
            </Button>
          }
        />
      )}

      {estat === "BAIXA" && (
        <ConfirmButton
          id={id}
          action={reactivarAction}
          title="Reactivar bé"
          description={`«${numInventari}» tornarà a estar actiu i s'amortitzarà en els pròxims exercicis.`}
          cta="Reactiva"
          trigger={
            <Button variant="outline">
              <ArchiveRestore className="size-4" />
              Reactiva
            </Button>
          }
        />
      )}

      {estat !== "ELIMINAT" &&
        (teAmortitzacions ? (
          <Button
            variant="outline"
            className="text-muted-foreground"
            disabled
            title="Té amortitzacions: retrocedeix-les abans d'eliminar"
          >
            <Trash2 className="size-4" />
            Elimina
          </Button>
        ) : (
          <ConfirmButton
            id={id}
            action={eliminarAction}
            destructive
            title="Eliminar bé"
            description={`«${numInventari}» s'eliminarà de l'inventari. Fes-ho només si el bé s'ha creat per error.`}
            cta="Elimina"
            trigger={
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
                Elimina
              </Button>
            }
          />
        ))}
    </div>
  );
}
