import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { AdsGrid, type Ad, type Perf } from "./ads-grid";

const CTA_LABELS: Record<string, string> = {
  LEARN_MORE: "Ver más",
  SIGN_UP: "Registrarse",
  SHOP_NOW: "Comprar ahora",
  DOWNLOAD: "Descargar",
  CONTACT_US: "Contactarnos",
  GET_QUOTE: "Solicitar cotización",
  SUBSCRIBE: "Suscribirse",
  APPLY_NOW: "Aplicar ahora",
  GET_OFFER: "Ver oferta",
  MESSAGE_PAGE: "Enviar mensaje",
  CALL_NOW: "Llamar ahora",
  BOOK_TRAVEL: "Reservar",
  WATCH_MORE: "Ver más",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  ARCHIVED: "Archivado",
  DELETED: "Eliminado",
  IN_PROCESS: "En proceso",
  WITH_ISSUES: "Con problemas",
};

function ctaLabel(cta: string | null): string {
  if (!cta) return "Ver más";
  return CTA_LABELS[cta.toUpperCase()] ?? "Ver más";
}

function statusLabel(status: string | null): string {
  if (!status) return "Sin estado";
  return STATUS_LABELS[status.toUpperCase()] ?? status;
}

function classifyPerf(ctr: number): Perf {
  if (ctr >= 4) return "TOP";
  if (ctr >= 3) return "GOOD";
  if (ctr >= 1.5) return "AVG";
  return "LOW";
}

export default async function AdsPage() {
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

  const { data: adsData, error: adsError } = await supabase
    .from("meta_ads")
    .select("id, meta_ad_id, name, status, headline, body, image_url, video_url, permalink_url, cta_type")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (adsError) console.error("META ADS ERROR:", adsError);

  if (!adsData || adsData.length === 0) {
    return (
      <div className="p-8 max-w-[1400px]">
        <div className="rounded-2xl glass-card p-10 text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Biblioteca de creativos</p>
          <h1 className="text-2xl font-semibold tracking-tight">Sin creativos sincronizados</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Todavía no hay anuncios sincronizados desde Meta Ads. Conecta tu cuenta y sincroniza para ver tus creativos aquí.
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

  // ── Aggregate meta_ad_metrics over the last 30 days, per ad ──────
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 29);
  const startDateStr = startDate.toISOString().slice(0, 10);

  const { data: metricsData, error: metricsError } = await supabase
    .from("meta_ad_metrics")
    .select("ad_id, impressions, reach, clicks, spend, leads")
    .eq("organization_id", organizationId)
    .gte("date", startDateStr);

  if (metricsError) console.error("META AD METRICS ERROR:", metricsError);

  const metricsByAd = new Map<string, { impressions: number; reach: number; clicks: number; spend: number; leads: number }>();
  for (const m of metricsData ?? []) {
    if (!m.ad_id) continue;
    const entry = metricsByAd.get(m.ad_id) ?? { impressions: 0, reach: 0, clicks: 0, spend: 0, leads: 0 };
    entry.impressions += Number(m.impressions);
    entry.reach += Number(m.reach);
    entry.clicks += Number(m.clicks);
    entry.spend += Number(m.spend);
    entry.leads += Number(m.leads);
    metricsByAd.set(m.ad_id, entry);
  }

  const ads: Ad[] = adsData.map((ad, i) => {
    const agg = metricsByAd.get(ad.id) ?? { impressions: 0, reach: 0, clicks: 0, spend: 0, leads: 0 };
    const ctr = agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0;
    const cpl = agg.leads > 0 ? agg.spend / agg.leads : 0;

    return {
      id: ad.meta_ad_id,
      name: ad.name ?? "Sin nombre",
      headline: ad.headline ?? ad.name ?? "Sin título",
      copy: ad.body ?? "",
      cta: ctaLabel(ad.cta_type),
      status: statusLabel(ad.status),
      perf: classifyPerf(ctr),
      image: ad.image_url ?? "",
      video: ad.video_url ?? "",
      permalinkUrl: ad.permalink_url ?? null,
      impressions: agg.impressions.toLocaleString("es-MX"),
      reach: agg.reach.toLocaleString("es-MX"),
      clicks: agg.clicks.toLocaleString("es-MX"),
      ctr: `${ctr.toFixed(1)}%`,
      cpl: `$${cpl.toFixed(2)}`,
      spend: `$${agg.spend.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`,
      leads: agg.leads.toLocaleString("es-MX"),
      span: i % 3 === 0 ? "row-span-2" : "",
    };
  });

  return <AdsGrid ads={ads} />;
}
