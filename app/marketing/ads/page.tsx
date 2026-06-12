"use client";

import { useState } from "react";
import { Eye, MousePointerClick, TrendingUp, DollarSign, Target, Users, Activity, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Perf = "TOP" | "GOOD" | "AVG" | "LOW";

type Ad = {
  id: string;
  headline: string;
  copy: string;
  cta: string;
  campaign: string;
  perf: Perf;
  image: string;
  impressions: string;
  reach: string;
  clicks: string;
  ctr: string;
  cpl: string;
  spend: string;
  leads: string;
  span: string;
};

const ads: Ad[] = [
  {
    id: "120203912839",
    headline: "Cierra más clientes sin perder horas en seguimiento",
    copy: "Droplead automatiza la captura, calificación y nurturing de leads para equipos de ventas que no quieren perder tiempo. Conecta Meta Ads, WhatsApp y tu pipeline en minutos.",
    cta: "Solicitar demo",
    campaign: "Q4 Retargeting",
    perf: "TOP",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80",
    impressions: "248,120",
    reach: "189,402",
    clicks: "11,910",
    ctr: "4.8%",
    cpl: "$3.20",
    spend: "$2,140",
    leads: "669",
    span: "row-span-2",
  },
  {
    id: "120203912840",
    headline: "Tus leads de Meta directo al CRM",
    copy: "Sin Zapier. Sin hojas de cálculo. En segundos. Integración nativa con Meta Lead Ads.",
    cta: "Probar gratis",
    campaign: "Lookalike 1%",
    perf: "TOP",
    image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=80",
    impressions: "189,003",
    reach: "142,807",
    clicks: "9,640",
    ctr: "5.1%",
    cpl: "$2.80",
    spend: "$1,720",
    leads: "614",
    span: "",
  },
  {
    id: "120203912841",
    headline: "El CRM que tu equipo realmente va a usar",
    copy: "Diseñado para vendedores, no para gerentes. Interfaz limpia, móvil-first.",
    cta: "Ver más",
    campaign: "Tráfico Frío",
    perf: "GOOD",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80",
    impressions: "412,304",
    reach: "298,120",
    clicks: "13,194",
    ctr: "3.2%",
    cpl: "$4.10",
    spend: "$3,890",
    leads: "949",
    span: "",
  },
  {
    id: "120203912842",
    headline: "De Instagram a venta cerrada",
    copy: "Atribución completa del journey del lead. Sabe qué anuncio generó cada peso.",
    cta: "Ver atribución",
    campaign: "Awareness de Marca",
    perf: "AVG",
    image: "https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=1200&q=80",
    impressions: "156,920",
    reach: "120,201",
    clicks: "3,295",
    ctr: "2.1%",
    cpl: "$6.80",
    spend: "$1,420",
    leads: "209",
    span: "row-span-2",
  },
  {
    id: "120203912843",
    headline: "Ebook gratis: 12 hacks de conversión",
    copy: "Descarga el playbook que usan +400 startups para multiplicar sus cierres.",
    cta: "Descargar ebook",
    campaign: "Lead Magnet",
    perf: "TOP",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80",
    impressions: "98,140",
    reach: "78,920",
    clicks: "6,281",
    ctr: "6.4%",
    cpl: "$2.10",
    spend: "$890",
    leads: "424",
    span: "",
  },
  {
    id: "120203912844",
    headline: "¿Por qué pierdes el 60% de tus leads?",
    copy: "Spoiler: no es por tu producto. Es por tu seguimiento.",
    cta: "Leer artículo",
    campaign: "Tráfico Frío",
    perf: "LOW",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    impressions: "302,401",
    reach: "240,109",
    clicks: "3,629",
    ctr: "1.2%",
    cpl: "$12.40",
    spend: "$2,810",
    leads: "227",
    span: "",
  },
  {
    id: "120203912845",
    headline: "Demo en vivo · 15 minutos",
    copy: "Te mostramos cómo migrar tu pipeline completo sin perder un solo lead.",
    cta: "Agendar demo",
    campaign: "Retargeting",
    perf: "GOOD",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1200&q=80",
    impressions: "134,920",
    reach: "98,401",
    clicks: "5,127",
    ctr: "3.8%",
    cpl: "$3.90",
    spend: "$1,290",
    leads: "331",
    span: "",
  },
  {
    id: "120203912846",
    headline: "Black Friday: 40% off primer año",
    copy: "Solo durante noviembre. Plan Pro al precio del Starter.",
    cta: "Aprovechar oferta",
    campaign: "Promo",
    perf: "TOP",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80",
    impressions: "201,820",
    reach: "165,294",
    clicks: "14,531",
    ctr: "7.2%",
    cpl: "$1.80",
    spend: "$1,640",
    leads: "911",
    span: "row-span-2",
  },
];

const perfStyle: Record<Perf, string> = {
  TOP: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  GOOD: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  AVG: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  LOW: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const filters = ["Todos", "TOP", "GOOD", "AVG", "LOW"] as const;

export default function AdsPage() {
  const [selected, setSelected] = useState<Ad | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]>("Todos");

  const visible = filter === "Todos" ? ads : ads.filter((a) => a.perf === filter);

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Biblioteca de creativos</p>
          <h1 className="text-3xl font-semibold tracking-tight">Creativos publicitarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ads.length} creativos activos sincronizados desde Meta Ads Manager.
          </p>
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-medium border transition",
                filter === f
                  ? "gradient-primary text-white border-transparent"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[220px] gap-4">
        {visible.map((ad) => (
          <article
            key={ad.id}
            onClick={() => setSelected(ad)}
            className={cn(
              "group relative overflow-hidden rounded-2xl glass-card p-0 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-500/10",
              ad.span,
            )}
          >
            <img
              src={ad.image}
              alt={ad.headline}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />

            {/* Top row */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-black/40 backdrop-blur text-white/85 border border-white/10">
                {ad.campaign}
              </span>
              <span className={cn("text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border backdrop-blur", perfStyle[ad.perf])}>
                {ad.perf}
              </span>
            </div>

            {/* Bottom content */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
              <h3 className="text-sm font-semibold leading-snug text-white line-clamp-2">{ad.headline}</h3>
              <p className="text-xs text-white/70 mt-1 line-clamp-2">{ad.copy}</p>
            </div>

            {/* Hover overlay metrics */}
            <div className="absolute inset-0 bg-background/92 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity p-5 flex flex-col">
              <span className={cn("self-start text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border", perfStyle[ad.perf])}>
                {ad.perf}
              </span>
              <h3 className="text-sm font-semibold mt-3 leading-snug">{ad.headline}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{ad.copy}</p>

              <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-border/60">
                <Metric icon={Eye} label="Impresiones" value={ad.impressions} />
                <Metric icon={MousePointerClick} label="CTR" value={ad.ctr} />
                <Metric icon={TrendingUp} label="CPL" value={ad.cpl} />
                <Metric icon={DollarSign} label="Gasto" value={ad.spend} />
              </div>
            </div>
          </article>
        ))}
      </div>

      <AdDetailDialog ad={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="size-7 rounded-md bg-secondary/60 flex items-center justify-center">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xs font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function AdDetailDialog({ ad, onClose }: { ad: Ad | null; onClose: () => void }) {
  return (
    <Dialog open={!!ad} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background border-border/60 max-h-[92vh] overflow-y-auto">
        {ad && (
          <>
            <DialogTitle className="sr-only">{ad.headline}</DialogTitle>
            <DialogDescription className="sr-only">{ad.copy}</DialogDescription>

            {/* Image */}
            <div className="relative h-72 sm:h-80 w-full overflow-hidden">
              <img src={ad.image} alt={ad.headline} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute top-4 left-4 right-12 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md bg-black/50 backdrop-blur text-white border border-white/10">
                  {ad.campaign}
                </span>
                <span className={cn("text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md border backdrop-blur font-semibold", perfStyle[ad.perf])}>
                  {ad.perf}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6 -mt-10 relative">
              <div>
                <h2 className="text-xl font-semibold tracking-tight leading-snug">{ad.headline}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{ad.copy}</p>
              </div>

              {/* CTA preview */}
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Botón de acción</p>
                  <p className="text-sm font-medium mt-0.5">droplead.io</p>
                </div>
                <button className="h-9 px-4 rounded-lg gradient-primary text-sm font-medium text-white shadow-lg shadow-indigo-500/25">
                  {ad.cta}
                </button>
              </div>

              {/* Metrics grid */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Métricas completas</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FullMetric icon={Eye} label="Impresiones" value={ad.impressions} />
                  <FullMetric icon={Users} label="Alcance" value={ad.reach} />
                  <FullMetric icon={MousePointerClick} label="Clics" value={ad.clicks} />
                  <FullMetric icon={Activity} label="CTR" value={ad.ctr} />
                  <FullMetric icon={TrendingUp} label="CPL" value={ad.cpl} />
                  <FullMetric icon={DollarSign} label="Gasto total" value={ad.spend} />
                  <FullMetric icon={Target} label="Leads generados" value={ad.leads} />
                  <FullMetric icon={Activity} label="ID del anuncio" value={ad.id.slice(-6)} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  onClick={onClose}
                  className="h-9 px-4 rounded-lg border border-border bg-secondary/40 text-sm hover:bg-secondary transition"
                >
                  Cerrar
                </button>
                <a
                  href={`https://business.facebook.com/adsmanager/manage/ads?selected_ad_ids=${ad.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-4 rounded-lg gradient-primary text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition flex items-center gap-2"
                >
                  <ExternalLink className="size-4" />
                  Ver en Meta Ads Manager
                </a>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FullMetric({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-md gradient-primary/20 bg-secondary/60 flex items-center justify-center">
          <Icon className="size-3.5 text-indigo-300" />
        </div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-base font-semibold tabular-nums mt-2">{value}</p>
    </div>
  );
}
