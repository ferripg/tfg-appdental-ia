"use client";

import {
  ArrowRight,
  FilePlus2,
  Loader2,
  ScanSearch,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IMPORTACIO_CONCURRENCIA,
  IMPORTACIO_MAX_BYTES,
  IMPORTACIO_MAX_FITXERS,
  type FacturaExtreta,
  type ImportacioMatching,
} from "@/domain/importacio";
import { cn } from "@/lib/utils";
import {
  confirmaImportacioAction,
  descartaImportacioAction,
  extreuFacturaAction,
} from "../actions";
import {
  type EditRow,
  esFilaAmortitzable,
  type FilaImport,
  ImportRow,
  type ProveidorOption,
  type TipusOption,
  validaFila,
} from "./import-row";

/**
 * Wizard client de la importació IA (IA-23).
 *
 * La cua d'extracció viu aquí: cada PDF és una crida independent a
 * `extreuFacturaAction`, amb un màxim d'IMPORTACIO_CONCURRENCIA en vol.
 * Així la taula s'omple incrementalment, un fitxer problemàtic només afecta
 * la seva fila i no bombardegem l'API d'Anthropic amb 20 crides de cop.
 */

type Props = { tipus: TipusOption[]; proveidors: ProveidorOption[] };

function construeixEdit(
  extraccio: FacturaExtreta,
  matching: ImportacioMatching,
): EditRow {
  // Imports monetaris sempre amb 2 decimals ("3490" → "3490.00").
  const n = (v: number | null) => (v === null ? "" : v.toFixed(2));
  const pct = (v: number | null) => (v === null ? "" : String(v));
  const teDadesProveidor = Boolean(
    extraccio.proveidor.nif || extraccio.proveidor.nom,
  );
  return {
    dataFactura: extraccio.dataFactura ?? "",
    numFactura: extraccio.numFactura ?? "",
    descripcio: extraccio.concepte ?? "",
    importTotal: n(extraccio.total),
    baseImposable: n(extraccio.baseImposable),
    ivaPercentatge: pct(extraccio.ivaPercentatge),
    ivaImport: n(extraccio.ivaImport),
    proveidorSel:
      matching.proveidorId ?? (teDadesProveidor ? "nou" : "cap"),
    provNif: extraccio.proveidor.nif ?? "",
    provNom: extraccio.proveidor.nom ?? "",
    provAdreca: extraccio.proveidor.adreca ?? "",
    provCodiPostal: extraccio.proveidor.codiPostal ?? "",
    provPoblacio: extraccio.proveidor.poblacio ?? "",
    provEmail: extraccio.proveidor.email ?? "",
    provTelefon: extraccio.proveidor.telefon ?? "",
    tipusSel: matching.tipusDespesaId ?? (extraccio.tipusNou ? "nou" : ""),
    tipusCodi: extraccio.tipusNou?.codi ?? "",
    tipusDescripcio: extraccio.tipusNou?.descripcio ?? "",
    tipusDeduible: extraccio.tipusNou?.deduible ?? true,
    tipusEsAmortitzable: extraccio.tipusNou?.esAmortitzable ?? false,
    tipusGrup:
      extraccio.tipusNou?.grup != null ? String(extraccio.tipusNou.grup) : "",
  };
}

export function ImportWizard({ tipus, proveidors }: Props) {
  const [files, setFiles] = useState<FilaImport[]>([]);
  const [arrossegant, setArrossegant] = useState(false);
  const [confirmant, setConfirmant] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fitxersRef = useRef(new Map<string, File>());
  const cuaRef = useRef<string[]>([]);
  const enVolRef = useRef(0);

  // Evita perdre una revisió a mig fer en tancar la pestanya per accident.
  const hiHaFeinaViva = files.some(
    (f) =>
      f.estat === "pendent" ||
      f.estat === "revisio" ||
      f.estat === "analitzant" ||
      f.estat === "cua",
  );
  useEffect(() => {
    if (!hiHaFeinaViva) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hiHaFeinaViva]);

  const actualitzaFila = useCallback(
    (clientId: string, patch: Partial<FilaImport>) => {
      setFiles((prev) =>
        prev.map((f) => (f.clientId === clientId ? { ...f, ...patch } : f)),
      );
    },
    [],
  );

  /**
   * Bomba de la cua: engega extraccions fins al límit de concurrència.
   * S'autoinvoca en acabar cada extracció via ref (una funció no pot
   * referenciar-se a si mateixa dins del seu propi useCallback).
   */
  const bombaRef = useRef<() => void>(() => {});
  const bomba = useCallback(() => {
    while (
      enVolRef.current < IMPORTACIO_CONCURRENCIA &&
      cuaRef.current.length > 0
    ) {
      const clientId = cuaRef.current.shift();
      const file = clientId ? fitxersRef.current.get(clientId) : undefined;
      if (!clientId || !file) continue;

      enVolRef.current += 1;
      actualitzaFila(clientId, { estat: "analitzant" });

      const fd = new FormData();
      fd.append("file", file, file.name);

      extreuFacturaAction(fd)
        .then((row) => {
          if (row.estat === "ok") {
            actualitzaFila(clientId, {
              estat: "revisio",
              fitxerKey: row.fitxerKey,
              extraccio: row.extraccio,
              matching: row.matching,
              edit: construeixEdit(row.extraccio, row.matching),
              seleccionada: true,
              // Desplegat d'entrada quan hi ha coses per revisar de debò.
              expandida:
                !row.matching.proveidorId &&
                Boolean(row.extraccio.proveidor.nif || row.extraccio.proveidor.nom),
            });
          } else {
            actualitzaFila(clientId, {
              estat: "errada",
              fitxerKey: row.fitxerKey,
              error: row.error,
            });
          }
        })
        .catch(() => {
          actualitzaFila(clientId, {
            estat: "errada",
            error: "No s'ha pogut contactar amb el servidor",
          });
        })
        .finally(() => {
          enVolRef.current -= 1;
          bombaRef.current();
        });
    }
  }, [actualitzaFila]);
  useEffect(() => {
    bombaRef.current = bomba;
  }, [bomba]);

  const afegeixFitxers = useCallback(
    (llista: FileList | File[]) => {
      const nous = Array.from(llista);
      const forats = IMPORTACIO_MAX_FITXERS - files.length;
      if (nous.length > forats) {
        toast.warning(
          `Màxim ${IMPORTACIO_MAX_FITXERS} fitxers per lot: se n'han descartat ${nous.length - forats}.`,
        );
      }
      const acceptats = nous.slice(0, Math.max(0, forats));
      if (acceptats.length === 0) return;

      // Fase de SELECCIÓ: les files queden "pendent" i res no s'envia a
      // escanejar fins que l'usuari prem el botó (pot treure el que no toqui).
      const novesFiles: FilaImport[] = acceptats.map((file) => {
        const clientId = crypto.randomUUID();
        fitxersRef.current.set(clientId, file);
        const esPdf = file.type === "application/pdf";
        const massaGran = file.size > IMPORTACIO_MAX_BYTES;
        return {
          clientId,
          nomFitxer: file.name,
          estat: !esPdf || massaGran ? "errada" : "pendent",
          fitxerKey: null,
          error: !esPdf
            ? "Només s'admeten fitxers PDF"
            : massaGran
              ? "Supera el màxim de 5 MB"
              : null,
          extraccio: null,
          matching: null,
          edit: null,
          seleccionada: false,
          expandida: false,
          despesaId: null,
          resultatFlags: null,
        };
      });

      setFiles((prev) => [...prev, ...novesFiles]);
    },
    [files.length],
  );

  /** Fase d'ESCANEIG: encua totes les pendents i engega la bomba. */
  const escaneja = useCallback(() => {
    const pendents = files
      .filter((f) => f.estat === "pendent")
      .map((f) => f.clientId);
    if (pendents.length === 0) return;
    for (const id of pendents) {
      if (!cuaRef.current.includes(id)) cuaRef.current.push(id);
    }
    setFiles((prev) =>
      prev.map((f) => (f.estat === "pendent" ? { ...f, estat: "cua" } : f)),
    );
    bomba();
  }, [files, bomba]);

  const editaFila = useCallback(
    (clientId: string, patch: Partial<EditRow>) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.clientId === clientId && f.edit
            ? { ...f, edit: { ...f.edit, ...patch } }
            : f,
        ),
      );
    },
    [],
  );

  const treuFila = useCallback((clientId: string) => {
    setFiles((prev) => {
      const fila = prev.find((f) => f.clientId === clientId);
      if (fila?.fitxerKey && fila.estat !== "confirmada") {
        void descartaImportacioAction([fila.fitxerKey]);
      }
      fitxersRef.current.delete(clientId);
      cuaRef.current = cuaRef.current.filter((id) => id !== clientId);
      return prev.filter((f) => f.clientId !== clientId);
    });
  }, []);

  const descartaTot = useCallback(() => {
    const keys = files
      .filter((f) => f.fitxerKey && f.estat !== "confirmada")
      .map((f) => f.fitxerKey as string);
    if (keys.length > 0) void descartaImportacioAction(keys);
    fitxersRef.current.clear();
    cuaRef.current = [];
    setFiles([]);
  }, [files]);

  // --- Derivats per a la barra de confirmació -------------------------------
  const seleccionades = files.filter(
    (f) =>
      (f.estat === "revisio" || f.estat === "rebutjada") &&
      f.seleccionada &&
      f.edit,
  );
  const incompletes = seleccionades.filter(
    (f) => f.edit && validaFila(f.edit, tipus).length > 0,
  );
  const nProveidorsNous = new Set(
    seleccionades
      .filter((f) => f.edit?.proveidorSel === "nou")
      .map((f) => f.edit?.provNif.trim().toUpperCase()),
  ).size;
  const nTipusNous = new Set(
    seleccionades
      .filter((f) => f.edit?.tipusSel === "nou")
      .map((f) => f.edit?.tipusCodi.trim().toUpperCase()),
  ).size;
  const nBens = seleccionades.filter(
    (f) => f.edit && esFilaAmortitzable(f.edit, tipus),
  ).length;
  const enProces = files.some(
    (f) => f.estat === "cua" || f.estat === "analitzant",
  );
  const nPendents = files.filter((f) => f.estat === "pendent").length;
  const hiHaRevisables = files.some(
    (f) =>
      f.estat === "revisio" ||
      f.estat === "rebutjada" ||
      f.estat === "confirmant",
  );
  const confirmades = files.filter((f) => f.estat === "confirmada");
  const totLlest =
    files.length > 0 &&
    !enProces &&
    confirmades.length > 0 &&
    files.every((f) => f.estat === "confirmada" || f.estat === "errada");

  const confirma = useCallback(async () => {
    if (seleccionades.length === 0 || incompletes.length > 0) return;
    setConfirmant(true);
    const ids = seleccionades.map((f) => f.clientId);
    setFiles((prev) =>
      prev.map((f) =>
        ids.includes(f.clientId) ? { ...f, estat: "confirmant" } : f,
      ),
    );

    const payload = seleccionades.map((f) => {
      const e = f.edit as EditRow;
      return {
        fitxerKey: f.fitxerKey as string,
        nomFitxer: f.nomFitxer,
        dataFactura: e.dataFactura,
        numFactura: e.numFactura,
        descripcio: e.descripcio,
        import: e.importTotal,
        proveidor:
          e.proveidorSel === "cap"
            ? { mode: "cap" as const }
            : e.proveidorSel === "nou"
              ? {
                  mode: "nou" as const,
                  nif: e.provNif,
                  nom: e.provNom,
                  adreca: e.provAdreca,
                  codiPostal: e.provCodiPostal,
                  poblacio: e.provPoblacio,
                  email: e.provEmail,
                  telefon: e.provTelefon,
                }
              : { mode: "existent" as const, id: e.proveidorSel },
        tipus:
          e.tipusSel === "nou"
            ? {
                mode: "nou" as const,
                codi: e.tipusCodi,
                descripcio: e.tipusDescripcio,
                deduible: e.tipusDeduible,
                esAmortitzable: e.tipusEsAmortitzable,
                grup: e.tipusGrup ? Number(e.tipusGrup) : null,
              }
            : { mode: "existent" as const, id: e.tipusSel },
      };
    });

    const res = await confirmaImportacioAction(payload);
    setConfirmant(false);

    if (res.error || !res.resum) {
      toast.error(res.error ?? "Error inesperat");
      setFiles((prev) =>
        prev.map((f) =>
          ids.includes(f.clientId) ? { ...f, estat: "revisio" } : f,
        ),
      );
      return;
    }

    const perKey = new Map(res.resum.files.map((r) => [r.fitxerKey, r]));
    setFiles((prev) =>
      prev.map((f) => {
        if (!ids.includes(f.clientId)) return f;
        const r = f.fitxerKey ? perKey.get(f.fitxerKey) : undefined;
        if (!r) return { ...f, estat: "revisio" };
        return r.ok
          ? {
              ...f,
              estat: "confirmada",
              seleccionada: false,
              despesaId: r.despesaId ?? null,
              resultatFlags: {
                proveidorCreat: r.proveidorCreat,
                tipusCreat: r.tipusCreat,
                beCreat: r.beCreat,
              },
            }
          : { ...f, estat: "rebutjada", error: r.error ?? "Error" };
      }),
    );

    const { despesesCreades, proveidorsCreats, tipusCreats, bensCreats } =
      res.resum;
    const fallades = res.resum.files.filter((r) => !r.ok).length;
    const parts = [
      `${despesesCreades} ${despesesCreades === 1 ? "despesa creada" : "despeses creades"}`,
    ];
    if (proveidorsCreats > 0) parts.push(`${proveidorsCreats} proveïdor(s) nou(s)`);
    if (tipusCreats > 0) parts.push(`${tipusCreats} tipus nou(s)`);
    if (bensCreats > 0) parts.push(`${bensCreats} bé(ns) d'inventari`);
    if (fallades > 0) {
      toast.warning(`${parts.join(", ")} — ${fallades} fila/es amb error.`);
    } else {
      toast.success(parts.join(", ") + ".");
    }
  }, [seleccionades, incompletes.length]);

  // --- Render ---------------------------------------------------------------

  if (files.length === 0) {
    return (
      <Dropzone
        arrossegant={arrossegant}
        setArrossegant={setArrossegant}
        inputRef={inputRef}
        onFiles={afegeixFitxers}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra superior: progrés del lot + accions del lot */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {enProces ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              Llegint {files.filter((f) => f.estat === "analitzant").length} de{" "}
              {files.filter((f) => f.estat !== "confirmada").length} fitxers…
            </span>
          ) : nPendents > 0 ? (
            `${nPendents} fitxer(s) a punt d'escanejar — repassa la llista i treu el que no toqui`
          ) : (
            `${files.length} fitxer(s) al lot · ${confirmades.length} confirmat(s)`
          )}
        </p>
        <div className="flex items-center gap-2">
          {nPendents > 0 && (
            <Button size="sm" onClick={escaneja}>
              <Sparkles className="size-4" />
              Escaneja amb IA ({nPendents})
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) afegeixFitxers(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={files.length >= IMPORTACIO_MAX_FITXERS}
          >
            <FilePlus2 className="size-4" />
            Afegeix més PDF
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
                Descarta-ho tot
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Descartar el lot</AlertDialogTitle>
                <AlertDialogDescription>
                  S&apos;esborraran els PDF pujats de les files no confirmades
                  i es buidarà la taula. Les despeses ja confirmades no es
                  toquen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel·la</AlertDialogCancel>
                <AlertDialogAction
                  onClick={descartaTot}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Descarta-ho
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Taula de revisió. min-w evita que les columnes s'esclafin: si no hi
          cap, apareix scroll horitzontal (mateix criteri que la resta de
          taules del repo a tauleta). */}
      <div className="overflow-x-auto border-t border-foreground">
        <Table className="min-w-[1160px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    seleccionades.length > 0 &&
                    seleccionades.length ===
                      files.filter(
                        (f) => f.estat === "revisio" || f.estat === "rebutjada",
                      ).length
                  }
                  onCheckedChange={(v) =>
                    setFiles((prev) =>
                      prev.map((f) =>
                        f.estat === "revisio" || f.estat === "rebutjada"
                          ? { ...f, seleccionada: v === true }
                          : f,
                      ),
                    )
                  }
                  aria-label="Selecciona totes les files"
                />
              </TableHead>
              {[
                "Fitxer",
                "Data factura",
                "Núm. factura",
                "Concepte",
                "Import",
                "Proveïdor",
                "Tipus",
                "",
              ].map((titol, i) => (
                <TableHead
                  key={i}
                  className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                >
                  {titol}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((fila) => (
              <ImportRow
                key={fila.clientId}
                fila={fila}
                tipus={tipus}
                proveidors={proveidors}
                onEdit={editaFila}
                onToggleSeleccio={(id) =>
                  setFiles((prev) =>
                    prev.map((f) =>
                      f.clientId === id
                        ? { ...f, seleccionada: !f.seleccionada }
                        : f,
                    ),
                  )
                }
                onToggleExpand={(id) =>
                  setFiles((prev) =>
                    prev.map((f) =>
                      f.clientId === id ? { ...f, expandida: !f.expandida } : f,
                    ),
                  )
                }
                onRemove={treuFila}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Lot acabat: enllaç de sortida */}
      {totLlest && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4 animate-in fade-in duration-300">
          <p className="text-sm">
            <Sparkles className="mr-1.5 inline size-4 text-primary" />
            Lot importat: {confirmades.length}{" "}
            {confirmades.length === 1 ? "despesa creada" : "despeses creades"}.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={descartaTot}>
              Importa&apos;n més
            </Button>
            <Button asChild size="sm">
              <Link href="/despeses">
                Ves a despeses
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Barra de confirmació flotant: només quan ja hi ha files escanejades */}
      {!totLlest && hiHaRevisables && (
        <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/90 px-5 py-3.5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="text-sm">
            <p className="font-medium">
              {seleccionades.length}{" "}
              {seleccionades.length === 1
                ? "factura seleccionada"
                : "factures seleccionades"}
            </p>
            <p className="text-xs text-muted-foreground">
              {seleccionades.length > 0 &&
                `Es crearan ${nProveidorsNous} proveïdor(s) i ${nTipusNous} tipus nou(s); ${nBens} bé(ns) d'inventari.`}
              {incompletes.length > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  {" "}
                  Hi ha {incompletes.length} fila/es incompleta/es.
                </span>
              )}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={
                  confirmant ||
                  seleccionades.length === 0 ||
                  incompletes.length > 0
                }
              >
                {confirmant ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creant…
                  </>
                ) : (
                  <>
                    Confirma les seleccionades
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar la importació</AlertDialogTitle>
                <AlertDialogDescription>
                  Es crearan {seleccionades.length}{" "}
                  {seleccionades.length === 1 ? "despesa" : "despeses"} amb el
                  PDF adjunt
                  {nProveidorsNous > 0 &&
                    `, ${nProveidorsNous} proveïdor(s) nou(s)`}
                  {nTipusNous > 0 && `, ${nTipusNous} tipus de despesa nou(s)`}
                  {nBens > 0 && ` i ${nBens} bé(ns) d'inventari`}. Cada fila es
                  processa de manera independent: si alguna falla, la resta es
                  creen igualment.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel·la</AlertDialogCancel>
                <AlertDialogAction onClick={() => void confirma()}>
                  Confirma
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dropzone inicial
// ---------------------------------------------------------------------------

/**
 * Recorre recursivament les entrades d'un drop (fitxers I carpetes) i en
 * retorna els Files. Les entrades s'han de capturar SÍNCRONAMENT dins del
 * handler del drop (el DataTransfer caduca); per això rebem els entries ja
 * extrets. Fallback: si el navegador no exposa webkitGetAsEntry, es fan
 * servir els fitxers plans del drop.
 */
async function recorreEntrades(
  entrades: FileSystemEntry[],
): Promise<{ files: File[]; deCarpeta: boolean }> {
  const files: File[] = [];
  let deCarpeta = false;

  async function camina(entry: FileSystemEntry): Promise<void> {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject),
      );
      files.push(file);
      return;
    }
    if (entry.isDirectory) {
      deCarpeta = true;
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      // readEntries retorna per lots: cal repetir fins que vingui buit.
      let lot: FileSystemEntry[];
      do {
        lot = await new Promise<FileSystemEntry[]>((resolve, reject) =>
          reader.readEntries(resolve, reject),
        );
        for (const e of lot) await camina(e);
      } while (lot.length > 0);
    }
  }

  for (const e of entrades) await camina(e);
  return { files, deCarpeta };
}

function Dropzone({
  arrossegant,
  setArrossegant,
  inputRef,
  onFiles,
}: {
  arrossegant: boolean;
  setArrossegant: (v: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFiles: (files: FileList | File[]) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Zona per deixar anar els PDF de factures"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setArrossegant(true);
      }}
      onDragLeave={() => setArrossegant(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrossegant(false);
        // Captura els entries ara mateix (el DataTransfer caduca en sortir
        // del handler) i després recorre carpetes de manera asíncrona.
        const entrades = Array.from(e.dataTransfer.items ?? [])
          .map((item) => item.webkitGetAsEntry?.())
          .filter((entry): entry is FileSystemEntry => entry != null);
        const fitxersPlans = Array.from(e.dataTransfer.files);

        if (entrades.length === 0) {
          onFiles(fitxersPlans);
          return;
        }
        void recorreEntrades(entrades).then(({ files, deCarpeta }) => {
          if (!deCarpeta) {
            onFiles(files);
            return;
          }
          // D'una carpeta només interessen els PDF; la resta s'ignora
          // silenciosament (avisant del recompte) en lloc d'omplir la
          // taula d'errors amb fitxers que l'usuari no ha triat un a un.
          const pdfs = files.filter(
            (f) =>
              f.type === "application/pdf" ||
              f.name.toLowerCase().endsWith(".pdf"),
          );
          if (pdfs.length === 0) {
            toast.warning("La carpeta no conté cap PDF.");
            return;
          }
          if (pdfs.length < files.length) {
            toast.info(
              `S'han agafat ${pdfs.length} PDF de la carpeta (${files.length - pdfs.length} fitxers d'altres tipus ignorats).`,
            );
          }
          onFiles(pdfs);
        });
      }}
      className={cn(
        "group relative flex min-h-72 cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border-2 border-dashed border-border bg-card/40 px-6 py-14 text-center transition-all",
        arrossegant
          ? "scale-[1.01] border-primary bg-primary/5"
          : "hover:border-primary/50 hover:bg-card/70",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <span
        className={cn(
          "flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform",
          arrossegant ? "scale-110" : "group-hover:scale-105",
        )}
      >
        <ScanSearch className="size-8" />
      </span>

      <div className="space-y-1.5">
        <p className="text-lg font-medium">
          {arrossegant
            ? "Deixa'ls anar!"
            : "Arrossega aquí els PDF de factures"}
        </p>
        <p className="text-sm text-muted-foreground">
          o fes clic per triar-los — també hi pots deixar anar una carpeta
          sencera · fins a {IMPORTACIO_MAX_FITXERS} fitxers · màx. 5 MB
          cadascun
        </p>
      </div>

      <p className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        <Sparkles className="size-3.5 text-primary" />
        Res no s&apos;escaneja fins que tu ho engeguis · revisió sempre manual
      </p>
    </div>
  );
}
