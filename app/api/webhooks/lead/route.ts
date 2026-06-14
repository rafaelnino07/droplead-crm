import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createAutoTask } from '@/lib/tasks/create-auto-task'

const leadPayloadSchema = z.object({
    meta_ad_id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    utm_source: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_content: z.string().optional(),
    utm_term: z.string().optional(),
    utm_medium: z.string().optional(),
})

export async function POST(request: Request) {
    const secret = process.env.META_WEBHOOK_SECRET

    if (!secret) {
        return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 })
    }

    if (request.headers.get('x-webhook-secret') !== secret) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = leadPayloadSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Payload inválido', details: parsed.error.flatten() },
            { status: 400 }
        )
    }

    const { meta_ad_id, name, email, phone, company, utm_source, utm_campaign, utm_content, utm_term, utm_medium } = parsed.data

    const supabase = getSupabaseAdmin()

    const { data: ad, error: adError } = await supabase
        .from('meta_ads')
        .select('id, organization_id')
        .eq('meta_ad_id', meta_ad_id)
        .maybeSingle()

    if (adError) {
        return NextResponse.json({ error: adError.message }, { status: 500 })
    }

    if (!ad) {
        return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 })
    }

    const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
            organization_id: ad.organization_id,
            name,
            client_type: 'empresa',
            email: email ?? null,
            phone: phone ?? null,
            company: company ?? null,
            address: null,
            city: null,
            notes: null,
            tags: [],
            source: 'meta_ads',
            source_ad_id: ad.id,
            is_active: true,
            utm_source: utm_source ?? null,
            utm_campaign: utm_campaign ?? null,
            utm_content: utm_content ?? null,
            utm_term: utm_term ?? null,
            utm_medium: utm_medium ?? null,
            attributed_revenue: 0,
            attributed_at: null,
        })
        .select('id, name')
        .single()

    if (clientError || !client) {
        return NextResponse.json(
            { error: clientError?.message ?? 'Error al crear cliente' },
            { status: 500 }
        )
    }

    await createAutoTask({
        supabase,
        organizationId: ad.organization_id,
        clientId: client.id,
        createdBy: null,
        trigger: 'client_created',
    })

    return NextResponse.json({ success: true, client_id: client.id })
}
