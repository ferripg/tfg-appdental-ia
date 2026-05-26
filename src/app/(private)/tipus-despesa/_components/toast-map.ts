import type { ResultToastMap } from "@/components/app/result-toast";

export const TIPUS_DESPESA_TOAST_MAP: ResultToastMap = {
  creat: { type: "success", text: "Tipus de despesa creat correctament" },
  actualitzat: { type: "success", text: "Canvis desats" },
  desactivat: { type: "info", text: "Tipus de despesa desactivat" },
  reactivat: { type: "success", text: "Tipus de despesa reactivat" },
};
