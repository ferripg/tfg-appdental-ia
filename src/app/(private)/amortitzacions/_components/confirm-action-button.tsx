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

type Props = {
  /** Server action ja lligada a l'exercici corresponent (sense arguments). */
  action: () => Promise<void>;
  label: string;
  title: string;
  description: string;
  cta: string;
  variant?: "default" | "outline";
  destructive?: boolean;
  icon?: React.ReactNode;
};

export function ConfirmActionButton({
  action,
  label,
  title,
  description,
  cta,
  variant = "default",
  destructive,
  icon,
}: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          className={
            destructive
              ? "text-destructive hover:bg-destructive/10"
              : undefined
          }
        >
          {icon}
          {label}
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
                await action();
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
