import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { saveMetaAdAccount } from "./actions";
import { SyncButton, CopyButton } from "./settings-client";
import { TokenInput } from "./token-input";

export default async function SettingsPage() {
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

  const { data: account } = await supabase
    .from("meta_ad_accounts")
    .select("meta_account_id, access_token_encrypted")
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  const webhookUrl = "https://droplead.app/api/webhooks/lead";

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Configuración</p>
        <h1 className="text-3xl font-semibold tracking-tight">Configuración de Marketing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conecta tu cuenta de Meta Ads y administra el webhook de ingesta de leads.
        </p>
      </div>

      {/* Connection status */}
      <div className="rounded-2xl glass-card p-5 flex items-center gap-4">
        <div className="size-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="size-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold flex items-center gap-2">
            Meta Ads conectado
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Última sincronización: <span className="text-foreground/80">hace 2 minutos</span> · 1,284 leads sincronizados
          </p>
        </div>
        <SyncButton />
      </div>

      {/* Credentials */}
      <section className="rounded-2xl glass-card p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Credenciales de Meta Ads</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Almacenadas de forma cifrada. Se usan para llamar a la Marketing API en tu nombre.
          </p>
        </div>

        <form action={saveMetaAdAccount} className="space-y-5">
          <Field label="ID de cuenta publicitaria">
            <input
              name="meta_account_id"
              defaultValue={account?.meta_account_id ?? ""}
              className="w-full h-10 rounded-lg bg-secondary/50 border border-border/60 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/40"
              placeholder="act_1234567890"
            />
          </Field>

          <Field label="Token de acceso">
            <TokenInput defaultValue={account?.access_token_encrypted ?? ""} />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Genéralo desde Meta Business → Usuarios del Sistema → Generar token.
            </p>
          </Field>

          <div className="flex justify-end pt-2 border-t border-border/40">
            <button type="submit" className="h-9 px-4 rounded-lg gradient-primary text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition">
              Guardar credenciales
            </button>
          </div>
        </form>
      </section>

      {/* Webhook */}
      <section className="rounded-2xl glass-card p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Webhook de leads</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Configura este endpoint en tu formulario de Meta Lead Ads para recibir leads en tiempo real.
          </p>
        </div>

        <div className="flex items-stretch gap-0 rounded-lg border border-border/60 overflow-hidden bg-secondary/40">
          <span className="px-3 flex items-center text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/60 border-r border-border/60">
            POST
          </span>
          <code className="flex-1 px-3 py-2.5 text-sm font-mono truncate">{webhookUrl}</code>
          <CopyButton text={webhookUrl} />
        </div>

        <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/20 p-3 text-xs text-muted-foreground">
          <span className="text-indigo-300 font-medium">Tip:</span> Los eventos del webhook están firmados con HMAC-SHA256. Verifica el encabezado{" "}
          <code className="text-foreground bg-secondary/60 px-1 py-0.5 rounded">x-droplead-signature</code> antes de procesar.
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
