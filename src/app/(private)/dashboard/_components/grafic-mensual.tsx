"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";

const MESOS = [
  "Gen",
  "Feb",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Oct",
  "Nov",
  "Des",
];

type Props = {
  /** 12 entrades (gen→des) amb el total mensual com a string "X.XX". */
  dades: { mes: number; total: string }[];
};

/** Eix Y compacte: 1.250 → "1,3k", 800 → "800". */
function tickEuros(v: number): string {
  if (v >= 1000) {
    return `${(v / 1000).toLocaleString("ca-ES", { maximumFractionDigits: 1 })}k`;
  }
  return v.toLocaleString("ca-ES");
}

/**
 * Resol una variable CSS del tema (--primary, etc.) a un color concret.
 * recharts aplica `fill`/`stroke` com a ATRIBUTS SVG, on `var(--x)` NO es
 * resol; per això llegim el valor calculat de :root (s'adapta a clar/fosc).
 */
function useColorTema(nom: string, fallback: string): string {
  const [color, setColor] = useState(fallback);
  useEffect(() => {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(nom)
      .trim();
    if (v) setColor(v);
  }, [nom]);
  return color;
}

/**
 * Gràfic de barres de l'evolució mensual de despeses (Client Component).
 * Els valors numèrics només serveixen per dibuixar; els imports exactes
 * (total anual, desglossaments) es calculen i es mostren al servidor.
 */
export function GraficMensual({ dades }: Props) {
  const data = dades.map((d) => ({
    mes: MESOS[d.mes - 1],
    total: Number(d.total),
  }));

  const primary = useColorTema("--primary", "oklch(0.46 0.08 200)");
  const border = useColorTema("--border", "oklch(0.9 0.012 90)");
  const muted = useColorTema("--muted-foreground", "oklch(0.52 0.02 230)");
  const popover = useColorTema("--popover", "oklch(1 0.003 95)");
  const foreground = useColorTema("--foreground", "oklch(0.22 0.025 240)");

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={border} />
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke={muted}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          fontSize={11}
          stroke={muted}
          tickFormatter={tickEuros}
        />
        <Tooltip
          cursor={{ fill: muted, opacity: 0.12 }}
          formatter={(value) => [formatCurrency(String(value)), "Despeses"]}
          contentStyle={{
            background: popover,
            border: `1px solid ${border}`,
            borderRadius: 8,
            fontSize: 12,
            color: foreground,
          }}
          labelStyle={{ color: foreground, fontWeight: 600 }}
        />
        <Bar
          dataKey="total"
          fill={primary}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
