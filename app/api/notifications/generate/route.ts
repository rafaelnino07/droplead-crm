import { NextResponse } from 'next/server'
import { getSupabaseServer, getActiveOrganizationId } from '@/lib/supabase/server'
import { generateNotifications } from '@/lib/notifications/generate-notifications'

export async function POST() {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const organizationId = await getActiveOrganizationId(supabase, user.id)

    if (!organizationId) {
        return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    const [
        { data: clientsData, error: clientsError },
        { data: quotesData, error: quotesError },
        { data: activitiesData, error: activitiesError },
        { data: tasksData, error: tasksError },
        { data: existingData, error: existingError },
    ] = await Promise.all([
        supabase.from('clients').select('id, name, stage').eq('organization_id', organizationId),
        supabase
            .from('quotes')
            .select('id, client_id, status, total, sent_at, valid_until')
            .eq('organization_id', organizationId),
        supabase
            .from('client_activities')
            .select('client_id, created_at')
            .eq('organization_id', organizationId),
        supabase
            .from('tasks')
            .select('id, client_id, title, status, due_date, priority')
            .eq('organization_id', organizationId)
            .eq('status', 'pending'),
        supabase
            .from('notifications')
            .select('type, client_id')
            .eq('organization_id', organizationId)
            .eq('is_read', false),
    ])

    if (clientsError || quotesError || activitiesError || tasksError || existingError) {
        return NextResponse.json({ error: 'Error al obtener datos de la organización' }, { status: 500 })
    }

    const existingNotificationKeys = (existingData ?? []).map((n) => `${n.type}:${n.client_id}`)

    const toCreate = generateNotifications({
        clients: (clientsData ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            stage: (c.stage as string | null) ?? null,
        })),
        quotes: (quotesData ?? []).map((q) => ({
            id: q.id,
            client_id: q.client_id,
            status: q.status,
            total: Number(q.total),
            sent_at: q.sent_at,
            valid_until: q.valid_until,
        })),
        activities: activitiesData ?? [],
        tasks: tasksData ?? [],
        existingNotificationKeys,
    })

    if (toCreate.length === 0) {
        return NextResponse.json({ created: 0 })
    }

    const { error: insertError } = await supabase.from('notifications').insert(
        toCreate.map((n) => ({
            organization_id: organizationId,
            client_id: n.client_id,
            type: n.type,
            title: n.title,
            description: n.description,
            priority: n.priority,
            metadata: n.metadata,
        }))
    )

    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ created: toCreate.length })
}
