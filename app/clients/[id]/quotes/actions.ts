'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'

function generateQuoteNumber() {
    const now = new Date()
    const timestamp = now.getTime().toString().slice(-6)

    return `Q-${timestamp}`
}

export async function createQuote(
    clientId: string,
    formData: FormData
) {
    const supabase = await getSupabaseServer()

    const projectName = String(formData.get('project_name')).trim()
    const projectType = String(formData.get('project_type')).trim()
    const projectAddress = String(formData.get('project_address')).trim()
    const clientVision = String(formData.get('client_vision')).trim()
    const notes = String(formData.get('notes')).trim()
    const validUntil = String(formData.get('valid_until') ?? '').trim()
    const taxRate = Number(formData.get('tax_rate') || 0)
    const discountGlobal = Number(formData.get('discount_global') || 0)

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

    const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
            organization_id: profile.organization_id,
            client_id: clientId,
            created_by: user.id,
            quote_number: generateQuoteNumber(),
            version: 1,
            status: 'draft',
            project_name: projectName,
            project_type: projectType || null,
            project_address: projectAddress || null,
            client_vision: clientVision || null,
            subtotal: 0,
            discount_global: discountGlobal,
            discount_amount: 0,
            taxable_amount: 0,
            tax_rate: taxRate,
            tax_amount: 0,
            total: 0,
            template: 'modern',
            executive_name: profile.full_name,
            executive_email: profile.email,
            notes: notes || null,
            valid_until: validUntil || null,
            view_count: 0,
        })
        .select('id, quote_number')
        .single()

    if (error) {
        console.error('CREATE QUOTE ERROR:', error)

        redirect(
            `/clients/${clientId}/quotes/new?error=${encodeURIComponent(error.message)}`
        )
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