/**
 * Generador dels PDFs de prova de la importació IA (IA-23).
 *
 * Produeix a test-fixtures/:
 *  - factura-hs-material.pdf   → PDF de text; proveïdor EXISTENT (Henry Schein) + tipus existent (MAT)
 *  - factura-hs-duplicada.pdf  → PDF de text; mateix numFactura (HS-2026-0050) que una despesa ja a BD → avís de duplicat
 *  - factura-scan-quirumed.pdf → PDF-imatge (escanejat); proveïdor NOU + tipus amortitzable (EQUIP) → bé d'inventari
 *  - factura-scan-protesic.pdf → PDF-imatge (escanejat); proveïdor NOU + tipus NOU (treballs protèsics)
 *  - factura-illegible.pdf     → bytes corruptes; ha de marcar-se com a error sense trencar el lot
 *
 * Els PDFs escanejats necessiten primer les captures PNG a test-fixtures/scans-src/
 * (generades amb Playwright a partir dels .html del mateix directori). Si el PNG
 * no hi és, aquell PDF s'omet i es pot re-executar més tard.
 *
 * Execució:  node test-fixtures/generate-factures.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import {
  Document,
  Image,
  Page,
  renderToFile,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const h = React.createElement;
const DIR = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Dades de les dues factures "netes" (PDF de text)
// ---------------------------------------------------------------------------

const CLIENT = {
  nom: "Clínica Dental Somriure SLP",
  nif: "B12345674",
  adreca: "C/ Migdia 18, 17002 Girona",
};

const FACTURES_TEXT = [
  {
    file: "factura-hs-material.pdf",
    proveidor: {
      nom: "Henry Schein España SA",
      nif: "A-23456783",
      adreca: "Av. Europa 12, 28100 Madrid",
      telefon: "911 234 567",
      email: "info@henryschein.es",
    },
    num: "HS-2026-0107",
    data: "20/06/2026",
    linies: [
      ["Compòsit nanohíbrid A2 — caixa 8 u.", "4", "68,20", "272,80"],
      ["Fresa diamant torpede (unitat x10)", "6", "24,50", "147,00"],
      ["Guants nitril talla M — caixa 100 u.", "10", "8,95", "89,50"],
      ["Àcid ortofosfòric 37% — xeringues x4", "4", "27,80", "111,20"],
    ],
    base: "620,50",
    ivaPct: "21",
    ivaImport: "130,31",
    total: "750,81",
    peu: "Pagament per transferència a 30 dies. IBAN ES91 2100 0418 4502 0005 1332",
  },
  {
    file: "factura-hs-duplicada.pdf",
    proveidor: {
      nom: "Henry Schein España SA",
      nif: "A-23456783",
      adreca: "Av. Europa 12, 28100 Madrid",
      telefon: "911 234 567",
      email: "info@henryschein.es",
    },
    num: "HS-2026-0050",
    data: "16/06/2026",
    linies: [
      ["Compòsit flow A3 — xeringa 2 g", "2", "52,30", "104,60"],
      ["Agulles anestèsia 30G — caixa 100 u.", "6", "12,40", "74,40"],
      ["Rotllos de cotó salivar — bossa 500 u.", "8", "6,15", "49,20"],
      ["Vernís de fluor 10 ml", "4", "27,66", "110,64"],
    ],
    base: "338,84",
    ivaPct: "21",
    ivaImport: "71,16",
    total: "410,00",
    peu: "Pagament per transferència a 30 dies. IBAN ES91 2100 0418 4502 0005 1332",
  },
];

// ---------------------------------------------------------------------------
// Maqueta react-pdf d'una factura "neta"
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  capcalera: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  provNom: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  bloc: { fontSize: 9, lineHeight: 1.5 },
  titolFactura: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#374151" },
  meta: { marginTop: 6, fontSize: 10, textAlign: "right", lineHeight: 1.5 },
  clientBox: {
    border: "1 solid #9ca3af", padding: 10, marginBottom: 24,
    width: 260, lineHeight: 1.5,
  },
  clientLabel: { fontSize: 7, color: "#6b7280", marginBottom: 3 },
  taula: { border: "1 solid #374151" },
  fila: { flexDirection: "row", borderBottom: "0.5 solid #9ca3af" },
  filaCap: { backgroundColor: "#e5e7eb", fontFamily: "Helvetica-Bold" },
  cDesc: { flex: 5, padding: 6 },
  cQty: { flex: 1, padding: 6, textAlign: "right" },
  cPreu: { flex: 1.4, padding: 6, textAlign: "right" },
  cImp: { flex: 1.6, padding: 6, textAlign: "right" },
  resum: { marginTop: 14, alignSelf: "flex-end", width: 220 },
  resumFila: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  resumTotal: {
    flexDirection: "row", justifyContent: "space-between",
    borderTop: "1 solid #374151", marginTop: 4, paddingTop: 6,
    fontSize: 12, fontFamily: "Helvetica-Bold",
  },
  peu: { position: "absolute", bottom: 40, left: 48, right: 48, fontSize: 8, color: "#6b7280" },
});

function FacturaPdf(f) {
  return h(Document, null,
    h(Page, { size: "A4", style: s.page },
      h(View, { style: s.capcalera },
        h(View, null,
          h(Text, { style: s.provNom }, f.proveidor.nom),
          h(Text, { style: s.bloc }, `CIF: ${f.proveidor.nif}`),
          h(Text, { style: s.bloc }, f.proveidor.adreca),
          h(Text, { style: s.bloc }, `Tel. ${f.proveidor.telefon} · ${f.proveidor.email}`),
        ),
        h(View, null,
          h(Text, { style: s.titolFactura }, "FACTURA"),
          h(Text, { style: s.meta }, `Núm.: ${f.num}`),
          h(Text, { style: s.meta }, `Data: ${f.data}`),
        ),
      ),
      h(View, { style: s.clientBox },
        h(Text, { style: s.clientLabel }, "FACTURAR A"),
        h(Text, { style: { fontFamily: "Helvetica-Bold" } }, CLIENT.nom),
        h(Text, null, `NIF: ${CLIENT.nif}`),
        h(Text, null, CLIENT.adreca),
      ),
      h(View, { style: s.taula },
        h(View, { style: [s.fila, s.filaCap] },
          h(Text, { style: s.cDesc }, "Concepte"),
          h(Text, { style: s.cQty }, "Quant."),
          h(Text, { style: s.cPreu }, "Preu u."),
          h(Text, { style: s.cImp }, "Import"),
        ),
        ...f.linies.map((l, i) =>
          h(View, { style: s.fila, key: i },
            h(Text, { style: s.cDesc }, l[0]),
            h(Text, { style: s.cQty }, l[1]),
            h(Text, { style: s.cPreu }, `${l[2]} €`),
            h(Text, { style: s.cImp }, `${l[3]} €`),
          ),
        ),
      ),
      h(View, { style: s.resum },
        h(View, { style: s.resumFila },
          h(Text, null, "Base imposable"),
          h(Text, null, `${f.base} €`),
        ),
        h(View, { style: s.resumFila },
          h(Text, null, `IVA (${f.ivaPct}%)`),
          h(Text, null, `${f.ivaImport} €`),
        ),
        h(View, { style: s.resumTotal },
          h(Text, null, "TOTAL"),
          h(Text, null, `${f.total} €`),
        ),
      ),
      h(Text, { style: s.peu }, f.peu),
    ),
  );
}

/**
 * PDF d'una sola pàgina amb la captura "escanejada" a mida completa.
 * El PNG es passa com a Buffer (un camí de Windows faria un fetch fallit) i
 * la imatge es fixa a les mides A4 en punts perquè no intenti paginar.
 */
const A4 = { width: 595.28, height: 841.89 };
function FacturaEscanejadaPdf(pngPath) {
  return h(Document, null,
    h(Page, { size: "A4", style: { padding: 0 } },
      h(Image, {
        src: { data: readFileSync(pngPath), format: "png" },
        style: { width: A4.width, height: A4.height },
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Execució
// ---------------------------------------------------------------------------

for (const f of FACTURES_TEXT) {
  await renderToFile(FacturaPdf(f), join(DIR, f.file));
  console.log(`✓ ${f.file}`);
}

for (const scan of ["quirumed", "protesic"]) {
  const png = join(DIR, "scans-src", `scan-${scan}.png`);
  if (!existsSync(png)) {
    console.log(`— factura-scan-${scan}.pdf omès (falta ${png})`);
    continue;
  }
  await renderToFile(FacturaEscanejadaPdf(png), join(DIR, `factura-scan-${scan}.pdf`));
  console.log(`✓ factura-scan-${scan}.pdf`);
}

// PDF corrupte: capçalera %PDF vàlida seguida de brossa i sense xref/trailer.
const brossa = Buffer.concat([
  Buffer.from("%PDF-1.7\n"),
  Buffer.from(Array.from({ length: 4096 }, (_, i) => (i * 37 + 11) % 256)),
]);
writeFileSync(join(DIR, "factura-illegible.pdf"), brossa);
console.log("✓ factura-illegible.pdf");
