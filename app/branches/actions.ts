'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function createBranch(formData: FormData) {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) redirect('/onboarding')

    const name = String(formData.get('name') ?? '').trim()
    const city = String(formData.get('city') ?? '').trim()
    const address = String(formData.get('address') ?? '').trim()
    const phone = String(formData.get('phone') ?? '').trim()

    if (!name) {
        throw new Error('El nombre de la sucursal es obligatorio')
    }

    const { error } = await supabase
        .from('branches')
        .insert({
            organization_id: profile.organization_id,
            name,
            city: city || null,
            address: address || null,
            phone: phone || null,
            is_active: true,
        })

    if (error) {
        throw error
    }

    revalidatePath('/branches')
}

export async function toggleBranchActive(formData: FormData) {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) redirect('/onboarding')

    const branchId = String(formData.get('branch_id'))
    const isActive = formData.get('is_active') === 'true'

    const { error } = await supabase
        .from('branches')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', branchId)
        .eq('organization_id', profile.organization_id)

    if (error) {
        throw error
    }

    revalidatePath('/branches')
}
