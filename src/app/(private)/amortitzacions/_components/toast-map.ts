import type { ResultToastMap } from "@/components/app/result-toast";

export const AMORTITZACIONS_TOAST_MAP: ResultToastMap = {
  generat: { type: "success", text: "Amortitzacions de l'exercici generades" },
  retrocedit: { type: "info", text: "Exercici retrocedit i amortitzacions esborrades" },
  error: {
    type: "error",
    text: "No s'ha pogut completar l'operació (revisa l'estat de l'exercici)",
  },
};
