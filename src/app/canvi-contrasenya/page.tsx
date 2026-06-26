import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/app/wordmark";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { CanviContrasenyaForm } from "./_components/canvi-contrasenya-form";
import { canviarContrasenyaAction } from "./actions";

/**
 * Pantalla de canvi de contrasenya (IA-20). Viu FORA del grup (private) i té
 * el seu propi layout centrat (sense el menú de navegació), perquè és el destí
 * del force-flow: un usuari amb `mustChangePassword=true` hi pot arribar però
 * no pot navegar enlloc més (el proxy l'hi torna). La sessió es comprova aquí
 * a part del proxy.
 */
export default async function CanviContrasenyaPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const mustChange =
    (session.user as { mustChangePassword?: boolean }).mustChangePassword ===
    true;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Wordmark size="lg" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Canvia la contrasenya</CardTitle>
            <CardDescription>
              {mustChange
                ? "El teu compte fa servir una contrasenya temporal. Estableix-ne una de nova per continuar."
                : "Actualitza la teva contrasenya. En desar-la es tancaran les altres sessions obertes."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CanviContrasenyaForm action={canviarContrasenyaAction} />
          </CardContent>
        </Card>

        {!mustChange && (
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              ← Torna al tauler
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
