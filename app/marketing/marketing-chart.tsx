"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SeriesPoint = {
  d: string;
  spend: number;
  leads: number;
};

export function MarketingChart({ series }: { series: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.22 280)" stopOpacity={0.6} />
            <stop offset="100%" stopColor="oklch(0.62 0.22 280)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.7 0.18 160)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="oklch(0.7 0.18 160)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
        <XAxis dataKey="d" stroke="oklch(0.65 0.02 270)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="oklch(0.65 0.02 270)" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "oklch(0.18 0.02 270)",
            border: "1px solid oklch(1 0 0 / 10%)",
            borderRadius: 12,
            fontSize: 12,
          }}
        />
        <Area type="monotone" dataKey="spend" stroke="oklch(0.62 0.22 280)" strokeWidth={2} fill="url(#gSpend)" />
        <Area type="monotone" dataKey="leads" stroke="oklch(0.7 0.18 160)" strokeWidth={2} fill="url(#gLeads)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
