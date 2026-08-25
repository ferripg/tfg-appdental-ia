import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { InformeProveidors } from "@/domain/informe-proveidors";
import { formatCurrency, formatDate } from "@/lib/format";

/**
 * Document PDF de l'informe "Despeses per proveïdor" (IA-21).
 *
 * NOMÉS server-side: el genera la route `/informes/pdf` amb `renderToBuffer`.
 * Reprodueix la mateixa informació que la pàgina HTML (mateix objecte
 * `informe`): agrupació per proveïdor, detall, subtotal i total general.
 *
 * Salts de pàgina nets: cada grup de proveïdor usa `minPresenceAhead` perquè
 * la seva capçalera no quedi orfe al peu de pàgina, i la fila de subtotal va
 * `wrap={false}` per no partir-se.
 */

const styles = StyleSheet.create({
  page: {
    paddingVertical: 36,
    paddingHorizontal: 40,
    paddingBottom: 56,
    fontSize: 9,
    color: "#1a1a1a",
  },
  title: { fontSize: 18, marginBottom: 4 },
  periode: { fontSize: 10, color: "#555", marginBottom: 16 },
  grup: { marginBottom: 14 },
  grupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 3,
    marginBottom: 4,
  },
  grupNom: { fontSize: 12 },
  grupNif: { fontSize: 9, color: "#555" },
  thead: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#999",
    paddingBottom: 2,
    marginBottom: 2,
    color: "#555",
    textTransform: "uppercase",
    fontSize: 7.5,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    paddingTop: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: "#1a1a1a",
    fontSize: 12,
  },
  // Columnes fixes amb flexShrink: 0 (que el concepte llarg no les aixafi) i
  // el concepte amb flexBasis: 0 — l'amplada li ve del repartiment flex, no
  // de l'amplada intrínseca del text, i així el text llarg SALTA DE LÍNIA
  // dins de la seva columna en lloc de trepitjar Tipus i Import.
  cData: { width: 56, flexShrink: 0, paddingRight: 4 },
  cFactura: { width: 78, flexShrink: 0, paddingRight: 4 },
  cConcepte: { flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingRight: 6 },
  cTipus: { width: 44, flexShrink: 0 },
  cImport: { width: 64, textAlign: "right", flexShrink: 0 },
  buit: { fontSize: 11, color: "#555", marginTop: 24 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: "#999",
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
    paddingTop: 4,
  },
});

type Props = {
  informe: InformeProveidors;
  des: Date;
  fins: Date;
};

/**
 * Data compacta (15/01/2026) per a les files: la forma llarga de formatDate
 * («15 de gen. 2026») no cap a la columna i es partia en dues línies.
 */
const dataCurta = new Intl.DateTimeFormat("ca-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function InformePDF({ informe, des, fins }: Props) {
  const periodeText = `Període: ${formatDate(des)} – ${formatDate(fins)}`;

  return (
    <Document
      title="Despeses per proveïdor"
      author="AppDental"
      subject={periodeText}
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>Despeses per proveïdor</Text>
        <Text style={styles.periode}>{periodeText}</Text>

        {informe.grups.length === 0 ? (
          <Text style={styles.buit}>
            No hi ha cap despesa registrada en aquest període.
          </Text>
        ) : (
          informe.grups.map((grup) => (
            <View
              key={grup.proveidorId ?? "sense"}
              style={styles.grup}
              minPresenceAhead={70}
            >
              <View style={styles.grupHeader}>
                <Text style={styles.grupNom}>{grup.proveidorNom}</Text>
                {grup.proveidorNif ? (
                  <Text style={styles.grupNif}>NIF {grup.proveidorNif}</Text>
                ) : null}
              </View>

              {/* SENSE `fixed`: la capçalera de columnes ha de sortir un cop
                  per grup, en flux. `fixed` la repetiria a totes les pàgines i
                  es duplicaria/apilaria entre grups. */}
              <View style={styles.thead}>
                <Text style={styles.cData}>Data</Text>
                <Text style={styles.cFactura}>Núm. factura</Text>
                <Text style={styles.cConcepte}>Concepte</Text>
                <Text style={styles.cTipus}>Tipus</Text>
                <Text style={styles.cImport}>Import</Text>
              </View>

              {grup.linies.map((l) => (
                <View key={l.id} style={styles.row} wrap={false}>
                  <Text style={styles.cData}>
                    {dataCurta.format(l.dataFactura)}
                  </Text>
                  <Text style={styles.cFactura}>{l.numFactura ?? "—"}</Text>
                  <Text style={styles.cConcepte}>{l.descripcio}</Text>
                  <Text style={styles.cTipus}>{l.tipusCodi}</Text>
                  <Text style={styles.cImport}>{formatCurrency(l.import)}</Text>
                </View>
              ))}

              <View style={styles.subtotalRow} wrap={false}>
                <Text style={{ color: "#555" }}>
                  Subtotal {grup.proveidorNom}
                </Text>
                <Text style={{ width: 72, textAlign: "right" }}>
                  {formatCurrency(grup.subtotal)}
                </Text>
              </View>
            </View>
          ))
        )}

        {informe.grups.length > 0 ? (
          <View style={styles.totalRow} wrap={false}>
            <Text>Total general ({informe.numDespeses} despeses)</Text>
            <Text>{formatCurrency(informe.totalGeneral)}</Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>AppDental · Despeses per proveïdor</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Pàgina ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
