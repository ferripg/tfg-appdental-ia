"use client";

import {
  ExternalLink,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { useActionState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type UploadState = {
  error?: string;
  fieldErrors?: { file?: string[] };
} | null;

export type UploadAction = (
  prev: UploadState,
  formData: FormData,
) => Promise<UploadState>;

export type DeleteAction = () => Promise<void>;

type Props = {
  fitxerKey: string | null;
  downloadUrl: string | null;
  uploadAction: UploadAction;
  deleteAction: DeleteAction;
  /** Si l'usuari pot editar la despesa (pujar/esborrar factura). En mode
   *  consulta només es permet veure/descarregar la factura existent. */
  canEdit: boolean;
};

/**
 * Two-branch component: when the despesa has no `fitxerKey`, render an
 * upload form; otherwise render the existing-file view with download link
 * and delete dialog. Both branches sit inside the same bordered section so
 * the layout doesn't jump when the state flips.
 */
export function FacturaSection({
  fitxerKey,
  downloadUrl,
  uploadAction,
  deleteAction,
  canEdit,
}: Props) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card/60 p-5">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl">Factura adjunta</h2>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          PDF · max 5 MB
        </p>
      </header>

      {fitxerKey && downloadUrl ? (
        <ExistingFile
          downloadUrl={downloadUrl}
          deleteAction={deleteAction}
          canEdit={canEdit}
        />
      ) : canEdit ? (
        <UploadForm uploadAction={uploadAction} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Aquesta despesa no té cap factura adjunta.
        </p>
      )}
    </section>
  );
}

function UploadForm({ uploadAction }: { uploadAction: UploadAction }) {
  const [state, formAction, pending] = useActionState<UploadState, FormData>(
    uploadAction,
    null,
  );
  const fileErrors = state?.fieldErrors?.file;

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Encara no hi ha cap fitxer adjunt. Puja la factura en PDF per
        tenir-la associada a aquesta despesa.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="file" className="sr-only">
          Selecciona el PDF
        </Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept="application/pdf"
          required
          aria-invalid={!!fileErrors}
          className="cursor-pointer file:cursor-pointer file:font-medium"
        />
        {fileErrors && fileErrors.length > 0 && (
          <p className="text-xs text-destructive" role="alert">
            {fileErrors.join(" · ")}
          </p>
        )}
        {state?.error && !fileErrors && (
          <p className="text-xs text-destructive" role="alert">
            {state.error}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Pujant…
          </>
        ) : (
          <>
            <Upload className="size-4" />
            Puja factura
          </>
        )}
      </Button>
    </form>
  );
}

function ExistingFile({
  downloadUrl,
  deleteAction,
  canEdit,
}: {
  downloadUrl: string;
  deleteAction: DeleteAction;
  canEdit: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FileText className="size-5" />
        </span>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Factura en PDF</p>
          <p className="text-xs text-muted-foreground">
            URL signada vàlida 15 min — refresca la pàgina si caduca.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline">
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            Veure PDF
          </a>
        </Button>
        {canEdit && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-4" />
              Esborra
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Esborrar la factura</AlertDialogTitle>
              <AlertDialogDescription>
                El fitxer PDF s&apos;eliminarà permanentment del magatzem.
                La despesa quedarà sense factura adjunta i podràs pujar-ne
                una de nova quan vulguis. Aquesta acció és irreversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel·la</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  startTransition(async () => {
                    await deleteAction();
                  });
                }}
                disabled={pending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {pending ? <Loader2 className="animate-spin" /> : "Esborra"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        )}
      </div>
    </div>
  );
}
