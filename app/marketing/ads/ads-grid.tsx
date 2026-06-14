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
import { AdCard } from "../../components/marketing/ad-card";

export type Perf = "TOP" | "GOOD" | "AVG" | "LOW";

export type Ad = {
  id: string;
  name: string;
  headline: string;
  copy: string;
  cta: string;
  status: string;
  perf: Perf;
  image: string;
  video: string;
  permalinkUrl: string | null;
  impressions: string;
  reach: string;
  clicks: string;
  ctr: string;
  cpl: string;
  spend: string;
  leads: string;
  span: string;
};

const perfStyle: Record<Perf, string> = {
  TOP: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  GOOD: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  AVG: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  LOW: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const filters = ["Todos", "TOP", "GOOD", "AVG", "LOW"] as const;

export function AdsGrid({ ads }: { ads: Ad[] }) {
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
            <AdCard
              name={ad.name}
              headline={ad.headline}
              imageUrl={ad.image}
              videoUrl={ad.video}
              permalinkUrl={ad.permalinkUrl}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />

            {/* Top row */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-black/40 backdrop-blur text-white/85 border border-white/10">
                {ad.status}
              </span>
              <span className={cn("text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border backdrop-blur", perfStyle[ad.perf])}>
                {ad.perf}
              </span>
            </div>

            {/* Bottom content */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
              <h3 className="text-sm font-semibold leading-snug text-white line-clamp-2">{ad.headline}</h3>
              <p className="text-xs text-white/70 mt-1 line-clamp-2">{ad.copy}</p>
              {ad.permalinkUrl && (
                <a
                  href={ad.permalinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-300 hover:text-indigo-200"
                >
                  Ver en Meta →
                </a>
              )}
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
              <AdCard
                name={ad.name}
                headline={ad.headline}
                imageUrl={ad.image}
                videoUrl={ad.video}
                permalinkUrl={ad.permalinkUrl}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute top-4 left-4 right-12 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md bg-black/50 backdrop-blur text-white border border-white/10">
                  {ad.status}
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
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Nombre del anuncio</p>
                  <p className="text-sm font-medium mt-0.5 truncate max-w-[220px]">{ad.name}</p>
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
