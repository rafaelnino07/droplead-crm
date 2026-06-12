'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { generateExecutiveSummaryText } from '@/lib/ai/executive-summary'

export async function saveCommercialMemory(formData: FormData) {
    const clientId = formData.get('clientId') as string

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

    const payload = {
        organization_id: profile.organization_id,
        client_id: clientId,

        estimated_budget:
            formData.get('estimated_budget') || null,

        urgency:
            formData.get('urgency') || null,

        closing_probability:
            formData.get('closing_probability') || null,

        temperature:
            formData.get('temperature') || null,

        project_type:
            formData.get('project_type') || null,

        lead_source:
            formData.get('lead_source') || null,

        executive_summary:
            formData.get('executive_summary') || null,

        pain_points:
            formData.get('pain_points') || null,

        desires:
            formData.get('desires') || null,

        objections:
            formData.get('objections') || null,

        competitors:
            formData.get('competitors') || null,

        next_step:
            formData.get('next_step') || null,

        next_step_date:
            formData.get('next_step_date') || null,
    }

    const { error } = await supabase
        .from('commercial_memory')
        .upsert(payload, {
            onConflict: 'client_id',
        })

    if (error) {
        console.error(error)
        throw error
    }

    revalidatePath(`/clients/${clientId}`)
    revalidatePath(`/clients/${clientId}/memory`)
}

export async function generateExecutiveSummary(formData: FormData) {
    const clientId = formData.get('clientId') as string

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

    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('organization_id', profile.organization_id)
        .single()

    if (!client) {
        throw new Error('Client not found')
    }

    const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('client_id', clientId)
        .eq('organization_id', profile.organization_id)

    const { data: activities } = await supabase
        .from('client_activities')
        .select('*')
        .eq('client_id', clientId)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

    const { data: memory } = await supabase
        .from('commercial_memory')
        .select('*')
        .eq('client_id', clientId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    let summary: string

    try {
        summary = await generateExecutiveSummaryText({
            client,
            quotes: quotes ?? [],
            activities: activities ?? [],
            commercialMemory: memory ?? null,
        })
    } catch (error) {
        console.error('[generateExecutiveSummary] Error generando resumen con IA:', error)
        throw error
    }

    const { error: upsertError } = await supabase
        .from('commercial_memory')
        .upsert(
            {
                organization_id: profile.organization_id,
                client_id: clientId,
                executive_summary: summary,
            },
            { onConflict: 'client_id' }
        )

    if (upsertError) {
        console.error('[generateExecutiveSummary] Error guardando resumen:', upsertError)
        throw upsertError
    }

    revalidatePath(`/clients/${clientId}`)
    revalidatePath(`/clients/${clientId}/memory`)
}