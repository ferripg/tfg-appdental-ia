"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type CanviContrasenyaState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export type CanviContrasenyaAction = (
  prev: CanviContrasenyaState,
  formData: FormData,
) => Promise<CanviContrasenyaState>;

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {messages.join(" · ")}
    </p>
  );
}

export function CanviContrasenyaForm({
  action,
}: {
  action: CanviContrasenyaAction;
}) {
  const [state, formAction, pending] = useActionState<
    CanviContrasenyaState,
    FormData
  >(action, null);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="actual">Contrasenya actual</Label>
        <Input
          id="actual"
          name="actual"
          type="password"
          autoComplete="current-password"
          required
          className={cn(fe.actual && "border-destructive")}
          aria-invalid={!!fe.actual}
        />
        <FieldError messages={fe.actual} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nova">Nova contrasenya</Label>
        <Input
          id="nova"
          name="nova"
          type="password"
          autoComplete="new-password"
          required
          className={cn(fe.nova && "border-destructive")}
          aria-invalid={!!fe.nova}
        />
        <p className="text-xs text-muted-foreground">
          Mínim 8 caràcters, amb una majúscula i un dígit.
        </p>
        <FieldError messages={fe.nova} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmar">Confirma la nova contrasenya</Label>
        <Input
          id="confirmar"
          name="confirmar"
          type="password"
          autoComplete="new-password"
          required
          className={cn(fe.confirmar && "border-destructive")}
          aria-invalid={!!fe.confirmar}
        />
        <FieldError messages={fe.confirmar} />
      </div>

      {state?.error && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Desant…
          </>
        ) : (
          "Canvia la contrasenya"
        )}
      </Button>
    </form>
  );
}
