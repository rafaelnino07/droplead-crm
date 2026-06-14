import { SyncMetaButton } from "./sync-meta-button";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DollarSign,
  Users,
  TrendingUp,
  Target,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseServer } from "@/lib/supabase/server";
import { MarketingChart } from "./marketing-chart";

const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
  ACTIVE: { label: "Activa", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  PAUSED: { label: "Pausada", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  ARCHIVED: { label: "Archivada", classes: "bg-muted-foreground/10 text-muted-foreground border-border" },
  DELETED: { label: "Eliminada", classes: "bg-muted-foreground/10 text-muted-foreground border-border" },
  IN_PROCESS: { label: "En proceso", classes: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  WITH_ISSUES: { label: "Con problemas", classes: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

function StatusBadge({ s }: { s: string | null }) {
  const info = s
    ? STATUS_LABELS[s.toUpperCase()] ?? { label: s, classes: "bg-muted-foreground/10 text-muted-foreground border-border" }
    : { label: "Sin estado", classes: "bg-muted-foreground/10 text-muted-foreground border-border" };

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium", info.classes)}>
      <span className="size-1.5 rounded-full bg-current" />
      {info.label}
    </span>
  );
}

export default async function MarketingOverview() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  const organizationId = profile.organization_id;

  const { data: account } = await supabase
    .from("meta_ad_accounts")
    .select("id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!account) {
    return (
      <div className="p-8 max-w-[1400px]">
        <div className="rounded-2xl glass-card p-10 text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Marketing Intelligence</p>
          <h1 className="text-2xl font-semibold tracking-tight">Sin cuenta de Meta Ads conectada</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Conecta tu cuenta de Meta en Configuración para ver el rendimiento de tus campañas aquí.
          </p>
          <Link
            href="/marketing/settings"
            className="inline-flex h-9 px-4 rounded-lg gradient-primary text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition items-center"
          >
            Ir a Configuración
          </Link>
        </div>
      </div>
    );
  }

  // ── Date range: last 30 days ─────────────────────────────────────
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 29);
  const startDateStr = startDate.toISOString().slice(0, 10);

  const [{ data: metrics, error: metricsError }, { data: campaigns, error: campaignsError }, { data: adSets }, { data: ads }] =
    await Promise.all([
      supabase
        .from("meta_ad_metrics")
        .select("ad_id, date, spend, leads, ctr")
        .eq("organization_id", organizationId)
        .gte("date", startDateStr)
        .order("date", { ascending: true }),
      supabase
        .from("meta_campaigns")
        .select("id, name, status, total_spend")
        .eq("organization_id", organizationId)
        .order("total_spend", { ascending: false }),
      supabase
        .from("meta_ad_sets")
        .select("id, campaign_id")
        .eq("organization_id", organizationId),
      supabase
        .from("meta_ads")
        .select("id, ad_set_id")
        .eq("organization_id", organizationId),
    ]);

  if (metricsError) console.error("META AD METRICS ERROR:", metricsError);
  if (campaignsError) console.error("META CAMPAIGNS ERROR:", campaignsError);

  const metricRows = metrics ?? [];

  // ── KPIs: sum spend, sum leads, average CTR ──────────────────────
  const totalSpend = metricRows.reduce((sum, m) => sum + Number(m.spend), 0);
  const totalLeads = metricRows.reduce((sum, m) => sum + Number(m.leads), 0);
  const avgCtr =
    metricRows.length > 0
      ? metricRows.reduce((sum, m) => sum + Number(m.ctr), 0) / metricRows.length
      : 0;
  const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;

  const kpis = [
    {
      label: "Inversión publicitaria (30 días)",
      value: `$${totalSpend.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
    },
    {
      label: "Leads totales (30 días)",
      value: totalLeads.toLocaleString("es-MX"),
      icon: Users,
    },
    {
      label: "CTR promedio",
      value: `${avgCtr.toFixed(2)}%`,
      icon: TrendingUp,
    },
    {
      label: "Costo por lead",
      value: `$${costPerLead.toFixed(2)}`,
      icon: Target,
    },
  ];

  // ── Chart series: spend + leads grouped by day ───────────────────
  const seriesMap = new Map<string, { spend: number; leads: number }>();
  for (const m of metricRows) {
    const entry = seriesMap.get(m.date) ?? { spend: 0, leads: 0 };
    entry.spend += Number(m.spend);
    entry.leads += Number(m.leads);
    seriesMap.set(m.date, entry);
  }
  const series = Array.from(seriesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      d: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
      spend: Math.round(v.spend),
      leads: v.leads,
    }));

  // ── Campaign table: name, status, spend, leads ───────────────────
  const adSetToCampaign = new Map((adSets ?? []).map((a) => [a.id, a.campaign_id]));
  const adToCampaign = new Map(
    (ads ?? []).map((a) => [a.id, a.ad_set_id ? adSetToCampaign.get(a.ad_set_id) ?? null : null])
  );

  const leadsByCampaign = new Map<string, number>();
  for (const m of metricRows) {
    if (!m.ad_id) continue;
    const campaignId = adToCampaign.get(m.ad_id);
    if (!campaignId) continue;
    leadsByCampaign.set(campaignId, (leadsByCampaign.get(campaignId) ?? 0) + Number(m.leads));
  }

  const campaignRows = (campaigns ?? []).map((c) => ({
    id: c.id,
    name: c.name ?? "Sin nombre",
    status: c.status,
    spend: Number(c.total_spend ?? 0),
    leads: leadsByCampaign.get(c.id) ?? 0,
    roas: 0,
  }));
  async function handleSync() {
    try {
      const response = await fetch("/api/meta/sync", {
        method: "POST",
      });

      const data = await response.json();

      console.log("META SYNC RESULT:", data);

      if (!response.ok) {
        alert(data.error || "Error al sincronizar Meta");
        return;
      }

      alert(
        `Sincronización completada.
Campañas: ${data.campaigns}
Ads: ${data.ads}`
      );

      window.location.reload();

    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al sincronizar.");
    }
  }
  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Marketing Intelligence</p>
          <h1 className="text-3xl font-semibold tracking-tight">Resumen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rendimiento en tiempo real de todas tus campañas de Meta Ads. Últimos 30 días.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="h-9 px-4 rounded-lg border border-border bg-secondary/40 text-sm hover:bg-secondary transition">
            Últimos 30 días
          </button>
          <SyncMetaButton />
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
          <MarketingChart series={series} />
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
            {campaignRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Todavía no hay campañas sincronizadas.
                </td>
              </tr>
            ) : (
              campaignRows.map((c, i) => (
                <tr key={c.id} className={cn("border-b border-border/40 hover:bg-secondary/20 transition", i === campaignRows.length - 1 && "border-b-0")}>
                  <td className="px-6 py-4 font-medium">{c.name}</td>
                  <td className="px-3 py-4"><StatusBadge s={c.status} /></td>
                  <td className="px-3 py-4 text-right tabular-nums">${c.spend.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</td>
                  <td className="px-3 py-4 text-right tabular-nums">{c.leads.toLocaleString("es-MX")}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
