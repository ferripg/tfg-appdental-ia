import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { BusinessError } from "@/domain/errors";
import {
  type CatalegTipusEntry,
  type FacturaExtreta,
  facturaExtretaSchema,
} from "@/domain/importacio";
import { anthropicClient } from "./anthropic-client";

/**
 * Adapter d'extracció de factures amb Claude (IA-23).
 *
 * El PDF s'envia com a bloc `document` en base64 (funciona tant per a PDFs de
 * text com per a escanejats: l'API en processa el text i la imatge de cada
 * pàgina) i la resposta es força a JSON amb `output_config.format`
 * (structured outputs). El SDK no valida les constraints Zod del costat
 * client, així que revalidem el `parsed_output` amb `safeParse`.
 *
 * Model de runtime: claude-sonnet-5 (estable i econòmic). Sense `temperature`
 * ni `thinking` explícits: a Sonnet 5 el thinking adaptatiu ja és el defecte
 * i els paràmetres de mostreig no s'accepten.
 */
const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 16000;

/** Status HTTP d'un error de l'SDK (per propietat, robust al dual-package). */
function statusDeLError(err: unknown): number | null {
  if (typeof err === "object" && err !== null && "status" in err) {
    const s = (err as { status: unknown }).status;
    if (typeof s === "number") return s;
  }
  return null;
}

function buildPrompt(cataleg: CatalegTipusEntry[]): string {
  const linies = cataleg
    .map(
      (t) =>
        `- ${t.codi} — ${t.descripcio}${t.esAmortitzable ? " [amortitzable]" : ""}`,
    )
    .join("\n");

  return `Ets el sistema d'extracció de factures d'una clínica dental catalana. Analitza el document adjunt (pot ser un PDF de text o un escaneig fotografiat) i extreu-ne les dades EXACTES que hi apareixen. No inventis mai cap valor: si un camp no es pot llegir amb seguretat, retorna null i afegeix el nom del camp a campsDubtosos.

Catàleg de tipus de despesa existents:
${linies}

Regles:
- esFactura: false si el document NO és una factura (pressupost, albarà, contingut irrellevant). En aquest cas la resta de camps poden ser null.
- conteMultiplesFactures: true si el document conté més d'una factura diferent.
- proveidor: qui EMET la factura (mai el client, que és la clínica dental). Retorna el NIF tal com apareix; ja es normalitza després.
- dataFactura: converteix-la a format ISO YYYY-MM-DD.
- Imports en euros com a nombres decimals amb punt (ex: 1234.56). Comprova que baseImposable + ivaImport quadri amb total; si no quadra, marca els camps implicats com a dubtosos.
- concepte: resum breu i útil en català del que es factura (màxim 500 caràcters).
- tipusExistentCodi: tria el codi del catàleg que millor encaixi amb la despesa. NOMÉS si cap tipus del catàleg hi encaixa raonablement, deixa'l null i omple tipusNou.
- tipusNou: proposa codi (majúscules, 2-10 alfanumèrics, diferent dels del catàleg), descripció en català, deduible (true per a despeses ordinàries del negoci), esAmortitzable (true només per a béns d'inversió duradors: equipament, maquinària, mobiliari) i grup del PGC (2 si és immobilitzat amortitzable, 6 per a compres i serveis corrents).
- confianca: "alta" si tot és clarament llegible, "mitjana" si hi ha algun camp dubtós, "baixa" si el document costa de llegir.`;
}

export const extraccioRepository = {
  /**
   * Extreu les dades d'UNA factura en PDF. Llança `BusinessError` amb un
   * missatge en català quan el PDF és invàlid/corrupte o quan la resposta
   * del model no compleix l'esquema (fila d'error a la revisió, mai no
   * tomba el lot).
   */
  async extreuFactura(
    pdf: Buffer,
    cataleg: CatalegTipusEntry[],
  ): Promise<FacturaExtreta> {
    let message: Awaited<ReturnType<typeof anthropicClient.messages.parse>>;
    try {
      message = await anthropicClient.messages.parse({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdf.toString("base64"),
                },
              },
              { type: "text", text: buildPrompt(cataleg) },
            ],
          },
        ],
        output_config: { format: zodOutputFormat(facturaExtretaSchema) },
      });
    } catch (err) {
      // NOTA: no usem `instanceof Anthropic.BadRequestError` perquè amb el
      // bundling dual CJS/ESM del SDK la classe pot no ser la mateixa
      // instància (verificat: el 400 del PDF corrupte no hi encaixava).
      // L'status numèric de l'error de l'API és estable.
      const status = statusDeLError(err);
      const missatge = err instanceof Error ? err.message : String(err);
      if (status === 400) {
        // La manca de crèdit també arriba com a 400 invalid_request_error:
        // no la disfressem de "PDF il·legible".
        if (missatge.includes("credit balance")) {
          throw new BusinessError(
            "El compte de l'API d'Anthropic no té crèdit disponible",
          );
        }
        // Qualsevol altre 400 amb un document adjunt: PDF corrupte/invàlid.
        throw new BusinessError(
          "El fitxer no és un PDF llegible (corrupte o amb format invàlid)",
        );
      }
      if (status === 429) {
        throw new BusinessError(
          "S'ha superat el límit de peticions; torna-ho a provar en uns segons",
        );
      }
      throw err;
    }

    if (message.stop_reason === "refusal") {
      throw new BusinessError("El model ha rebutjat processar aquest document");
    }
    if (message.stop_reason === "max_tokens") {
      throw new BusinessError(
        "El document és massa complex per extreure'n les dades",
      );
    }

    // `parse()` fa JSON.parse però no aplica les constraints Zod → revalidem.
    const parsed = facturaExtretaSchema.safeParse(message.parsed_output);
    if (!parsed.success) {
      console.error(
        "[extraccioRepository] resposta fora d'esquema:",
        parsed.error.issues,
      );
      throw new BusinessError(
        "No s'ha pogut interpretar la resposta de l'extracció",
      );
    }
    return parsed.data;
  },
};
