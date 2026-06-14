'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { createAutoTask } from '@/lib/tasks/create-auto-task'

async function getAuthorizedQuote(quoteId: string) {
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

    const { data: quote } = await supabase
        .from('quotes')
        .select('id, client_id, quote_number, share_token')
        .eq('id', quoteId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    if (!quote) {
        throw new Error('Quote not found')
    }

    return { supabase, user, profile, quote }
}

function revalidateQuote(quoteId: string, clientId: string | null) {
    revalidatePath(`/quotes/${quoteId}`)

    if (clientId) {
        revalidatePath(`/clients/${clientId}`)
    }
}

export async function markQuoteAsSent(quoteId: string) {
    const { supabase, user, profile, quote } = await getAuthorizedQuote(quoteId)

    const { error: updateError } = await supabase
        .from('quotes')
        .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .eq('organization_id', profile.organization_id)

    if (updateError) {
        throw updateError
    }

    if (quote.client_id) {
        const { error: activityError } = await supabase
            .from('client_activities')
            .insert({
                organization_id: profile.organization_id,
                client_id: quote.client_id,
                created_by: user.id,
                type: 'quote_sent',
                title: 'Cotización enviada',
                description: quote.quote_number,
                metadata: { quote_id: quoteId, quote_number: quote.quote_number },
            })

        if (activityError) {
            console.error('QUOTE SENT ACTIVITY ERROR:', activityError)
        }
    }

    await createAutoTask({
        supabase,
        organizationId: profile.organization_id,
        clientId: quote.client_id,
        createdBy: user.id,
        trigger: 'quote_sent',
    })

    revalidateQuote(quoteId, quote.client_id)
}

export async function markQuoteAsAccepted(quoteId: string) {
    const { supabase, user, profile, quote } = await getAuthorizedQuote(quoteId)

    const { error: updateError } = await supabase
        .from('quotes')
        .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .eq('organization_id', profile.organization_id)

    if (updateError) {
        throw updateError
    }

    if (quote.client_id) {
        const { error: activityError } = await supabase
            .from('client_activities')
            .insert({
                organization_id: profile.organization_id,
                client_id: quote.client_id,
                created_by: user.id,
                type: 'quote_accepted',
                title: 'Proyecto ganado',
                description: 'El proyecto fue cerrado y ganado.',
                metadata: { quote_id: quoteId, quote_number: quote.quote_number },
            })

        if (activityError) {
            console.error('QUOTE ACCEPTED ACTIVITY ERROR:', activityError)
        }
    }

    await createAutoTask({
        supabase,
        organizationId: profile.organization_id,
        clientId: quote.client_id,
        createdBy: user.id,
        trigger: 'quote_accepted',
    })

    revalidateQuote(quoteId, quote.client_id)
}

export async function markQuoteAsRejected(quoteId: string) {
    const { supabase, user, profile, quote } = await getAuthorizedQuote(quoteId)

    const { error: updateError } = await supabase
        .from('quotes')
        .update({
            status: 'rejected',
            rejected_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .eq('organization_id', profile.organization_id)

    if (updateError) {
        throw updateError
    }

    if (quote.client_id) {
        const { error: activityError } = await supabase
            .from('client_activities')
            .insert({
                organization_id: profile.organization_id,
                client_id: quote.client_id,
                created_by: user.id,
                type: 'quote_rejected',
                title: 'Cotización rechazada',
                description: quote.quote_number,
                metadata: { quote_id: quoteId, quote_number: quote.quote_number },
            })

        if (activityError) {
            console.error('QUOTE REJECTED ACTIVITY ERROR:', activityError)
        }
    }

    await createAutoTask({
        supabase,
        organizationId: profile.organization_id,
        clientId: quote.client_id,
        createdBy: user.id,
        trigger: 'quote_rejected',
    })

    revalidateQuote(quoteId, quote.client_id)
}

export async function generateShareToken(quoteId: string): Promise<string> {
    const { supabase, profile, quote } = await getAuthorizedQuote(quoteId)

    if (quote.share_token) {
        return quote.share_token
    }

    const token = randomUUID().replace(/-/g, '').slice(0, 16)

    const { error } = await supabase
        .from('quotes')
        .update({ share_token: token })
        .eq('id', quoteId)
        .eq('organization_id', profile.organization_id)

    if (error) {
        throw error
    }

    revalidatePath(`/quotes/${quoteId}`)

    return token
}