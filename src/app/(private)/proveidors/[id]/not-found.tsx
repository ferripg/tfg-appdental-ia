import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProveidorNotFound() {
  return (
    <div className="space-y-4 rounded-lg border border-dashed border-border bg-card/40 px-8 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="text-3xl">Aquest proveïdor no existeix</h1>
      <p className="text-muted-foreground">
        O bé l&apos;adreça és incorrecta, o bé el proveïdor s&apos;ha eliminat
        de la base de dades.
      </p>
      <Button asChild variant="outline">
        <Link href="/proveidors">Torna al llistat</Link>
      </Button>
    </div>
  );
}
