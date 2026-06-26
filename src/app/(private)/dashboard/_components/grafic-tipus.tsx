"use client";

import { useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/format";

type Props = {
  /** Desglossament per tipus (codi, descripció, total "X.XX"), ordenat desc. */
  dades: { codi: string; descripcio: string; total: string }[];
};

/**
 * Paleta de colors concrets per als sectors. Es fan servir literals (no
 * `var(--x)`) perquè recharts aplica el `fill` com a ATRIBUT SVG, on les
 * variables CSS no es resolen.
 */
const PALETA = [
  "oklch(0.46 0.08 200)",
  "oklch(0.62 0.12 150)",
  "oklch(0.70 0.13 90)",
  "oklch(0.62 0.15 50)",
  "oklch(0.55 0.16 25)",
  "oklch(0.52 0.13 300)",
  "oklch(0.55 0.12 260)",
  "oklch(0.65 0.10 130)",
  "oklch(0.45 0.04 230)",
];

/** Resol una variable CSS del tema a color concret (s'adapta a clar/fosc). */
function useColorTema(nom: string, fallback: string): string {
  // Inicialització lazy (sense effect → sense setState dins d'effect): a SSR
  // retorna el fallback; al client llegeix el valor real del tema.
  return useState(() => {
    if (typeof document === "undefined") return fallback;
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(nom)
      .trim();
    return v || fallback;
  })[0];
}

/**
 * Gràfic circular (pie) de despeses per tipus (Client Component): un sector
 * per tipus, amb llegenda i tooltip que mostra l'import. Els valors numèrics
 * només dibuixen; els imports exactes es calculen al servidor.
 */
export function GraficTipus({ dades }: Props) {
  const data = dades.map((t) => ({
    name: t.codi,
    descripcio: t.descripcio,
    value: Number(t.total),
  }));

  const border = useColorTema("--border", "oklch(0.9 0.012 90)");
  const popover = useColorTema("--popover", "oklch(1 0.003 95)");
  const foreground = useColorTema("--foreground", "oklch(0.22 0.025 240)");

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          isAnimationActive={false}
          stroke={popover}
          strokeWidth={2}
        >
          {data.map((d, i) => (
            <Cell key={d.name} fill={PALETA[i % PALETA.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [formatCurrency(String(value)), name]}
          contentStyle={{
            background: popover,
            border: `1px solid ${border}`,
            borderRadius: 8,
            fontSize: 12,
            color: foreground,
          }}
          labelStyle={{ color: foreground, fontWeight: 600 }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => (
            <span style={{ color: foreground, fontSize: 12 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
