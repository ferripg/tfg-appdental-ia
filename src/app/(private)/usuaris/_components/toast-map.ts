import type { ResultToastMap } from "@/components/app/result-toast";

export const USUARIS_TOAST_MAP: ResultToastMap = {
  creat: { type: "success", text: "Usuari creat correctament" },
  actualitzat: { type: "success", text: "Canvis desats" },
  "rol-canviat": { type: "success", text: "Rol actualitzat" },
  desactivat: { type: "info", text: "Usuari desactivat" },
  reactivat: { type: "success", text: "Usuari reactivat" },
  error: { type: "error", text: "No s'ha pogut completar l'operació" },
};
