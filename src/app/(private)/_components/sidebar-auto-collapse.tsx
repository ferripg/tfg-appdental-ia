"use client";

import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

/** Per sota d'aquesta amplada (lg de Tailwind) la lateral comença plegada. */
const LG_BREAKPOINT = 1024;

/**
 * Plega la barra lateral al rail d'icones en pantalles de tauleta
 * (md ≤ amplada < lg) la PRIMERA vegada que es carrega l'app, perquè les
 * taules (que fan scroll horitzontal per IA-22) tinguin el màxim d'amplada.
 *
 * Només actua si l'usuari encara no ha triat res: el component Sidebar de
 * shadcn desa l'estat obert/plegat en una cookie (`sidebar_state`) i el
 * layout la respecta a partir de llavors. Per sota de md la lateral és un
 * panell (Sheet) i aquest ajust no hi intervé.
 */
export function SidebarAutoCollapse({
  hasPreference,
}: {
  hasPreference: boolean;
}) {
  const { setOpen, isMobile } = useSidebar();

  useEffect(() => {
    if (hasPreference || isMobile) return;
    if (window.innerWidth < LG_BREAKPOINT) {
      setOpen(false);
      // setOpen desa la cookie de preferència; l'esborrem perquè aquest
      // plegat és automàtic, no una tria de l'usuari: a escriptori la lateral
      // ha de continuar sortint oberta.
      document.cookie = "sidebar_state=; path=/; max-age=0";
    }
    // Només en muntar: és un valor inicial, no un seguiment del redimensionat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
