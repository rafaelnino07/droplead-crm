'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getClientStageLabel } from '@/lib/scp/stages'

export async function updateClientStage(formData: FormData) {
    const clientId = formData.get('clientId') as string
    const currentStage = formData.get('currentStage') as string
    const newStage = formData.get('newStage') as string

    if (!clientId || !newStage) {
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

    if (currentStage === newStage) {
        redirect(`/clients/${clientId}`)
    }

    const { error: updateError } = await supabase
        .from('clients')
        .update({
            stage: newStage,
            updated_at: new Date().toISOString(),
        })
        .eq('id', clientId)
        .eq('organization_id', profile.organization_id)

    if (updateError) {
        console.error('UPDATE STAGE ERROR:', updateError)
        throw updateError
    }

    const fromLabel = getClientStageLabel(currentStage)
    const toLabel = getClientStageLabel(newStage)

    const { error: activityError } = await supabase
        .from('client_activities')
        .insert({
            organization_id: profile.organization_id,
            client_id: clientId,
            created_by: user.id,
            type: 'stage_changed',
            title: 'Etapa actualizada',
            description: `${fromLabel} → ${toLabel}`,
            metadata: {
                from_stage: currentStage,
                to_stage: newStage,
                from_label: fromLabel,
                to_label: toLabel,
                changed_at: new Date().toISOString(),
            },
        })

    if (activityError) {
        console.error('STAGE ACTIVITY ERROR:', activityError)
        throw activityError
    }

    revalidatePath(`/clients/${clientId}`)
    revalidatePath('/clients')
    revalidatePath('/scp')

    redirect(`/clients/${clientId}`)
}