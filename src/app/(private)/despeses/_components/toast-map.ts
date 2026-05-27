import type { ResultToastMap } from "@/components/app/result-toast";

export const DESPESES_TOAST_MAP: ResultToastMap = {
  creat: { type: "success", text: "Despesa registrada correctament" },
  actualitzat: { type: "success", text: "Canvis desats" },
  eliminat: { type: "info", text: "Despesa eliminada" },
  "factura-pujada": { type: "success", text: "Factura pujada correctament" },
  "factura-eliminada": { type: "info", text: "Factura eliminada del magatzem" },
  "factura-error": {
    type: "error",
    text: "No s'ha pogut completar l'operació amb la factura",
  },
};
