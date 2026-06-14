'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function toggleQuickAction(formData: FormData) {
    const actionId = formData.get('action_id') as string
    const isActive = formData.get('is_active') === 'true'

    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!profile) {
        throw new Error('Organization not found')
    }

    const { error } = await supabase
        .from('organization_quick_actions')
        .update({ is_active: !isActive })
        .eq('id', actionId)
        .eq('organization_id', profile.organization_id)

    if (error) {
        console.error('TOGGLE QUICK ACTION ERROR:', error)
        throw error
    }

    revalidatePath('/settings/quick-actions')
}

export async function createCustomAction(formData: FormData) {
    const label = (formData.get('label') as string)?.trim()
    const emoji = (formData.get('emoji') as string)?.trim() || '📋'

    if (!label) {
        throw new Error('El nombre de la acción es obligatorio')
    }

    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!profile) {
        throw new Error('Organization not found')
    }

    const { count: customCount } = await supabase
        .from('organization_quick_actions')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('is_custom', true)

    if ((customCount ?? 0) >= 2) {
        throw new Error('Ya existen 2 acciones personalizadas')
    }

    const { count: totalCount } = await supabase
        .from('organization_quick_actions')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)

    const { error } = await supabase
        .from('organization_quick_actions')
        .insert({
            organization_id: profile.organization_id,
            action_key: `custom_${Date.now()}`,
            label,
            emoji,
            is_active: true,
            is_universal: false,
            scp_stage: null,
            auto_task_trigger: null,
            sort_order: (totalCount ?? 0) + 1,
            is_custom: true,
        })

    if (error) {
        console.error('CREATE CUSTOM ACTION ERROR:', error)
        throw error
    }

    revalidatePath('/settings/quick-actions')
}

export async function deleteCustomAction(formData: FormData) {
    const actionId = formData.get('action_id') as string

    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!profile) {
        throw new Error('Organization not found')
    }

    const { data: action } = await supabase
        .from('organization_quick_actions')
        .select('is_custom')
        .eq('id', actionId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    if (!action?.is_custom) {
        throw new Error('Solo se pueden eliminar acciones personalizadas')
    }

    const { error } = await supabase
        .from('organization_quick_actions')
        .delete()
        .eq('id', actionId)
        .eq('organization_id', profile.organization_id)

    if (error) {
        console.error('DELETE CUSTOM ACTION ERROR:', error)
        throw error
    }

    revalidatePath('/settings/quick-actions')
}
