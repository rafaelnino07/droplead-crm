import "./globals.css";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ImpersonationBanner } from "./components/admin/impersonation-banner";
import CopilotWidget from "./components/revenue-copilot/copilot-widget";

const geist = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: "Droplead CRM",
  description: "CRM interno de Droplead",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const impersonatedOrgId = cookieStore.get("impersonated_org_id")?.value ?? null;

  let isSuperAdmin = false;
  let impersonatedOrgName: string | null = null;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    isSuperAdmin = !!superAdmin;

    if (impersonatedOrgId && isSuperAdmin) {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: organization } = await supabaseAdmin
        .from("organizations")
        .select("name")
        .eq("id", impersonatedOrgId)
        .maybeSingle();

      impersonatedOrgName = organization?.name ?? null;
    }
  }

  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body>
        <ImpersonationBanner impersonatedOrgName={impersonatedOrgName} />
        <div className="flex min-h-screen">
          <Sidebar isSuperAdmin={isSuperAdmin} />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
        <CopilotWidget />
      </body>
    </html>
  );
}