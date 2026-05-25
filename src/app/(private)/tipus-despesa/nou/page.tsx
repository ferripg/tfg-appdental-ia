import Link from "next/link";
import {
  EMPTY_TIPUS_DESPESA_DEFAULTS,
  TipusDespesaForm,
} from "../_components/tipus-despesa-form";
import { createTipusDespesaAction } from "./actions";

export default function NouTipusDespesaPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/tipus-despesa" className="hover:text-foreground">
            ← Tipus de despesa
          </Link>
        </p>
        <h1 className="text-4xl leading-tight md:text-5xl">Nou tipus de despesa</h1>
        <p className="max-w-2xl text-muted-foreground">
          Defineix una nova categoria fiscal. Codi i descripció són
          obligatoris; la resta de camps refinen el tractament fiscal.
        </p>
      </div>

      <TipusDespesaForm
        action={createTipusDespesaAction}
        defaults={EMPTY_TIPUS_DESPESA_DEFAULTS}
        submitLabel="Crea el tipus"
        cancelHref="/tipus-despesa"
      />
    </div>
  );
}
