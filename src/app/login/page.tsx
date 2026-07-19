"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { Wordmark } from "@/components/app/wordmark";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Branding panel — desktop only */}
      <aside
        aria-hidden
        className="relative hidden overflow-hidden bg-accent/40 lg:flex lg:flex-col lg:justify-between lg:p-12"
      >
        {/* Decorative gridlines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.55 0.07 200 / 0.35) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.55 0.07 200 / 0.35) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse at center, black 35%, transparent 75%)",
          }}
        />
        {/* Decorative gradient orb */}
        <div
          className="pointer-events-none absolute -top-32 -left-32 size-112 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.55 0.1 200 / 0.6), transparent 70%)",
          }}
        />

        <div className="relative">
          <Wordmark size="md" />
        </div>

        <div className="relative max-w-md space-y-6">
          <p className="font-serif text-5xl leading-[1.18] text-foreground">
            Gestió interna per a clíniques dentals.
          </p>
          <p className="text-sm text-muted-foreground">
            Despeses, proveïdors i inventari, tot en un sol lloc.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono uppercase tracking-widest">
            IA
          </span>
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono">v0.1</span>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile wordmark */}
          <div className="flex justify-center lg:hidden">
            <Wordmark size="lg" />
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">Inicia sessió</CardTitle>
              <CardDescription>
                Introdueix les teves credencials per accedir a l&apos;aplicació.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={formAction} className="space-y-5">
                <div className="space-y-1.5">
                  {/* L'usuari final ho viu com un "usuari"; per sota segueix
                      sent l'email (type=email, validació i autocompletat). */}
                  <Label htmlFor="email">Usuari</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="el.teu.email@clinica.cat"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contrasenya</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>

                {state?.error && (
                  <p
                    role="alert"
                    className="text-sm text-destructive"
                    aria-live="polite"
                  >
                    {state.error}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={pending}
                >
                  {pending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Entrant…
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Si has oblidat la contrasenya, contacta amb l&apos;administrador.
          </p>
        </div>
      </main>
    </div>
  );
}
