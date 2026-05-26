import type { ResultToastMap } from "@/components/app/result-toast";

export const DESPESES_TOAST_MAP: ResultToastMap = {
  creat: { type: "success", text: "Despesa registrada correctament" },
  actualitzat: { type: "success", text: "Canvis desats" },
  eliminat: { type: "info", text: "Despesa eliminada" },
};
