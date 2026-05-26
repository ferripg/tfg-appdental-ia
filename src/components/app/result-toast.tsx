"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type ToastType = "success" | "info" | "warning" | "error";

export type ResultToastMap = Record<string, { type: ToastType; text: string }>;

/**
 * Pops a sonner toast once when the page loads with a recognised `?msg=...`
 * query param. Each CRUD passes its own `map` with the entity-specific
 * texts; the component itself is generic.
 *
 * Extracted to a shared module after the 3rd CRUD generated the same
 * pattern (IA-6 + IA-7 had private copies; IA-8 would have been the 3rd).
 */
export function ResultToast({
  msg,
  map,
}: {
  msg?: string | string[];
  map: ResultToastMap;
}) {
  const fired = useRef(false);
  const key = typeof msg === "string" ? msg : undefined;

  useEffect(() => {
    if (fired.current || !key) return;
    const entry = map[key];
    if (!entry) return;
    fired.current = true;
    toast[entry.type](entry.text);
  }, [key, map]);

  return null;
}
