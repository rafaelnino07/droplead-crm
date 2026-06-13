'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { recalculateQuoteTotals } from '../../../app/quotes/[id]/edit/actions'
import type { Product } from '@/lib/types/database'

export async function createProduct(formData: FormData) {
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

    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const unit = String(formData.get('unit') || 'pza').trim()
    const unitPrice = Number(formData.get('unit_price') || 0)
    const category = String(formData.get('category') ?? '').trim()

    const { error } = await supabase
        .from('products')
        .insert({
            organization_id: profile.organization_id,
            name,
            description: description || null,
            category: category || null,
            unit,
            unit_price: unitPrice,
            tax_included: false,
            is_favorite: false,
            is_active: true,
            sort_order: 0,
        })

    if (error) {
        throw error
    }

    revalidatePath('/products')
}

export async function saveItemAsProduct(formData: FormData) {
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

    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const unit = String(formData.get('unit') || 'pza').trim()
    const unitPrice = Number(formData.get('unit_price') || 0)
    const category = String(formData.get('category') ?? '').trim()

    const { data: existing } = await supabase
        .from('products')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .ilike('name', name)
        .limit(1)
        .maybeSingle()

    if (existing) {
        return { duplicate: true, existingId: existing.id, existingName: existing.name }
    }

    const { data: product, error } = await supabase
        .from('products')
        .insert({
            organization_id: profile.organization_id,
            name,
            description: description || null,
            category: category || null,
            unit,
            unit_price: unitPrice,
            tax_included: false,
            is_favorite: false,
            is_active: true,
            sort_order: 0,
        })
        .select('id')
        .single()

    if (error) {
        throw error
    }

    return { created: true, productId: product.id }
}

export async function addProductToQuote(formData: FormData) {
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

    const productId = String(formData.get('product_id'))
    const quoteId = String(formData.get('quote_id'))

    const { data: product } = await supabase
        .from('products')
        .select('id, name, description, unit, unit_price, times_used')
        .eq('id', productId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    if (!product) {
        throw new Error('Product not found')
    }

    const { data: quote } = await supabase
        .from('quotes')
        .select('id, client_id, quote_number')
        .eq('id', quoteId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    if (!quote) {
        throw new Error('Quote not found')
    }

    const { data: lastItem } = await supabase
        .from('quote_items')
        .select('sort_order')
        .eq('quote_id', quoteId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()

    const sortOrder = (lastItem?.sort_order ?? -1) + 1

    const unitPrice = Number(product.unit_price)

    const { error: itemError } = await supabase
        .from('quote_items')
        .insert({
            quote_id: quoteId,
            product_id: product.id,
            name: product.name,
            description: product.description,
            quantity: 1,
            unit: product.unit,
            unit_price: unitPrice,
            discount_pct: 0,
            discount_amount: 0,
            subtotal: unitPrice,
            sort_order: sortOrder,
        })

    if (itemError) {
        throw itemError
    }

    await recalculateQuoteTotals(supabase, quoteId, profile.organization_id)

    await supabase
        .from('products')
        .update({
            times_used: (product.times_used ?? 0) + 1,
            last_used_at: new Date().toISOString(),
        })
        .eq('id', product.id)
        .eq('organization_id', profile.organization_id)

    if (quote.client_id) {
        const { error: activityError } = await supabase
            .from('client_activities')
            .insert({
                organization_id: profile.organization_id,
                client_id: quote.client_id,
                created_by: user.id,
                type: 'product_added',
                title: 'Producto agregado',
                description: product.name,
                metadata: { quote_id: quoteId, quote_number: quote.quote_number, product_id: product.id },
            })

        if (activityError) console.error('PRODUCT ADDED ACTIVITY ERROR:', activityError)
    }

    revalidatePath(`/quotes/${quoteId}/edit`)
}

export async function getFrequentProducts(organizationId: string): Promise<Product[]> {
    const supabase = await getSupabaseServer()

    const { data } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_archived', false)
        .order('times_used', { ascending: false })
        .order('last_used_at', { ascending: false, nullsFirst: false })
        .limit(6)

    return data ?? []
}

export async function archiveProduct(formData: FormData) {
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

    const productId = String(formData.get('product_id'))

    const { error } = await supabase
        .from('products')
        .update({ is_archived: true })
        .eq('id', productId)
        .eq('organization_id', profile.organization_id)

    if (error) {
        throw error
    }

    revalidatePath('/products')
}
