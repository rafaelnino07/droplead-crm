'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { generateExecutiveSummaryText } from '@/lib/ai/executive-summary'
import { calculateScpHealth } from '@/lib/scoring/scp-health'

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

export async function autoPopulateMemory(clientId: string) {
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
        .select('name, email, phone, notes, created_at, is_active, source, utm_campaign, utm_content, source_ad_id, client_type, company')
        .eq('id', clientId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    if (!client) {
        throw new Error('Client not found')
    }

    const { data: quotes } = await supabase
        .from('quotes')
        .select('project_type, client_vision, total, status')
        .eq('client_id', clientId)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

    const { data: activities } = await supabase
        .from('client_activities')
        .select('*')
        .eq('client_id', clientId)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(10)

    const { data: memory } = await supabase
        .from('commercial_memory')
        .select('*')
        .eq('client_id', clientId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    const safeQuotes = quotes ?? []
    const safeActivities = activities ?? []

    let hasChanges = false

    const highestQuote = safeQuotes.reduce<typeof safeQuotes[number] | null>(
        (best, quote) => (!best || quote.total > best.total ? quote : best),
        null
    )

    let projectType = memory?.project_type ?? null

    if (!projectType && highestQuote?.project_type) {
        projectType = highestQuote.project_type
        hasChanges = true
    }

    let estimatedBudget = memory?.estimated_budget ?? null

    if (!estimatedBudget && highestQuote && highestQuote.total > 0) {
        estimatedBudget = highestQuote.total
        hasChanges = true
    }

    let leadSource = memory?.lead_source ?? null

    if (!leadSource) {
        if (client.source === 'meta_ads') {
            leadSource = 'Meta Ads'
            hasChanges = true
        } else if (client.source === 'manual') {
            leadSource = 'Referido/Manual'
            hasChanges = true
        }
    }

    let closingProbability = memory?.closing_probability ?? null

    if (closingProbability === null) {
        const scpHealth = calculateScpHealth({
            client,
            quotes: safeQuotes,
            activities: safeActivities,
        })

        closingProbability = scpHealth.score
        hasChanges = true
    }

    if (!hasChanges) {
        return
    }

    const { error: upsertError } = await supabase
        .from('commercial_memory')
        .upsert(
            {
                organization_id: profile.organization_id,
                client_id: clientId,
                estimated_budget: estimatedBudget,
                urgency: memory?.urgency ?? null,
                closing_probability: closingProbability,
                temperature: memory?.temperature ?? null,
                project_type: projectType,
                lead_source: leadSource,
                executive_summary: memory?.executive_summary ?? null,
                pain_points: memory?.pain_points ?? null,
                desires: memory?.desires ?? null,
                objections: memory?.objections ?? null,
                competitors: memory?.competitors ?? null,
                next_step: memory?.next_step ?? null,
                next_step_date: memory?.next_step_date ?? null,
            },
            { onConflict: 'client_id' }
        )

    if (upsertError) {
        console.error('AUTO POPULATE MEMORY ERROR:', upsertError)
        throw upsertError
    }

    const { error: activityError } = await supabase
        .from('client_activities')
        .insert({
            organization_id: profile.organization_id,
            client_id: clientId,
            created_by: user.id,
            type: 'memory_auto_populated',
            title: 'Inteligencia actualizada automáticamente',
            description: null,
            metadata: {
                recent_activity_count: safeActivities.length,
            },
        })

    if (activityError) {
        console.error('MEMORY AUTO-POPULATE ACTIVITY ERROR:', activityError)
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