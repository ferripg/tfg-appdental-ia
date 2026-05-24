"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const MESSAGES: Record<string, { type: "success" | "info"; text: string }> = {
  creat: { type: "success", text: "Proveïdor creat correctament" },
  actualitzat: { type: "success", text: "Canvis desats" },
  desactivat: { type: "info", text: "Proveïdor desactivat" },
  reactivat: { type: "success", text: "Proveïdor reactivat" },
};

/**
 * Pops a sonner toast once when the page loads with a recognised `?msg=...`
 * query param. Lives next to the route so the route map drives the UX.
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
