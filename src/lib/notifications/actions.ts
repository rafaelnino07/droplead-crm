'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer, getActiveOrganizationId } from '@/lib/supabase/server'

export async function markAsRead(notificationId: string) {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

    if (error) {
        throw error
    }

    revalidatePath('/dashboard')
}

export async function markAllAsRead() {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const organizationId = await getActiveOrganizationId(supabase, user.id)

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('organization_id', organizationId)
        .eq('is_read', false)

    if (error) {
        throw error
    }

    revalidatePath('/dashboard')
}
