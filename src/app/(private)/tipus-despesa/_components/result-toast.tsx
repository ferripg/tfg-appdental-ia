"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const MESSAGES: Record<string, { type: "success" | "info"; text: string }> = {
  creat: { type: "success", text: "Tipus de despesa creat correctament" },
  actualitzat: { type: "success", text: "Canvis desats" },
  desactivat: { type: "info", text: "Tipus de despesa desactivat" },
  reactivat: { type: "success", text: "Tipus de despesa reactivat" },
};

/**
 * Pops a sonner toast once when the page loads with a recognised
 * `?msg=...` query param. Duplicated from proveidors/_components — when
 * a third copy lands at IA-8, promote to `src/components/app/result-toast`
 * with a `map` prop.
 */
export function ResultToast({ msg }: { msg?: string | string[] }) {
  const fired = useRef(false);
  const key = typeof msg === "string" ? msg : undefined;

  useEffect(() => {
    if (fired.current || !key) return;
    const entry = MESSAGES[key];
    if (!entry) return;
    fired.current = true;
    toast[entry.type](entry.text);
  }, [key]);

  return null;
}
