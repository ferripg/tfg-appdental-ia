import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { UnauthorizedError } from "@/domain/errors";
import { informesService } from "@/services/informes-service";
import { InformePDF } from "../_components/informe-pdf";

// Necessita Node (la generació de PDF usa APIs de Node) i és dinàmic: depèn
// de la sessió i dels paràmetres de període.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDateParam(value: string | null, fallback: Date): Date {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return fallback;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const year = new Date().getUTCFullYear();
  const des = parseDateParam(
    url.searchParams.get("des"),
    new Date(Date.UTC(year, 0, 1)),
  );
  const fins = parseDateParam(
    url.searchParams.get("fins"),
    new Date(Date.UTC(year, 11, 31)),
  );

  let informe;
  try {
    informe = await informesService.despesesPerProveidor({ des, fins });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return new Response("Cal iniciar sessió", { status: 401 });
    }
    throw err;
  }

  // `InformePDF` és un wrapper que retorna un <Document>; el cast cap a
  // ReactElement satisfà la signatura de renderToBuffer (que espera l'element
  // Document directament).
  const element = React.createElement(InformePDF, {
    informe,
    des,
    fins,
  }) as unknown as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);

  // El Buffer de Node no encaixa directament amb el tipus BodyInit del DOM;
  // l'embolcallem en un Uint8Array (vista vàlida d'ArrayBuffer).
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="despeses-per-proveidor_${ymd(des)}_${ymd(fins)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
