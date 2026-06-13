'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServer>>

export async function recalculateQuoteTotals(
    supabase: SupabaseServerClient,
    quoteId: string,
    organizationId: string
) {
    const { data: items } = await supabase
        .from('quote_items')
        .select('subtotal')
        .eq('quote_id', quoteId)

    const subtotal = (items ?? []).reduce((sum, item) => sum + Number(item.subtotal), 0)

    const { data: quote } = await supabase
        .from('quotes')
        .select('tax_rate, discount_global')
        .eq('id', quoteId)
        .eq('organization_id', organizationId)
        .maybeSingle()

    const taxRate = Number(quote?.tax_rate ?? 0)
    const discountGlobal = Number(quote?.discount_global ?? 0)

    const discountAmount = subtotal * (discountGlobal / 100)
    const taxableAmount = subtotal - discountAmount
    const taxAmount = taxableAmount * (taxRate / 100)
    const total = taxableAmount + taxAmount

    await supabase
        .from('quotes')
        .update({
            subtotal,
            discount_amount: discountAmount,
            taxable_amount: taxableAmount,
            tax_amount: taxAmount,
            total,
            updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .eq('organization_id', organizationId)
}

export async function updateQuoteMeta(formData: FormData) {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) redirect('/onboarding')

    const quoteId = String(formData.get('quote_id'))

    const { data: quote } = await supabase
        .from('quotes')
        .select('id, client_id, quote_number')
        .eq('id', quoteId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    if (!quote) {
        throw new Error('Quote not found')
    }

    const projectName = String(formData.get('project_name') ?? '').trim()
    const projectType = String(formData.get('project_type') ?? '').trim()
    const projectAddress = String(formData.get('project_address') ?? '').trim()
    const clientVision = String(formData.get('client_vision') ?? '').trim()
    const notes = String(formData.get('notes') ?? '').trim()
    const validUntil = String(formData.get('valid_until') ?? '').trim()
    const taxRate = Number(formData.get('tax_rate') || 0)
    const discountGlobal = Number(formData.get('discount_global') || 0)

    const { error } = await supabase
        .from('quotes')
        .update({
            project_name: projectName,
            project_type: projectType || null,
            project_address: projectAddress || null,
            client_vision: clientVision || null,
            notes: notes || null,
            valid_until: validUntil || null,
            tax_rate: taxRate,
            discount_global: discountGlobal,
            updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .eq('organization_id', profile.organization_id)

    if (error) {
        throw error
    }

    await recalculateQuoteTotals(supabase, quoteId, profile.organization_id)

    if (quote.client_id) {
        const { error: activityError } = await supabase
            .from('client_activities')
            .insert({
                organization_id: profile.organization_id,
                client_id: quote.client_id,
                created_by: user.id,
                type: 'quote_updated',
                title: 'Cotización actualizada',
                description: `Se actualizó la cotización ${quote.quote_number}.`,
                metadata: { quote_id: quoteId, quote_number: quote.quote_number },
            })

        if (activityError) console.error('QUOTE UPDATED ACTIVITY ERROR:', activityError)
    }

    revalidatePath(`/quotes/${quoteId}`)
}

export async function upsertQuoteItem(formData: FormData) {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) redirect('/onboarding')

    const quoteId = String(formData.get('quote_id'))
    const itemId = formData.get('id') ? String(formData.get('id')) : null

    const { data: quote } = await supabase
        .from('quotes')
        .select('id, client_id, quote_number')
        .eq('id', quoteId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    if (!quote) {
        throw new Error('Quote not found')
    }

    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const quantity = Number(formData.get('quantity') || 1)
    const unit = String(formData.get('unit') || 'pza').trim()
    const unitPrice = Number(formData.get('unit_price') || 0)
    const discountPct = Number(formData.get('discount_pct') || 0)

    const discountAmount = unitPrice * quantity * (discountPct / 100)
    const subtotal = unitPrice * quantity - discountAmount

    if (itemId) {
        const { error } = await supabase
            .from('quote_items')
            .update({
                name,
                description: description || null,
                quantity,
                unit,
                unit_price: unitPrice,
                discount_pct: discountPct,
                discount_amount: discountAmount,
                subtotal,
            })
            .eq('id', itemId)
            .eq('quote_id', quoteId)

        if (error) {
            throw error
        }
    } else {
        const { count } = await supabase
            .from('quote_items')
            .select('*', { count: 'exact', head: true })
            .eq('quote_id', quoteId)

        const { error } = await supabase
            .from('quote_items')
            .insert({
                quote_id: quoteId,
                product_id: null,
                name,
                description: description || null,
                quantity,
                unit,
                unit_price: unitPrice,
                discount_pct: discountPct,
                discount_amount: discountAmount,
                subtotal,
                sort_order: count ?? 0,
            })

        if (error) {
            throw error
        }
    }

    await recalculateQuoteTotals(supabase, quoteId, profile.organization_id)

    if (quote.client_id) {
        const { error: activityError } = await supabase
            .from('client_activities')
            .insert({
                organization_id: profile.organization_id,
                client_id: quote.client_id,
                created_by: user.id,
                type: 'quote_item_updated',
                title: 'Partida actualizada',
                description: name,
                metadata: { quote_id: quoteId, quote_number: quote.quote_number },
            })

        if (activityError) console.error('QUOTE ITEM UPDATED ACTIVITY ERROR:', activityError)
    }

    revalidatePath(`/quotes/${quoteId}/edit`)
    revalidatePath(`/quotes/${quoteId}`)
}

export async function deleteQuoteItem(formData: FormData) {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) redirect('/onboarding')

    const quoteId = String(formData.get('quote_id'))
    const itemId = String(formData.get('id'))

    const { data: quote } = await supabase
        .from('quotes')
        .select('id, client_id, quote_number')
        .eq('id', quoteId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    if (!quote) {
        throw new Error('Quote not found')
    }

    const { data: item } = await supabase
        .from('quote_items')
        .select('name')
        .eq('id', itemId)
        .eq('quote_id', quoteId)
        .maybeSingle()

    const { error } = await supabase
        .from('quote_items')
        .delete()
        .eq('id', itemId)
        .eq('quote_id', quoteId)

    if (error) {
        throw error
    }

    await recalculateQuoteTotals(supabase, quoteId, profile.organization_id)

    if (quote.client_id) {
        const { error: activityError } = await supabase
            .from('client_activities')
            .insert({
                organization_id: profile.organization_id,
                client_id: quote.client_id,
                created_by: user.id,
                type: 'quote_item_deleted',
                title: 'Partida eliminada',
                description: item?.name ?? null,
                metadata: { quote_id: quoteId, quote_number: quote.quote_number },
            })

        if (activityError) console.error('QUOTE ITEM DELETED ACTIVITY ERROR:', activityError)
    }

    revalidatePath(`/quotes/${quoteId}/edit`)
    revalidatePath(`/quotes/${quoteId}`)
}
