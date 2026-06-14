'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function impersonateOrg(formData: FormData) {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const supabaseAdmin = getSupabaseAdmin()

    const { data: superAdmin } = await supabaseAdmin
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!superAdmin) redirect('/dashboard')

    const organizationId = String(formData.get('organization_id') ?? '').trim()

    if (!organizationId) {
        throw new Error('organization_id es obligatorio')
    }

    const cookieStore = cookies()
    cookieStore.set('impersonated_org_id', organizationId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
    })

    redirect('/dashboard')
}

export async function exitImpersonation() {
    const cookieStore = cookies()
    cookieStore.delete('impersonated_org_id')
    redirect('/admin')
}
