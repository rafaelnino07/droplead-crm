'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { QUICK_ACTIONS } from '@/lib/scp/quick-actions'
import { isMemoryAutoSyncAction, buildMemoryAutoSyncPatch } from '@/lib/scp/memory-auto-sync'
import { autoPopulateMemory } from '../memory/actions'
import { getStageAutoSyncTarget, isTerminalStage } from '@/lib/scp/stage-auto-sync'
import { getClientStageLabel } from '@/lib/scp/stages'
import { createAutoTask } from '@/lib/tasks/create-auto-task'
import type { AutoTaskTrigger } from '@/lib/tasks/auto-tasks'

const QUICK_ACTION_TO_TRIGGER: Partial<Record<string, AutoTaskTrigger>> = {
    call_completed: 'call_completed',
    whatsapp_sent: 'whatsapp_sent',
    meeting_completed: 'meeting_completed',
    site_visit_completed: 'site_visit_completed',
    no_response: 'no_response',
    budget_confirmed: 'budget_confirmed',
    plans_received: 'plans_received',
    proposal_sent: 'proposal_sent',
    verbal_acceptance: 'verbal_acceptance',
}

export async function addQuickAction(formData: FormData) {
    const clientId = formData.get('clientId') as string
    const actionType = formData.get('actionType') as string

    const action = QUICK_ACTIONS.find((item) => item.key === actionType)

    if (!clientId || !action) {
        throw new Error('Missing or invalid quick action')
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
            type: action.key,
            title: action.title,
            description: action.description,
            metadata: {
                source: 'quick_action',
            },
        })

    if (activityError) {
        console.error('QUICK ACTION ACTIVITY ERROR:', activityError)
        throw activityError
    }

    if (isMemoryAutoSyncAction(action.key)) {
        const { data: memory } = await supabase
            .from('commercial_memory')
            .select('competitors')
            .eq('client_id', clientId)
            .eq('organization_id', profile.organization_id)
            .maybeSingle()

        const patch = buildMemoryAutoSyncPatch({
            actionKey: action.key,
            currentMemory: memory,
        })

        if (patch && Object.keys(patch).length > 0) {
            const { error: memoryError } = await supabase
                .from('commercial_memory')
                .upsert(
                    {
                        organization_id: profile.organization_id,
                        client_id: clientId,
                        ...patch,
                    },
                    { onConflict: 'client_id' }
                )

            if (memoryError) {
                console.error('MEMORY AUTO-SYNC ERROR:', memoryError)
                throw memoryError
            }
        }
    }

    const targetStage = getStageAutoSyncTarget(action.key)

    if (targetStage) {
        const { data: clientRow } = await supabase
            .from('clients')
            .select('stage')
            .eq('id', clientId)
            .eq('organization_id', profile.organization_id)
            .single()

        const currentStage = clientRow?.stage ?? null

        if (!isTerminalStage(currentStage) && currentStage !== targetStage) {
            const { error: stageUpdateError } = await supabase
                .from('clients')
                .update({
                    stage: targetStage,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', clientId)
                .eq('organization_id', profile.organization_id)

            if (stageUpdateError) {
                console.error('STAGE AUTO-SYNC UPDATE ERROR:', stageUpdateError)
                throw stageUpdateError
            }

            const fromLabel = getClientStageLabel(currentStage)
            const toLabel = getClientStageLabel(targetStage)

            const { error: stageActivityError } = await supabase
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
                        to_stage: targetStage,
                        from_label: fromLabel,
                        to_label: toLabel,
                        changed_at: new Date().toISOString(),
                        source: 'quick_action_auto_sync',
                        triggered_by_action: action.key,
                    },
                })

            if (stageActivityError) {
                console.error('STAGE AUTO-SYNC ACTIVITY ERROR:', stageActivityError)
                throw stageActivityError
            }
        }
    }

    if (actionType === 'budget_confirmed' || actionType === 'plans_received') {
        await autoPopulateMemory(clientId)
    }

    const autoTrigger = QUICK_ACTION_TO_TRIGGER[actionType]

    if (autoTrigger) {
        await createAutoTask({
            supabase,
            organizationId: profile.organization_id,
            clientId,
            createdBy: user.id,
            trigger: autoTrigger,
        })
    }

    revalidatePath(`/clients/${clientId}`)
    revalidatePath(`/clients/${clientId}/memory`)
    revalidatePath('/clients')
    revalidatePath('/scp')
    revalidatePath('/pipeline')
}
