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
import {
  DollarSign,
  Users,
  TrendingUp,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const kpis = [
  { label: "Inversión publicitaria", value: "$48,290", delta: "+12.4%", up: true, icon: DollarSign },
  { label: "Leads totales", value: "1,284", delta: "+8.7%", up: true, icon: Users },
  { label: "Tasa de conversión", value: "6.8%", delta: "+1.2pp", up: true, icon: TrendingUp },
  { label: "ROAS", value: "4.2x", delta: "-0.3x", up: false, icon: Target },
];

const series = [
  { d: "Lun", spend: 4200, leads: 92 },
  { d: "Mar", spend: 5100, leads: 108 },
  { d: "Mié", spend: 4800, leads: 121 },
  { d: "Jue", spend: 6300, leads: 154 },
  { d: "Vie", spend: 7200, leads: 189 },
  { d: "Sáb", spend: 5900, leads: 167 },
  { d: "Dom", spend: 6800, leads: 201 },
];

const campaigns = [
  { name: "Q4 Retargeting — LATAM", status: "Activa", spend: 12480, leads: 342, roas: 5.2 },
  { name: "Lookalike 1% · MX High Intent", status: "Activa", spend: 9230, leads: 287, roas: 4.8 },
  { name: "Tráfico Frío · Reels Mix", status: "Pausada", spend: 6810, leads: 124, roas: 2.1 },
  { name: "Awareness de Marca · Stories", status: "Activa", spend: 5420, leads: 201, roas: 3.6 },
  { name: "Lead Magnet · Descarga Ebook", status: "Activa", spend: 4980, leads: 187, roas: 4.1 },
  { name: "Teaser Black Friday", status: "Borrador", spend: 0, leads: 0, roas: 0 },
];

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    Activa: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Pausada: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Borrador: "bg-muted-foreground/10 text-muted-foreground border-border",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium", map[s])}>
      <span className="size-1.5 rounded-full bg-current" />
      {s}
    </span>
  );
}

export default function MarketingOverview() {
  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Marketing Intelligence</p>
          <h1 className="text-3xl font-semibold tracking-tight">Resumen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rendimiento en tiempo real de todas tus campañas de Meta Ads. Últimos 7 días.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="h-9 px-4 rounded-lg border border-border bg-secondary/40 text-sm hover:bg-secondary transition">
            Últimos 7 días
          </button>
          <button className="h-9 px-4 rounded-lg gradient-primary text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition">
            Sincronizar ahora
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="relative overflow-hidden rounded-2xl glass-card p-5 group"
          >
            <div className="absolute -top-12 -right-12 size-32 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-600/0 blur-2xl opacity-70 group-hover:opacity-100 transition" />
            <div className="flex items-start justify-between relative">
              <div className="size-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <k.icon className="size-5 text-white" strokeWidth={2.2} />
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md",
                  k.up
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400",
                )}
              >
                {k.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {k.delta}
              </span>
            </div>
            <div className="mt-5 relative">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-semibold mt-1 tracking-tight">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl glass-card p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Inversión vs Leads</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Rendimiento diario</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-sm bg-gradient-to-br from-indigo-400 to-violet-500" />
              Inversión
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-sm bg-emerald-400" />
              Leads
            </span>
          </div>
        </div>
        <div className="h-72">
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
        </div>
      </div>

      {/* Campaign table */}
      <div className="rounded-2xl glass-card overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Rendimiento por campaña</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Campañas con mayor inversión este periodo</p>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground transition">Ver todas →</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground border-y border-border/60 bg-secondary/20">
              <th className="text-left font-medium px-6 py-3">Campaña</th>
              <th className="text-left font-medium px-3 py-3">Estado</th>
              <th className="text-right font-medium px-3 py-3">Inversión</th>
              <th className="text-right font-medium px-3 py-3">Leads</th>
              <th className="text-right font-medium px-3 py-3">ROAS</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => (
              <tr key={c.name} className={cn("border-b border-border/40 hover:bg-secondary/20 transition", i === campaigns.length - 1 && "border-b-0")}>
                <td className="px-6 py-4 font-medium">{c.name}</td>
                <td className="px-3 py-4"><StatusBadge s={c.status} /></td>
                <td className="px-3 py-4 text-right tabular-nums">${c.spend.toLocaleString()}</td>
                <td className="px-3 py-4 text-right tabular-nums">{c.leads.toLocaleString()}</td>
                <td className="px-3 py-4 text-right tabular-nums">
                  <span className={cn(
                    "font-medium",
                    c.roas >= 4 ? "text-emerald-400" : c.roas >= 2 ? "text-amber-400" : c.roas === 0 ? "text-muted-foreground" : "text-rose-400",
                  )}>
                    {c.roas === 0 ? "—" : `${c.roas}x`}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="size-7 rounded-md hover:bg-secondary flex items-center justify-center ml-auto">
                    <MoreHorizontal className="size-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
