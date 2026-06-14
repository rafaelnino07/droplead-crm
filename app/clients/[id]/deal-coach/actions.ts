'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { generateDealCoach, type DealCoachInput } from '@/lib/ai/deal-coach'
import { calculateMomentum } from '@/lib/scoring/momentum'
import { calculateScpHealth } from '@/lib/scoring/scp-health'
import { calculateMoneyRadar } from '@/lib/scoring/money-radar'
import { calculateNextBestAction } from '@/lib/scoring/next-best-action'
import { getClientStageLabel } from '@/lib/scp/stages'

export async function generateDealCoachAdvice(formData: FormData) {
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
        .maybeSingle()

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
        .order('created_at', { ascending: false })

    const { data: activities } = await supabase
        .from('client_activities')
        .select('*')
        .eq('client_id', clientId)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

    const { data: commercialMemory } = await supabase
        .from('commercial_memory')
        .select('*')
        .eq('client_id', clientId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    const safeQuotes = quotes ?? []
    const safeActivities = activities ?? []

    const momentum = calculateMomentum({
        quotes: safeQuotes,
        activities: safeActivities,
    })

    const scpHealth = calculateScpHealth({
        client,
        quotes: safeQuotes,
        activities: safeActivities,
    })

    const moneyRadar = calculateMoneyRadar({
        quotes: safeQuotes,
        activities: safeActivities,
    })

    const nextBestAction = calculateNextBestAction({
        momentum,
        scpHealth,
        moneyRadar,
    })

    const stage = client.stage as string | null

    const dealCoachInput: DealCoachInput = {
        client: {
            name: client.name,
            company: client.company,
            stage,
            stageLabel: getClientStageLabel(stage),
        },
        momentum,
        scpHealth,
        moneyRadar: {
            status: moneyRadar.status,
            totalDetected: moneyRadar.totalDetected,
            hotMoney: moneyRadar.hotMoney,
            atRiskMoney: moneyRadar.atRiskMoney,
        },
        nextBestAction: {
            title: nextBestAction.title,
            description: nextBestAction.description,
            priority: nextBestAction.priority,
        },
        commercialMemory: commercialMemory
            ? {
                pain_points: commercialMemory.pain_points,
                desires: commercialMemory.desires,
                objections: commercialMemory.objections,
                competitors: commercialMemory.competitors,
                urgency: commercialMemory.urgency,
                temperature: commercialMemory.temperature,
                next_step: commercialMemory.next_step,
            }
            : null,
        recentActivities: safeActivities.map((activity) => ({
            type: activity.type,
            title: activity.title,
            created_at: activity.created_at,
        })),
        quotes: safeQuotes.map((quote) => ({
            quote_number: quote.quote_number,
            status: quote.status,
            total: Number(quote.total ?? 0),
        })),
    }

    const adviceText = await generateDealCoach(dealCoachInput)

    const { error: upsertError } = await supabase.from('deal_coach_cache').upsert(
        {
            organization_id: profile.organization_id,
            client_id: clientId,
            advice_text: adviceText,
            generated_at: new Date().toISOString(),
        },
        { onConflict: 'client_id' }
    )

    if (upsertError) {
        throw upsertError
    }

    revalidatePath(`/clients/${clientId}`)
}
