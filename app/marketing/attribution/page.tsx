import { DollarSign, Users, CheckCircle2, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Atribución · Droplead",
};

const summary = [
  { label: "Leads totales", value: "1,284", icon: Users, accent: "from-indigo-500 to-violet-600" },
  { label: "Cerrados (Ganados)", value: "187", icon: CheckCircle2, accent: "from-emerald-500 to-teal-600" },
  { label: "Tasa de conversión", value: "14.6%", icon: Percent, accent: "from-fuchsia-500 to-violet-600" },
  { label: "ROAS", value: "4.2x", icon: DollarSign, accent: "from-amber-500 to-orange-600" },
];

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

const leads: { name: string; ad: string; campaign: string; date: string; stage: Stage; value: number }[] = [
  { name: "María González", ad: "Cierra más clientes…", campaign: "Q4 Retargeting", date: "2026-06-11", stage: "Ganado", value: 4800 },
  { name: "Carlos Ramírez", ad: "Tus leads de Meta…", campaign: "Lookalike 1%", date: "2026-06-11", stage: "Propuesta", value: 6200 },
  { name: "Ana Sofía Vega", ad: "El CRM que tu equipo…", campaign: "Tráfico Frío", date: "2026-06-10", stage: "Calificado", value: 3400 },
  { name: "Jorge Méndez", ad: "Ebook gratis…", campaign: "Lead Magnet", date: "2026-06-10", stage: "Contactado", value: 0 },
  { name: "Lucía Fernández", ad: "Demo en vivo · 15 min", campaign: "Retargeting", date: "2026-06-09", stage: "Ganado", value: 7800 },
  { name: "Diego Torres", ad: "¿Por qué pierdes…", campaign: "Tráfico Frío", date: "2026-06-09", stage: "Perdido", value: 0 },
  { name: "Camila Reyes", ad: "Black Friday 40% off", campaign: "Promo", date: "2026-06-08", stage: "Propuesta", value: 5100 },
  { name: "Andrés Quintero", ad: "De Instagram a venta", campaign: "Awareness", date: "2026-06-08", stage: "Nuevo", value: 0 },
  { name: "Valentina Soto", ad: "Tus leads de Meta…", campaign: "Lookalike 1%", date: "2026-06-07", stage: "Calificado", value: 4200 },
  { name: "Roberto Castaño", ad: "Cierra más clientes…", campaign: "Q4 Retargeting", date: "2026-06-07", stage: "Ganado", value: 9800 },
];

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

export default function AttributionPage() {
  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Atribución</p>
        <h1 className="text-3xl font-semibold tracking-tight">Recorrido del Lead</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cada lead de Meta Ads, atribuido de extremo a extremo a través de tu pipeline de ventas.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
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

      <div className="rounded-2xl glass-card overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Todos los leads</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{leads.length} leads · últimos 7 días</p>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground transition">Exportar CSV →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground border-y border-border/60 bg-secondary/20">
                <th className="text-left font-medium px-6 py-3">Cliente</th>
                <th className="text-left font-medium px-3 py-3">Anuncio origen</th>
                <th className="text-left font-medium px-3 py-3">Campaña</th>
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
                  <td className="px-3 py-4 text-muted-foreground tabular-nums">{l.date}</td>
                  <td className="px-3 py-4"><StageBadge s={l.stage} /></td>
                  <td className="px-3 py-4"><StageJourney s={l.stage} /></td>
                  <td className="px-6 py-4 text-right tabular-nums font-medium">
                    {l.value > 0 ? `$${l.value.toLocaleString()}` : <span className="text-muted-foreground">—</span>}
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
