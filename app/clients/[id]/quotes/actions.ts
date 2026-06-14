'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { autoPopulateMemory } from '../memory/actions'

function generateQuoteNumber() {
    const now = new Date()
    const timestamp = now.getTime().toString().slice(-6)

    return `Q-${timestamp}`
}

async function generateOrgQuoteNumber(
    supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
    organizationId: string
) {
    const { data: org } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', organizationId)
        .maybeSingle()

    if (!org?.slug) {
        return null
    }

    const year = new Date().getFullYear()

    const { count } = await supabase
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', `${year}-01-01T00:00:00.000Z`)

    const sequential = ((count ?? 0) + 1).toString().padStart(3, '0')

    return `${org.slug.slice(0, 3).toUpperCase()}-${year}-${sequential}`
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

    let quoteNumber = await generateOrgQuoteNumber(supabase, profile.organization_id)

    if (!quoteNumber) {
        const { data: rpcQuoteNumber } = await supabase.rpc('generate_quote_number', {
            org_id: profile.organization_id,
        })
        quoteNumber = rpcQuoteNumber ?? generateQuoteNumber()
    }

    const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
            organization_id: profile.organization_id,
            client_id: clientId,
            created_by: user.id,
            quote_number: quoteNumber,
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

    await autoPopulateMemory(clientId)

    redirect(`/quotes/${quote.id}/edit`)
}
