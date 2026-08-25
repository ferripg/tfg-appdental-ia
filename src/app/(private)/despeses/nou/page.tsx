import Link from "next/link";
import { proveidorsService } from "@/services/proveidors-service";
import { tipusDespesaService } from "@/services/tipus-despesa-service";
import {
  DespesaForm,
  EMPTY_DESPESA_DEFAULTS,
} from "../_components/despesa-form";
import { createDespesaAction } from "./actions";

export default async function NovaDespesaPage() {
  const [tipus, proveidors] = await Promise.all([
    tipusDespesaService.list({ includeInactius: false }),
    proveidorsService.list({ includeInactius: false }),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link href="/despeses" className="hover:text-foreground">
            ← Despeses
          </Link>
        </p>
        <h1 className="text-4xl leading-tight md:text-5xl">Nova despesa</h1>
        <p className="max-w-2xl text-muted-foreground">
          Registra una despesa enllaçant-la a un tipus i a un proveïdor. Si
          encara no l&apos;has pagada, deixa la data de pagament buida.
        </p>
      </div>

      <DespesaForm
        action={createDespesaAction}
        defaults={EMPTY_DESPESA_DEFAULTS}
        submitLabel="Registra la despesa"
        cancelHref="/despeses"
        tipus={tipus}
        proveidors={proveidors}
        ambFactura
      />
    </div>
  );
}
