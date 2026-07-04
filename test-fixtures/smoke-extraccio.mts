/**
 * Smoke test de l'extracció (IA-23) contra l'API real d'Anthropic, sense UI.
 *
 * Prova el repositori d'extracció amb tres fixtures: un PDF de text, un
 * d'escanejat (només imatge → visió) i un de corrupte (ha de fallar amb un
 * BusinessError controlat).
 *
 * Execució (des de l'arrel del repo):  npx tsx test-fixtures/smoke-extraccio.mts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));

// Carrega el .env manualment (cal fer-ho ABANS d'importar el client, que
// llegeix ANTHROPIC_API_KEY al constructor).
for (const line of readFileSync(join(DIR, "..", ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { extraccioRepository } = await import(
  "../src/repositories/extraccio-repository"
);

// Catàleg de la BD de demo (seed-demo.sql).
const CATALEG = [
  { codi: "MAT", descripcio: "Material dental fungible", esAmortitzable: false },
  { codi: "LLOG", descripcio: "Lloguer del local", esAmortitzable: false },
  { codi: "SUBM", descripcio: "Subministraments", esAmortitzable: false },
  { codi: "EQUIP", descripcio: "Equipament i mobiliari", esAmortitzable: true },
  { codi: "NET", descripcio: "Neteja i desinfecció", esAmortitzable: false },
  { codi: "FORM", descripcio: "Formació i congressos", esAmortitzable: false },
  { codi: "ASSEG", descripcio: "Assegurances", esAmortitzable: false },
  { codi: "GEST", descripcio: "Serveis professionals", esAmortitzable: false },
];

const FIXTURES = [
  "factura-hs-material.pdf",
  "factura-scan-protesic.pdf",
  "factura-illegible.pdf",
];

for (const fixture of FIXTURES) {
  console.log(`\n=== ${fixture} ===`);
  const t0 = Date.now();
  try {
    const res = await extraccioRepository.extreuFactura(
      readFileSync(join(DIR, fixture)),
      CATALEG,
    );
    console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.log(
      `(${((Date.now() - t0) / 1000).toFixed(1)}s) ERROR CONTROLAT: ${(err as Error).name} — ${(err as Error).message}`,
    );
  }
}
