import { cookies } from 'next/headers'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { exitImpersonation } from '../../admin/actions'

export async function ImpersonationBanner() {
    const cookieStore = cookies()
    const impersonatedOrgId = cookieStore.get('impersonated_org_id')?.value

    if (!impersonatedOrgId) return null

    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!superAdmin) return null

    const supabaseAdmin = getSupabaseAdmin()
    const { data: organization } = await supabaseAdmin
        .from('organizations')
        .select('name')
        .eq('id', impersonatedOrgId)
        .maybeSingle()

    const impersonatedOrgName = organization?.name ?? null

    if (!impersonatedOrgName) return null

    return (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-black">
            <span>👁 Viendo como: {impersonatedOrgName}</span>
            <form action={exitImpersonation}>
                <button className="rounded bg-black px-3 py-1 text-xs font-semibold text-white">
                    Salir
                </button>
            </form>
        </div>
    )
}
