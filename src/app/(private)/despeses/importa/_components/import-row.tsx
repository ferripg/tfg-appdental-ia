"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableCell, TableRow } from "@/components/ui/table";
import type {
  FacturaExtreta,
  ImportacioMatching,
} from "@/domain/importacio";
import { cn } from "@/lib/utils";

/**
 * Fila de la taula de revisió de la importació IA: tots els camps editables
 * inline, amb un panell expandible per al desglossament d'IVA i els
 * subformularis de proveïdor/tipus NOU. Els camps que Claude ha marcat com a
 * dubtosos es ressalten en àmbar.
 */

export type TipusOption = {
  id: string;
  codi: string;
  descripcio: string;
  esAmortitzable: boolean;
};

export type ProveidorOption = { id: string; nom: string; nif: string };

export type FilaEstat =
  | "pendent" // triat però encara no enviat a escanejar (fase de selecció)
  | "cua"
  | "analitzant"
  | "revisio"
  | "errada"
  | "confirmant"
  | "confirmada"
  | "rebutjada";

/** Estat editable d'una fila (tot strings, com un formulari HTML). */
export type EditRow = {
  dataFactura: string;
  numFactura: string;
  descripcio: string;
  importTotal: string;
  baseImposable: string;
  ivaPercentatge: string;
  ivaImport: string;
  proveidorSel: string; // "cap" | "nou" | id d'un proveïdor existent
  provNif: string;
  provNom: string;
  provAdreca: string;
  provCodiPostal: string;
  provPoblacio: string;
  provEmail: string;
  provTelefon: string;
  tipusSel: string; // "" | "nou" | id d'un tipus existent
  tipusCodi: string;
  tipusDescripcio: string;
  tipusDeduible: boolean;
  tipusEsAmortitzable: boolean;
  tipusGrup: string; // "" | "1".."9"
};

export type FilaImport = {
  clientId: string;
  nomFitxer: string;
  estat: FilaEstat;
  fitxerKey: string | null;
  error: string | null;
  extraccio: FacturaExtreta | null;
  matching: ImportacioMatching | null;
  edit: EditRow | null;
  seleccionada: boolean;
  expandida: boolean;
  despesaId: string | null;
  resultatFlags: {
    proveidorCreat?: boolean;
    tipusCreat?: boolean;
    beCreat?: boolean;
  } | null;
};

/**
 * Mateix idioma visual que els selects natius dels filtres del repo, amb
 * `truncate` + padding dret extra perquè els noms llargs no quedin mai sota
 * la fletxa del desplegable.
 */
const SELECT_CLASS =
  "h-8 w-full min-w-0 truncate rounded-lg border border-input bg-transparent py-1 pl-2.5 pr-7 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const DUBTOS_CLASS =
  "border-amber-500/70 ring-1 ring-amber-500/50 focus-visible:ring-amber-500/50";

export function esFilaAmortitzable(
  edit: EditRow,
  tipus: TipusOption[],
): boolean {
  if (edit.tipusSel === "nou") return edit.tipusEsAmortitzable;
  return tipus.find((t) => t.id === edit.tipusSel)?.esAmortitzable ?? false;
}

/** Problemes que impedeixen confirmar la fila (llista buida = fila a punt). */
export function validaFila(edit: EditRow, tipus: TipusOption[]): string[] {
  const problemes: string[] = [];
  if (!edit.dataFactura) problemes.push("Falta la data de factura");
  if (!edit.descripcio.trim()) problemes.push("Falta el concepte");
  const importNorm = edit.importTotal.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(importNorm) || Number(importNorm) <= 0) {
    problemes.push("Import total no vàlid");
  }
  if (!edit.tipusSel) {
    problemes.push("Selecciona el tipus de despesa");
  } else if (
    edit.tipusSel === "nou" &&
    (!/^[A-Za-z0-9]{2,10}$/.test(edit.tipusCodi.trim()) ||
      edit.tipusDescripcio.trim().length < 2)
  ) {
    problemes.push("Completa el tipus nou (codi de 2-10 alfanumèrics i descripció)");
  }
  if (
    edit.proveidorSel === "nou" &&
    (!edit.provNif.trim() || !edit.provNom.trim())
  ) {
    problemes.push("Completa el proveïdor nou (NIF i nom)");
  }
  if (esFilaAmortitzable(edit, tipus) && edit.proveidorSel === "cap") {
    problemes.push("El tipus és amortitzable: cal proveïdor per generar el bé");
  }
  return problemes;
}

/** Quadratura base + quota ≈ total (tolerància d'1 cèntim i mig). */
function quadraIva(edit: EditRow): boolean | null {
  const base = Number(edit.baseImposable.replace(",", "."));
  const quota = Number(edit.ivaImport.replace(",", "."));
  const total = Number(edit.importTotal.replace(",", "."));
  if (![base, quota, total].every(Number.isFinite)) return null;
  if (edit.baseImposable === "" || edit.ivaImport === "" || edit.importTotal === "")
    return null;
  return Math.abs(base + quota - total) <= 0.015;
}

type Props = {
  fila: FilaImport;
  tipus: TipusOption[];
  proveidors: ProveidorOption[];
  onEdit: (clientId: string, patch: Partial<EditRow>) => void;
  onToggleSeleccio: (clientId: string) => void;
  onToggleExpand: (clientId: string) => void;
  onRemove: (clientId: string) => void;
};

export function ImportRow({
  fila,
  tipus,
  proveidors,
  onEdit,
  onToggleSeleccio,
  onToggleExpand,
  onRemove,
}: Props) {
  const { edit } = fila;
  const editable =
    (fila.estat === "revisio" || fila.estat === "rebutjada") && edit !== null;
  const dubtosos = new Set(fila.extraccio?.campsDubtosos ?? []);
  const dubtosClass = (camp: string) =>
    dubtosos.has(camp) ? DUBTOS_CLASS : undefined;
  const quadra = edit ? quadraIva(edit) : null;
  const problemes = editable && edit ? validaFila(edit, tipus) : [];

  // --- Files sense extracció (cua / analitzant / errada) -------------------
  if (!editable || !edit) {
    return (
      <TableRow className="animate-in fade-in slide-in-from-bottom-1 duration-300">
        <TableCell />
        <TableCell colSpan={7}>
          <div className="flex items-center gap-3">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="max-w-56 truncate text-sm font-medium">
              {fila.nomFitxer}
            </span>
            {fila.estat === "pendent" && (
              <Badge variant="outline" className="text-muted-foreground">
                Pendent d&apos;escanejar
              </Badge>
            )}
            {fila.estat === "cua" && (
              <Badge variant="secondary" className="text-muted-foreground">
                En cua
              </Badge>
            )}
            {fila.estat === "analitzant" && (
              <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                <Loader2 className="size-3.5 animate-spin" />
                Llegint amb IA…
              </span>
            )}
            {fila.estat === "errada" && (
              <>
                <Badge variant="destructive">No s&apos;ha pogut llegir</Badge>
                <span className="text-xs text-destructive">{fila.error}</span>
              </>
            )}
            {fila.estat === "confirmada" && (
              <ConfirmadaInfo fila={fila} />
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          {(fila.estat === "pendent" ||
            fila.estat === "errada" ||
            fila.estat === "cua") && (
            <BotoTreu onClick={() => onRemove(fila.clientId)} />
          )}
        </TableCell>
      </TableRow>
    );
  }

  // --- Fila editable (revisió / rebutjada / confirmant / confirmada) -------
  return (
    <>
      <TableRow
        data-estat={fila.estat}
        onClick={(e) => {
          // Clic a qualsevol punt "buit" de la fila = desplegar/replegar.
          // Els clics sobre camps, botons i enllaços no hi interfereixen.
          const target = e.target as HTMLElement;
          if (target.closest("input,select,button,a,label,[role='checkbox']"))
            return;
          onToggleExpand(fila.clientId);
        }}
        className={cn(
          "animate-in fade-in slide-in-from-bottom-1 cursor-pointer align-top duration-300",
          fila.estat === "confirmant" && "opacity-60",
          fila.estat === "confirmada" && "bg-primary/[0.03]",
        )}
      >
        <TableCell className="pt-3.5">
          {fila.estat === "confirmada" ? (
            <CheckCircle2 className="size-4 text-primary" />
          ) : (
            <Checkbox
              checked={fila.seleccionada}
              onCheckedChange={() => onToggleSeleccio(fila.clientId)}
              disabled={fila.estat === "confirmant"}
              aria-label={`Selecciona ${fila.nomFitxer}`}
            />
          )}
        </TableCell>

        {/* Fitxer + badges de situació */}
        <TableCell className="min-w-44 max-w-56">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-xs font-medium" title={fila.nomFitxer}>
                {fila.nomFitxer}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              <BadgesSituacio fila={fila} edit={edit} tipus={tipus} quadra={quadra} />
            </div>
            {fila.estat === "rebutjada" && fila.error && (
              <p className="text-xs text-destructive">{fila.error}</p>
            )}
            {problemes.length > 0 && fila.seleccionada && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {problemes[0]}
              </p>
            )}
          </div>
        </TableCell>

        {/* Data factura */}
        <TableCell className="min-w-36">
          <Input
            type="date"
            value={edit.dataFactura}
            onChange={(e) => onEdit(fila.clientId, { dataFactura: e.target.value })}
            disabled={!potEditar(fila)}
            aria-label="Data de factura"
            className={cn("h-8 font-mono text-xs", dubtosClass("dataFactura"))}
          />
        </TableCell>

        {/* Núm. factura */}
        <TableCell className="min-w-32">
          <Input
            value={edit.numFactura}
            onChange={(e) => onEdit(fila.clientId, { numFactura: e.target.value })}
            disabled={!potEditar(fila)}
            placeholder="—"
            aria-label="Número de factura"
            className={cn("h-8 font-mono text-xs", dubtosClass("numFactura"))}
          />
        </TableCell>

        {/* Concepte */}
        <TableCell className="min-w-52">
          <Input
            value={edit.descripcio}
            onChange={(e) => onEdit(fila.clientId, { descripcio: e.target.value })}
            disabled={!potEditar(fila)}
            placeholder="Concepte de la despesa"
            aria-label="Concepte"
            className={cn("h-8 text-xs", dubtosClass("concepte"))}
          />
        </TableCell>

        {/* Import total: min-w garanteix que "3.490,00 €" es vegi sencer */}
        <TableCell className="min-w-32">
          <div className="relative">
            <Input
              value={edit.importTotal}
              onChange={(e) => onEdit(fila.clientId, { importTotal: e.target.value })}
              disabled={!potEditar(fila)}
              inputMode="decimal"
              placeholder="0.00"
              aria-label="Import total"
              className={cn(
                "h-8 pr-6 text-right font-mono text-xs tabular-nums",
                dubtosClass("total"),
              )}
            />
            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">
              €
            </span>
          </div>
        </TableCell>

        {/* Proveïdor */}
        <TableCell className="min-w-48">
          <select
            value={edit.proveidorSel}
            onChange={(e) => onEdit(fila.clientId, { proveidorSel: e.target.value })}
            disabled={!potEditar(fila)}
            aria-label="Proveïdor"
            title={
              proveidors.find((p) => p.id === edit.proveidorSel)?.nom ??
              (edit.proveidorSel === "nou" ? edit.provNom : undefined)
            }
            className={cn(SELECT_CLASS, dubtosClass("nif"))}
          >
            <option value="cap">— Sense proveïdor —</option>
            <option value="nou">
              ＋ Crea&apos;l nou{edit.provNom ? `: ${edit.provNom}` : ""}
            </option>
            {proveidors.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom} ({p.nif})
              </option>
            ))}
          </select>
        </TableCell>

        {/* Tipus de despesa */}
        <TableCell className="min-w-44">
          <select
            value={edit.tipusSel}
            onChange={(e) => onEdit(fila.clientId, { tipusSel: e.target.value })}
            disabled={!potEditar(fila)}
            aria-label="Tipus de despesa"
            title={
              tipus.find((t) => t.id === edit.tipusSel)?.descripcio ??
              (edit.tipusSel === "nou" ? edit.tipusDescripcio : undefined)
            }
            className={SELECT_CLASS}
          >
            <option value="">— Tria un tipus —</option>
            <option value="nou">
              ＋ Crea&apos;l nou{edit.tipusCodi ? `: ${edit.tipusCodi}` : ""}
            </option>
            {tipus.map((t) => (
              <option key={t.id} value={t.id}>
                {t.codi} — {t.descripcio}
              </option>
            ))}
          </select>
        </TableCell>

        {/* Expandir / treure */}
        <TableCell className="w-20 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={() => onToggleExpand(fila.clientId)}
            aria-label="Mostra el detall de la fila"
            aria-expanded={fila.expandida}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                fila.expandida && "rotate-180",
              )}
            />
          </button>
          {fila.estat !== "confirmada" && fila.estat !== "confirmant" && (
            <BotoTreu onClick={() => onRemove(fila.clientId)} />
          )}
        </TableCell>
      </TableRow>

      {/* Panell expandit: IVA + subformularis de proveïdor/tipus nou */}
      {fila.expandida && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell />
          <TableCell colSpan={8} className="py-4">
            <div className="grid gap-6 lg:grid-cols-3">
              <PanellIva
                fila={fila}
                edit={edit}
                quadra={quadra}
                dubtosClass={dubtosClass}
                onEdit={onEdit}
              />
              <PanellProveidorNou
                fila={fila}
                edit={edit}
                dubtosClass={dubtosClass}
                onEdit={onEdit}
              />
              <PanellTipusNou fila={fila} edit={edit} onEdit={onEdit} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function potEditar(fila: FilaImport): boolean {
  return fila.estat === "revisio" || fila.estat === "rebutjada";
}

function BotoTreu({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Treu aquesta fila"
      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
    >
      <X className="size-4" />
    </button>
  );
}

function ConfirmadaInfo({ fila }: { fila: FilaImport }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Badge className="bg-primary/15 text-primary">Creada</Badge>
      {fila.despesaId && (
        <Link
          href={`/despeses/${fila.despesaId}`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2"
        >
          Veure despesa
          <ExternalLink className="size-3" />
        </Link>
      )}
    </span>
  );
}

function BadgesSituacio({
  fila,
  edit,
  tipus,
  quadra,
}: {
  fila: FilaImport;
  edit: EditRow;
  tipus: TipusOption[];
  quadra: boolean | null;
}) {
  const ambre =
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  const confianca = fila.extraccio?.confianca;

  return (
    <>
      {fila.estat === "confirmada" && <ConfirmadaInfo fila={fila} />}
      {fila.estat === "confirmant" && (
        <span className="inline-flex items-center gap-1 text-xs text-primary">
          <Loader2 className="size-3 animate-spin" /> Creant…
        </span>
      )}
      {confianca === "mitjana" && (
        <Badge variant="outline" className={ambre}>
          Confiança mitjana
        </Badge>
      )}
      {confianca === "baixa" && (
        <Badge variant="destructive">Confiança baixa</Badge>
      )}
      {fila.matching?.proveidorMatch === "nom" &&
        edit.proveidorSel === fila.matching.proveidorId && (
          <Badge variant="outline" className={ambre}>
            <AlertTriangle />
            Aparellat pel nom
          </Badge>
        )}
      {fila.matching?.duplicat && (
        <Badge variant="outline" className={ambre}>
          <AlertTriangle />
          Possible duplicat
        </Badge>
      )}
      {edit.proveidorSel === "nou" && (
        <Badge variant="outline">Proveïdor nou</Badge>
      )}
      {edit.tipusSel === "nou" && <Badge variant="outline">Tipus nou</Badge>}
      {esFilaAmortitzable(edit, tipus) && (
        <Badge variant="outline" className="border-primary/40 text-primary">
          Generarà bé d&apos;inventari
        </Badge>
      )}
      {quadra === false && (
        <Badge variant="outline" className={ambre}>
          <AlertTriangle />
          L&apos;IVA no quadra
        </Badge>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Panells del detall expandit
// ---------------------------------------------------------------------------

function CampPetit({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] uppercase tracking-wider">
        {label}
      </Label>
      {children}
    </div>
  );
}

function PanellIva({
  fila,
  edit,
  quadra,
  dubtosClass,
  onEdit,
}: {
  fila: FilaImport;
  edit: EditRow;
  quadra: boolean | null;
  dubtosClass: (camp: string) => string | undefined;
  onEdit: Props["onEdit"];
}) {
  const id = fila.clientId;
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Desglossament (només revisió)
      </legend>
      <div className="grid grid-cols-3 gap-2">
        <CampPetit id={`base-${id}`} label="Base">
          <Input
            id={`base-${id}`}
            value={edit.baseImposable}
            onChange={(e) => onEdit(id, { baseImposable: e.target.value })}
            disabled={!potEditar(fila)}
            inputMode="decimal"
            className={cn(
              "h-8 text-right font-mono text-xs tabular-nums",
              dubtosClass("baseImposable"),
            )}
          />
        </CampPetit>
        <CampPetit id={`ivapct-${id}`} label="% IVA">
          <Input
            id={`ivapct-${id}`}
            value={edit.ivaPercentatge}
            onChange={(e) => onEdit(id, { ivaPercentatge: e.target.value })}
            disabled={!potEditar(fila)}
            inputMode="decimal"
            className={cn(
              "h-8 text-right font-mono text-xs tabular-nums",
              dubtosClass("ivaPercentatge"),
            )}
          />
        </CampPetit>
        <CampPetit id={`ivaimp-${id}`} label="Quota IVA">
          <Input
            id={`ivaimp-${id}`}
            value={edit.ivaImport}
            onChange={(e) => onEdit(id, { ivaImport: e.target.value })}
            disabled={!potEditar(fila)}
            inputMode="decimal"
            className={cn(
              "h-8 text-right font-mono text-xs tabular-nums",
              dubtosClass("ivaImport"),
            )}
          />
        </CampPetit>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {quadra === true && (
          <>
            <CheckCircle2 className="size-3.5 text-primary" />
            Base + quota quadren amb el total.
          </>
        )}
        {quadra === false && (
          <>
            <AlertTriangle className="size-3.5 text-amber-500" />
            Base + quota no quadren amb el total; revisa els imports.
          </>
        )}
        {quadra === null && "Aquests camps només serveixen per validar el total: no es desen."}
      </p>
    </fieldset>
  );
}

function PanellProveidorNou({
  fila,
  edit,
  dubtosClass,
  onEdit,
}: {
  fila: FilaImport;
  edit: EditRow;
  dubtosClass: (camp: string) => string | undefined;
  onEdit: Props["onEdit"];
}) {
  const id = fila.clientId;
  if (edit.proveidorSel !== "nou") {
    return (
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Proveïdor
        </p>
        <p className="text-sm text-muted-foreground">
          {edit.proveidorSel === "cap"
            ? "La despesa es crearà sense proveïdor."
            : "S'usarà el proveïdor existent seleccionat; la seva fitxa no es modifica."}
        </p>
      </div>
    );
  }
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Proveïdor nou (es crearà)
      </legend>
      <div className="grid grid-cols-2 gap-2">
        <CampPetit id={`pnif-${id}`} label="NIF *">
          <Input
            id={`pnif-${id}`}
            value={edit.provNif}
            onChange={(e) => onEdit(id, { provNif: e.target.value })}
            disabled={!potEditar(fila)}
            className={cn("h-8 font-mono text-xs uppercase", dubtosClass("nif"))}
          />
        </CampPetit>
        <CampPetit id={`pnom-${id}`} label="Nom *">
          <Input
            id={`pnom-${id}`}
            value={edit.provNom}
            onChange={(e) => onEdit(id, { provNom: e.target.value })}
            disabled={!potEditar(fila)}
            className={cn("h-8 text-xs", dubtosClass("nom"))}
          />
        </CampPetit>
        <div className="col-span-2">
          <CampPetit id={`padr-${id}`} label="Adreça">
            <Input
              id={`padr-${id}`}
              value={edit.provAdreca}
              onChange={(e) => onEdit(id, { provAdreca: e.target.value })}
              disabled={!potEditar(fila)}
              className="h-8 text-xs"
            />
          </CampPetit>
        </div>
        <CampPetit id={`pcp-${id}`} label="Codi postal">
          <Input
            id={`pcp-${id}`}
            value={edit.provCodiPostal}
            onChange={(e) => onEdit(id, { provCodiPostal: e.target.value })}
            disabled={!potEditar(fila)}
            className="h-8 font-mono text-xs"
          />
        </CampPetit>
        <CampPetit id={`ppob-${id}`} label="Població">
          <Input
            id={`ppob-${id}`}
            value={edit.provPoblacio}
            onChange={(e) => onEdit(id, { provPoblacio: e.target.value })}
            disabled={!potEditar(fila)}
            className="h-8 text-xs"
          />
        </CampPetit>
        <CampPetit id={`pmail-${id}`} label="Email">
          <Input
            id={`pmail-${id}`}
            value={edit.provEmail}
            onChange={(e) => onEdit(id, { provEmail: e.target.value })}
            disabled={!potEditar(fila)}
            type="email"
            className="h-8 text-xs"
          />
        </CampPetit>
        <CampPetit id={`ptel-${id}`} label="Telèfon">
          <Input
            id={`ptel-${id}`}
            value={edit.provTelefon}
            onChange={(e) => onEdit(id, { provTelefon: e.target.value })}
            disabled={!potEditar(fila)}
            className="h-8 font-mono text-xs"
          />
        </CampPetit>
      </div>
    </fieldset>
  );
}

function PanellTipusNou({
  fila,
  edit,
  onEdit,
}: {
  fila: FilaImport;
  edit: EditRow;
  onEdit: Props["onEdit"];
}) {
  const id = fila.clientId;
  if (edit.tipusSel !== "nou") {
    return (
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Tipus de despesa
        </p>
        <p className="text-sm text-muted-foreground">
          {edit.tipusSel
            ? "S'usarà el tipus existent seleccionat."
            : "Tria un tipus del desplegable o crea'n un de nou."}
        </p>
      </div>
    );
  }
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Tipus nou (es crearà)
      </legend>
      <div className="grid grid-cols-3 gap-2">
        <CampPetit id={`tcodi-${id}`} label="Codi *">
          <Input
            id={`tcodi-${id}`}
            value={edit.tipusCodi}
            onChange={(e) =>
              onEdit(id, { tipusCodi: e.target.value.toUpperCase() })
            }
            disabled={!potEditar(fila)}
            className="h-8 font-mono text-xs uppercase"
          />
        </CampPetit>
        <div className="col-span-2">
          <CampPetit id={`tdesc-${id}`} label="Descripció *">
            <Input
              id={`tdesc-${id}`}
              value={edit.tipusDescripcio}
              onChange={(e) => onEdit(id, { tipusDescripcio: e.target.value })}
              disabled={!potEditar(fila)}
              className="h-8 text-xs"
            />
          </CampPetit>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
        <label className="flex items-center gap-2 text-xs">
          <Checkbox
            checked={edit.tipusDeduible}
            onCheckedChange={(v) => onEdit(id, { tipusDeduible: v === true })}
            disabled={!potEditar(fila)}
          />
          Deduïble
        </label>
        <label className="flex items-center gap-2 text-xs">
          <Checkbox
            checked={edit.tipusEsAmortitzable}
            onCheckedChange={(v) =>
              onEdit(id, {
                tipusEsAmortitzable: v === true,
                // Heurística PGC: amortitzable ⇒ grup 2; corrent ⇒ grup 6.
                tipusGrup: v === true ? "2" : edit.tipusGrup === "2" ? "6" : edit.tipusGrup,
              })
            }
            disabled={!potEditar(fila)}
          />
          Amortitzable
        </label>
        <label className="flex items-center gap-2 text-xs">
          Grup PGC
          <select
            value={edit.tipusGrup}
            onChange={(e) => onEdit(id, { tipusGrup: e.target.value })}
            disabled={!potEditar(fila)}
            aria-label="Grup del PGC"
            className={cn(SELECT_CLASS, "h-8 w-16")}
          >
            <option value="">—</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
              <option key={g} value={String(g)}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  );
}
