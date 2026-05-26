/**
 * Display helpers for currency and dates. The domain layer keeps `import`
 * as a precision-safe string (Prisma.Decimal.toString()) and `Date` for
 * timestamps; these helpers convert them to the local catalan display
 * format. Used by tables, detail pages and other UI.
 */

const CURRENCY_FORMATTER = new Intl.NumberFormat("ca-ES", {
  style: "currency",
  currency: "EUR",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("ca-ES", {
  dateStyle: "medium",
});

/** Format an amount stored as a decimal string (e.g. "123.45") as "123,45 €". */
export function formatCurrency(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return CURRENCY_FORMATTER.format(n);
}

/** Format a Date as a local catalan date (e.g. "15 de gen. de 2026"). */
export function formatDate(d: Date): string {
  return DATE_FORMATTER.format(d);
}
