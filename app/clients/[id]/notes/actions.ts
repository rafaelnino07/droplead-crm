'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function addClientNote(formData: FormData) {
    const clientId = formData.get('clientId') as string
    const note = String(formData.get('note') ?? '').trim()

    if (!clientId || !note) {
        throw new Error('Missing required fields')
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

    const { error: activityError } = await supabase
        .from('client_activities')
        .insert({
            organization_id: profile.organization_id,
            client_id: clientId,
            created_by: user.id,
            type: 'note_added',
            title: 'Nota comercial',
            description: note,
            metadata: {
                source: 'manual',
            },
        })

    if (activityError) {
        console.error('NOTE ACTIVITY ERROR:', activityError)
        throw activityError
    }

    revalidatePath(`/clients/${clientId}`)
    revalidatePath('/scp')
    revalidatePath('/pipeline')
}
