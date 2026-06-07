import type { ResultToastMap } from "@/components/app/result-toast";

export const INVENTARI_TOAST_MAP: ResultToastMap = {
  actualitzat: { type: "success", text: "Canvis desats" },
  baixa: { type: "info", text: "Bé donat de baixa" },
  reactivat: { type: "success", text: "Bé reactivat" },
  eliminat: { type: "info", text: "Bé eliminat de l'inventari" },
  error: {
    type: "error",
    text: "No s'ha pogut completar l'operació",
  },
};
