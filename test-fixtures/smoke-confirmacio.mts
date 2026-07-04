/**
 * Smoke test de la CONFIRMACIÓ de la importació IA (IA-23) contra el Postgres
 * i el MinIO reals, sense passar per Claude (l'extracció es prova a part).
 *
 * Exercita `importacioRepository.confirmRow` — la transacció per fila — en
 * tres escenaris i comprova el resultat directament a la BD:
 *   A) proveïdor NOU + tipus existent AMORTITZABLE → proveïdor + despesa + bé
 *   B) proveïdor NOU + tipus INEXISTENT → la transacció ha de fer ROLLBACK
 *      complet (el proveïdor no pot quedar orfe)
 *   C) tipus NOU + sense proveïdor → tipus + despesa, cap bé
 *
 * En acabar, desfà tot el que ha creat per deixar la BD de demo neta.
 *
 * Execució (des de l'arrel del repo):  npx tsx test-fixtures/smoke-confirmacio.mts
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));

for (const line of readFileSync(join(DIR, "..", ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const { importacioRepository } = await import(
  "../src/repositories/importacio-repository"
);
const { facturesRepository } = await import(
  "../src/repositories/factures-repository"
);
const { importacioConfirmRowSchema } = await import("../src/domain/importacio");
const { prisma } = await import("../src/repositories/prisma-client");

const USER_ID = "ovW6kDPSR5eLodD2tby8dHvo0QAfLCeA"; // admin del seed
const pdf = readFileSync(join(DIR, "factura-scan-quirumed.pdf"));

let exit = 0;
const creats: { despeses: string[]; proveidors: string[]; tipus: string[] } = {
  despeses: [],
  proveidors: [],
  tipus: [],
};

function ok(cond: boolean, missatge: string) {
  console.log(`${cond ? "  ✓" : "  ✗ FALLA"} ${missatge}`);
  if (!cond) exit = 1;
}

// --- Cas A: proveïdor nou + tipus amortitzable existent → bé generat --------
console.log("\n[A] proveïdor NOU + tipus EQUIP (amortitzable) → despesa + bé");
{
  const key = `import/${randomUUID()}.pdf`;
  await facturesRepository.upload(key, pdf, "application/pdf");

  const row = importacioConfirmRowSchema.parse({
    fitxerKey: key,
    nomFitxer: "factura-scan-quirumed.pdf",
    dataFactura: "2026-06-05",
    numFactura: "QM-26/1180",
    descripcio: "Autoclau de vapor classe B 23 L — STERIL-PRO",
    import: "3490.00",
    proveidor: {
      mode: "nou",
      nif: "B97045470",
      nom: "Quirumed S.L.U.",
      adreca: "Av. de la Plata 34",
      codiPostal: "46013",
      poblacio: "València",
      email: "vendes@quirumed.com",
      telefon: "963528803",
    },
    tipus: { mode: "existent", id: "demo-td-equip" },
  });

  const outcome = await importacioRepository.confirmRow(row, USER_ID);
  creats.despeses.push(outcome.despesaId);
  if (outcome.proveidorId) creats.proveidors.push(outcome.proveidorId);

  ok(outcome.proveidorCreat, "ha creat el proveïdor");
  ok(outcome.beCreat, "ha creat el bé d'inventari");

  const despesa = await prisma.despesa.findUnique({
    where: { id: outcome.despesaId },
    include: { proveidor: true, inventari: true },
  });
  ok(despesa?.fitxerKey === key, "la despesa té el PDF de staging com a adjunt");
  ok(despesa?.proveidor?.nif === "B97045470", "proveïdor amb NIF normalitzat");
  ok(
    despesa?.inventari?.importAdquisicio.toString() === "3490",
    `bé amb import heretat (${despesa?.inventari?.numInventari})`,
  );
}

// --- Cas B: tipus inexistent → rollback total --------------------------------
console.log("\n[B] tipus INEXISTENT → la transacció fa rollback del proveïdor");
{
  const row = importacioConfirmRowSchema.parse({
    fitxerKey: `import/${randomUUID()}.pdf`,
    nomFitxer: "rollback.pdf",
    dataFactura: "2026-06-12",
    numFactura: "LPG-2026-231",
    descripcio: "Fila que ha de fallar",
    import: "979.00",
    proveidor: {
      mode: "nou",
      nif: "B67425181",
      nom: "Laboratori Protèsic Garraf SL",
      adreca: "",
      codiPostal: "",
      poblacio: "",
      email: "",
      telefon: "",
    },
    tipus: { mode: "existent", id: "id-que-no-existeix" },
  });

  let haFallat = false;
  try {
    await importacioRepository.confirmRow(row, USER_ID);
  } catch {
    haFallat = true;
  }
  ok(haFallat, "la fila ha fallat (tipus no trobat)");

  const orfe = await prisma.proveidor.findUnique({
    where: { nif: "B67425181" },
  });
  ok(orfe === null, "el proveïdor NO ha quedat creat (rollback atòmic)");
}

// --- Cas C: tipus nou + sense proveïdor → tipus + despesa, cap bé ------------
console.log("\n[C] tipus NOU (PROT) sense proveïdor → tipus + despesa, cap bé");
{
  const key = `import/${randomUUID()}.pdf`;
  await facturesRepository.upload(key, pdf, "application/pdf");

  const row = importacioConfirmRowSchema.parse({
    fitxerKey: key,
    nomFitxer: "factura-scan-protesic.pdf",
    dataFactura: "2026-06-12",
    numFactura: "LPG-2026-231",
    descripcio: "Treballs protèsics — corones de zirconi",
    import: "979.00",
    proveidor: { mode: "cap" },
    tipus: {
      mode: "nou",
      codi: "prot", // el schema l'ha de passar a majúscules
      descripcio: "Treballs protèsics de laboratori",
      deduible: true,
      esAmortitzable: false,
      grup: 6,
    },
  });

  const outcome = await importacioRepository.confirmRow(row, USER_ID);
  creats.despeses.push(outcome.despesaId);
  creats.tipus.push(outcome.tipusDespesaId);

  ok(outcome.tipusCreat, "ha creat el tipus nou");
  ok(!outcome.beCreat, "no ha creat cap bé (no amortitzable)");

  const tipus = await prisma.tipusDespesa.findUnique({
    where: { id: outcome.tipusDespesaId },
  });
  ok(tipus?.codi === "PROT", "codi normalitzat a majúscules");
  ok(tipus?.grup === 6, "grup PGC 6 desat");
}

// --- Duplicats i neteja -------------------------------------------------------
console.log("\n[extres] utilitats de suport");
{
  const dup = await importacioRepository.existeixDespesaDuplicada(
    "hs-2026-0050",
    "demo-prov-001",
  );
  ok(dup, "detecta el duplicat HS-2026-0050 (case-insensitive)");

  const keyA = (
    await prisma.despesa.findUnique({
      where: { id: creats.despeses[0] },
      select: { fitxerKey: true },
    })
  )?.fitxerKey;
  ok(
    keyA != null && (await importacioRepository.fitxerKeyEnUs(keyA)),
    "fitxerKeyEnUs protegeix el PDF d'una despesa confirmada",
  );
}

console.log("\nNeteja dels artefactes del test…");
for (const id of creats.despeses) {
  const d = await prisma.despesa.findUnique({
    where: { id },
    include: { inventari: true },
  });
  if (d?.inventari) await prisma.inventari.delete({ where: { id: d.inventari.id } });
  if (d?.fitxerKey) await facturesRepository.remove(d.fitxerKey).catch(() => {});
  await prisma.despesa.delete({ where: { id } });
}
for (const id of creats.proveidors) await prisma.proveidor.delete({ where: { id } });
for (const id of creats.tipus) await prisma.tipusDespesa.delete({ where: { id } });
await prisma.auditLog.deleteMany({
  where: { entitatId: { in: [...creats.despeses, ...creats.proveidors, ...creats.tipus] } },
});
console.log("Fet.");

await prisma.$disconnect();
process.exit(exit);
