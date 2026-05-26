import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DespesaNotFound() {
  return (
    <div className="space-y-4 rounded-lg border border-dashed border-border bg-card/40 px-8 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="text-3xl">Aquesta despesa no existeix</h1>
      <p className="text-muted-foreground">
        O bé l&apos;adreça és incorrecta, o bé la despesa ja s&apos;ha
        eliminat.
      </p>
      <Button asChild variant="outline">
        <Link href="/despeses">Torna al llistat</Link>
      </Button>
    </div>
  );
}
