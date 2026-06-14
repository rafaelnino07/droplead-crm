import Link from "next/link";
import { redirect } from "next/navigation";
import { DollarSign, Users, CheckCircle2, Percent, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseServer } from "@/lib/supabase/server";
import { calculateAttributionSummary } from "@/lib/attribution/engine";

export const metadata = {
  title: "Atribución · Droplead",
};

const stages = ["Nuevo", "Contactado", "Calificado", "Propuesta", "Ganado", "Perdido"] as const;
type Stage = (typeof stages)[number];

const stageColor: Record<Stage, string> = {
  Nuevo: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  Contactado: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  Calificado: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Propuesta: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Ganado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Perdido: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

function mapClientStageToJourney(stage: string | null): Stage {
  switch (stage) {
    case "nuevo_lead":
      return "Nuevo";
    case "calificado_para_visita":
      return "Contactado";
    case "visita_tecnica_realizada":
      return "Calificado";
    case "cotizacion_enviada":
      return "Propuesta";
    case "verbalmente_ganado":
    case "proyecto_cerrado":
      return "Ganado";
    case "perdido":
      return "Perdido";
    case "pausado":
      return "Contactado";
    default:
      return "Nuevo";
  }
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}

function StageBadge({ s }: { s: Stage }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium", stageColor[s])}>
      <span className="size-1.5 rounded-full bg-current" />
      {s}
    </span>
  );
}

function StageJourney({ s }: { s: Stage }) {
  const idx = stages.indexOf(s);
  const lost = s === "Perdido";
  return (
    <div className="flex items-center gap-1">
      {stages.slice(0, 5).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-5 rounded-full transition-all",
            lost ? "bg-rose-500/30" : i <= idx ? "gradient-primary" : "bg-border",
            lost && i === 0 && "bg-rose-500",
          )}
        />
      ))}
    </div>
  );
}

export default async function AttributionPage() {
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

  const { data: clientsData, error: clientsError } = await supabase
    .from("clients")
    .select("id, name, source_ad_id, stage, created_at, utm_campaign")
    .eq("organization_id", organizationId)
    .eq("source", "meta_ads")
    .order("created_at", { ascending: false });

  if (!clientsData || clientsData.length === 0) {
    return (
      <div className="p-8 max-w-[1400px]">
        <div className="rounded-2xl glass-card p-10 text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Atribución</p>
          <h1 className="text-2xl font-semibold tracking-tight">Sin leads atribuidos a Meta Ads</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Todavía no hay clientes con origen Meta Ads. Cuando lleguen leads desde tus anuncios, aparecerán aquí con su recorrido completo.
          </p>
          <Link
            href="/marketing/settings"
            className="inline-flex h-9 px-4 rounded-lg border border-border bg-secondary/40 text-sm hover:bg-secondary transition items-center"
          >
            Ver configuración de Meta Ads →
          </Link>
        </div>
      </div>
    );
  }

  const clientIds = clientsData.map((c) => c.id);
  const adIds = clientsData.map((c) => c.source_ad_id).filter((id): id is string => !!id);

  const [{ data: adsData }, { data: quotesData }, { data: memoryData }, { data: campaignsData }, { data: allClientsData }] = await Promise.all([
    adIds.length > 0
      ? supabase
          .from("meta_ads")
          .select("id, ad_set_id, name, headline")
          .eq("organization_id", organizationId)
          .in("id", adIds)
      : Promise.resolve({ data: [] as { id: string; ad_set_id: string | null; name: string | null; headline: string | null }[] }),
    supabase
      .from("quotes")
      .select("client_id, total, status")
      .eq("organization_id", organizationId),
    supabase
      .from("commercial_memory")
      .select("client_id, estimated_budget")
      .eq("organization_id", organizationId)
      .in("client_id", clientIds),
    supabase
      .from("meta_campaigns")
      .select("id, name, total_spend")
      .eq("organization_id", organizationId),
    supabase
      .from("clients")
      .select("id, stage, utm_campaign, source_ad_id")
      .eq("organization_id", organizationId),
  ]);

  const adSetIds = (adsData ?? []).map((a) => a.ad_set_id).filter((id): id is string => !!id);

  const { data: adSetsData } =
    adSetIds.length > 0
      ? await supabase
          .from("meta_ad_sets")
          .select("id, campaign_id")
          .eq("organization_id", organizationId)
          .in("id", adSetIds)
      : { data: [] as { id: string; campaign_id: string | null }[] };

  const adById = new Map((adsData ?? []).map((a) => [a.id, a]));
  const adSetToCampaign = new Map((adSetsData ?? []).map((a) => [a.id, a.campaign_id]));
  const campaignNameById = new Map((campaignsData ?? []).map((c) => [c.id, c.name ?? "Sin nombre"]));

  const adToCampaign = new Map<string, string>();
  for (const ad of adsData ?? []) {
    const campaignId = ad.ad_set_id ? adSetToCampaign.get(ad.ad_set_id) : null;
    if (campaignId) adToCampaign.set(ad.id, campaignId);
  }

  const quotesByClient = new Map<string, number>();
  for (const q of quotesData ?? []) {
    if (!q.client_id) continue;
    if (q.status === "rejected" || q.status === "expired") continue;
    quotesByClient.set(q.client_id, (quotesByClient.get(q.client_id) ?? 0) + Number(q.total));
  }

  const budgetByClient = new Map((memoryData ?? []).map((m) => [m.client_id, Number(m.estimated_budget ?? 0)]));

  const leads = clientsData.map((c) => {
    const ad = c.source_ad_id ? adById.get(c.source_ad_id) : undefined;
    const campaignId = ad?.ad_set_id ? adSetToCampaign.get(ad.ad_set_id) ?? null : null;
    const campaignName = campaignId ? campaignNameById.get(campaignId) ?? "Sin campaña" : "Sin campaña";
    const rawStage = c.stage as string | null;
    const dealValue = quotesByClient.get(c.id) ?? budgetByClient.get(c.id) ?? 0;

    return {
      name: c.name,
      ad: ad?.headline ?? ad?.name ?? "Anuncio desconocido",
      campaign: campaignName,
      utmCampaign: c.utm_campaign,
      date: c.created_at.slice(0, 10),
      stage: mapClientStageToJourney(rawStage),
      value: dealValue,
    };
  });

  // ── Attribution summary (CAC / ROAS / por campaña) ─────────────────
  const attribution = calculateAttributionSummary({
    clients: (allClientsData ?? []).map((c) => ({
      id: c.id,
      stage: c.stage as string | null,
      utm_campaign: c.utm_campaign,
      source_ad_id: c.source_ad_id,
    })),
    quotes: (quotesData ?? []).map((q) => ({
      client_id: q.client_id,
      total: Number(q.total),
      status: q.status,
    })),
    campaigns: (campaignsData ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      spend: Number(c.total_spend ?? 0),
    })),
    adToCampaign,
  });

  const summary = [
    { label: "Leads totales", value: attribution.totalLeads.toLocaleString("es-MX"), icon: Users, accent: "from-indigo-500 to-violet-600" },
    { label: "Cerrados (Ganados)", value: attribution.totalWon.toLocaleString("es-MX"), icon: CheckCircle2, accent: "from-emerald-500 to-teal-600" },
    { label: "Tasa de conversión", value: `${attribution.conversionRate.toFixed(1)}%`, icon: Percent, accent: "from-fuchsia-500 to-violet-600" },
    { label: "Ingresos atribuidos", value: formatCurrency(attribution.totalRevenue), icon: DollarSign, accent: "from-amber-500 to-orange-600" },
    { label: "CAC real", value: attribution.cac > 0 ? formatCurrency(attribution.cac) : "—", icon: Target, accent: "from-rose-500 to-pink-600" },
    { label: "ROAS real", value: attribution.roas > 0 ? `${attribution.roas.toFixed(1)}x` : "—", icon: TrendingUp, accent: "from-cyan-500 to-blue-600" },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Atribución</p>
        <h1 className="text-3xl font-semibold tracking-tight">Recorrido del Lead</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cada lead de Meta Ads, atribuido de extremo a extremo a través de tu pipeline de ventas.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl glass-card p-5 relative overflow-hidden">
            <div className={cn("absolute -top-10 -right-10 size-28 rounded-full blur-2xl opacity-40 bg-gradient-to-br", s.accent)} />
            <div className={cn("size-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", s.accent)}>
              <s.icon className="size-5 text-white" strokeWidth={2.2} />
            </div>
            <p className="text-xs text-muted-foreground mt-5">{s.label}</p>
            <p className="text-2xl font-semibold mt-1 tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {attribution.byCampaign.length > 0 && (
        <div className="rounded-2xl glass-card overflow-hidden">
          <div className="p-6 pb-4">
            <h2 className="text-lg font-semibold tracking-tight">Por campaña</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Rendimiento de adquisición por campaña de Meta Ads</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted-foreground border-y border-border/60 bg-secondary/20">
                  <th className="text-left font-medium px-6 py-3">Campaña</th>
                  <th className="text-right font-medium px-3 py-3">Leads</th>
                  <th className="text-right font-medium px-3 py-3">Ganados</th>
                  <th className="text-right font-medium px-3 py-3">Ingresos</th>
                  <th className="text-right font-medium px-3 py-3">Inversión</th>
                  <th className="text-right font-medium px-3 py-3">CAC</th>
                  <th className="text-right font-medium px-6 py-3">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {attribution.byCampaign.map((c) => (
                  <tr key={c.campaignId} className="border-b border-border/40 hover:bg-secondary/20 transition last:border-b-0">
                    <td className="px-6 py-4 font-medium">{c.campaignName}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{c.leads}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{c.won}</td>
                    <td className="px-3 py-4 text-right tabular-nums">
                      {c.revenue > 0 ? formatCurrency(c.revenue) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums">
                      {c.spend > 0 ? formatCurrency(c.spend) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums">
                      {c.cac > 0 ? formatCurrency(c.cac) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {c.roas > 0 ? `${c.roas.toFixed(1)}x` : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl glass-card overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Todos los leads</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{leads.length} leads atribuidos a Meta Ads</p>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground transition">Exportar CSV →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground border-y border-border/60 bg-secondary/20">
                <th className="text-left font-medium px-6 py-3">Cliente</th>
                <th className="text-left font-medium px-3 py-3">Anuncio origen</th>
                <th className="text-left font-medium px-3 py-3">Campaña</th>
                <th className="text-left font-medium px-3 py-3">UTM Campaign</th>
                <th className="text-left font-medium px-3 py-3">Fecha de ingreso</th>
                <th className="text-left font-medium px-3 py-3">Etapa actual</th>
                <th className="text-left font-medium px-3 py-3">Recorrido</th>
                <th className="text-right font-medium px-6 py-3">Valor del trato</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-secondary/20 transition last:border-b-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-600/40 flex items-center justify-center text-[11px] font-medium">
                        {l.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="font-medium">{l.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-muted-foreground max-w-[200px] truncate">{l.ad}</td>
                  <td className="px-3 py-4 text-muted-foreground">{l.campaign}</td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {l.utmCampaign ?? <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-3 py-4 text-muted-foreground tabular-nums">{l.date}</td>
                  <td className="px-3 py-4"><StageBadge s={l.stage} /></td>
                  <td className="px-3 py-4"><StageJourney s={l.stage} /></td>
                  <td className="px-6 py-4 text-right tabular-nums font-medium">
                    {l.value > 0 ? formatCurrency(l.value) : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
