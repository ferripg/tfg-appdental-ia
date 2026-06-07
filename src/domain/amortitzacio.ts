/**
 * Aritmètica d'amortització exacta.
 *
 * Tots els imports són Decimal(12,2) a la BD i viatgen com a string pel
 * domini (igual que les despeses). Per evitar errors de coma flotant
 * (0.1 + 0.2 !== 0.3) NO fem servir `number`: treballem en CÈNTIMS sencers
 * amb `bigint`. Cap dependència de Prisma/Decimal.js aquí — això manté el
 * càlcul pur i testable i respecta la regla hexagonal (@prisma/client només
 * a src/repositories/). El repositori crida aquestes funcions i persisteix
 * els strings resultants, que Prisma reaccepta sense perdre precisió.
 */

// Constants BigInt via `BigInt(n)` (no literals `0n`) per ser compatibles amb
// el target ES2017 del projecte sense tocar la config compartida.
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const HUNDRED = BigInt(100);
const TEN_THOUSAND = BigInt(10000);

/** "123.45" | "123" | "123.4" → 12345 cèntims. Tolera signe i 0-2 decimals. */
function toCents(value: string): bigint {
  const t = value.trim();
  const neg = t.startsWith("-");
  const [intPart, fracRaw = ""] = (neg ? t.slice(1) : t).split(".");
  const frac = (fracRaw + "00").slice(0, 2);
  const cents = BigInt(intPart || "0") * HUNDRED + BigInt(frac);
  return neg ? -cents : cents;
}

/** 12345 cèntims → "123.45". Sempre 2 decimals. */
function fromCents(cents: bigint): string {
  const neg = cents < ZERO;
  const abs = neg ? -cents : cents;
  const euros = abs / HUNDRED;
  const rest = abs % HUNDRED;
  return `${neg ? "-" : ""}${euros}.${rest.toString().padStart(2, "0")}`;
}

/**
 * Quota d'amortització lineal d'un exercici per a un bé.
 *
 * Lineal = importAdquisicio × percentatge / 100, acumulant sobre el que ja
 * s'ha amortitzat i SENSE passar-se del valor del bé (amortització fins a 0,
 * sense valor residual). L'últim exercici, doncs, pot quedar una quota
 * parcial que tanca exactament el valor.
 *
 * Retorna la quota d'aquest exercici i el nou total acumulat, tots dos com a
 * string "X.XX". Si el bé ja està totalment amortitzat (o el % és 0), la
 * quota és "0.00".
 */
export function calcularQuota(
  importAdquisicio: string,
  percentatge: string,
  importAmortitzat: string,
): { quota: string; nouAmortitzat: string } {
  const base = toCents(importAdquisicio);
  // El percentatge té 2 decimals (Decimal(5,2)); toCents el converteix a
  // "centèsimes de punt" (10.00% → 1000), de manera que base × pbp / 10000.
  const pbp = toCents(percentatge);
  const amortitzat = toCents(importAmortitzat);

  const restant = base - amortitzat;
  if (restant <= ZERO || pbp <= ZERO) {
    return { quota: "0.00", nouAmortitzat: fromCents(amortitzat) };
  }

  const producte = base * pbp;
  let anual = producte / TEN_THOUSAND;
  // Arrodoniment a la cèntima més propera (half-up), tot amb enters.
  if ((producte % TEN_THOUSAND) * TWO >= TEN_THOUSAND) anual += ONE;

  const quota = anual < restant ? anual : restant; // tope: no passar-se
  return {
    quota: fromCents(quota),
    nouAmortitzat: fromCents(amortitzat + quota),
  };
}

/** Suma exacta de dos imports. */
export function sumaImports(a: string, b: string): string {
  return fromCents(toCents(a) + toCents(b));
}

/** Resta exacta de dos imports (per revertir en retrocedir un exercici). */
export function restaImports(a: string, b: string): string {
  return fromCents(toCents(a) - toCents(b));
}

/** Valor net comptable = importAdquisicio − importAmortitzat. */
export function valorNet(
  importAdquisicio: string,
  importAmortitzat: string,
): string {
  return fromCents(toCents(importAdquisicio) - toCents(importAmortitzat));
}

/** True si el bé ja està totalment amortitzat (valor net ≤ 0). */
export function totalmentAmortitzat(
  importAdquisicio: string,
  importAmortitzat: string,
): boolean {
  return toCents(importAdquisicio) - toCents(importAmortitzat) <= ZERO;
}

/** Fila d'amortització d'un exercici, enriquida amb el bé, per a la UI. */
export type AmortitzacioWithBe = {
  inventariId: string;
  exercici: number;
  import: string;
  numInventari: string;
  descripcio: string;
};

/**
 * Estat global del procés d'amortització, calculat a partir de les dades:
 * - `ultimExercici`: últim exercici generat (null si cap).
 * - `proximExercici`: l'únic exercici que es pot generar a continuació
 *   (seqüencial, no es poden saltar anys). Null si no hi ha béns.
 */
export type EstatAmortitzacions = {
  ultimExercici: number | null;
  proximExercici: number | null;
};
