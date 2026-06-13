'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'

function generateQuoteNumber() {
    const now = new Date()
    const timestamp = now.getTime().toString().slice(-6)

    return `Q-${timestamp}`
}

export async function createQuote(clientId: string) {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, full_name, email')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) {
        redirect('/onboarding')
    }

    const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    if (!client) {
        redirect('/clients')
    }

    const { data: quoteNumber } = await supabase.rpc('generate_quote_number', {
        org_id: profile.organization_id,
    })

    const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
            organization_id: profile.organization_id,
            client_id: clientId,
            created_by: user.id,
            quote_number: quoteNumber ?? generateQuoteNumber(),
            version: 1,
            status: 'draft',
            project_name: '',
            project_type: null,
            project_address: null,
            client_vision: null,
            subtotal: 0,
            discount_global: 0,
            discount_amount: 0,
            taxable_amount: 0,
            tax_rate: 0,
            tax_amount: 0,
            total: 0,
            template: 'modern',
            executive_name: profile.full_name,
            executive_email: profile.email,
            notes: null,
            valid_until: null,
            view_count: 0,
        })
        .select('id, quote_number')
        .single()

    if (error) {
        console.error('CREATE QUOTE ERROR:', error)
        redirect(`/clients/${clientId}?error=${encodeURIComponent(error.message)}`)
    }

    const { error: activityError } = await supabase
        .from('client_activities')
        .insert({
            organization_id: profile.organization_id,
            client_id: clientId,
            created_by: user.id,
            type: 'proposal_created',
            title: 'Cotización creada',
            description: `Se creó la cotización ${quote.quote_number}.`,
            metadata: {
                quote_id: quote.id,
                quote_number: quote.quote_number,
            },
        })

    if (activityError) {
        console.error('QUOTE ACTIVITY ERROR:', activityError)
    }

    redirect(`/quotes/${quote.id}/edit`)
}
