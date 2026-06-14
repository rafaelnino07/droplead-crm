'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { generateMorningBrief, type MorningBriefInput } from '@/lib/ai/morning-brief'
import { calculateMoneyRadar } from '@/lib/scoring/money-radar'
import { calculateNextBestAction } from '@/lib/scoring/next-best-action'
import { getClientStageLabel } from '@/lib/scp/stages'
import { isTaskOverdue } from '../components/tasks/constants'

const OPEN_QUOTE_STATUSES = ['draft', 'sent', 'viewed']

const PRIORITY_ORDER: Record<'Alta' | 'Media' | 'Baja', number> = {
    Alta: 0,
    Media: 1,
    Baja: 2,
}

export async function refreshMorningBrief(formData: FormData) {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) {
        throw new Error('Organization not found')
    }

    const organizationId = profile.organization_id

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [
        { data: organization },
        { data: clientsData },
        { data: quotesData },
        { data: activitiesData },
        { data: tasksData },
    ] = await Promise.all([
        supabase.from('organizations').select('name').eq('id', organizationId).maybeSingle(),
        supabase.from('clients').select('id, name, stage').eq('organization_id', organizationId),
        supabase
            .from('quotes')
            .select('id, client_id, status, total, accepted_at, valid_until, sent_at, rejected_at, created_at')
            .eq('organization_id', organizationId),
        supabase
            .from('client_activities')
            .select('id, client_id, type, title, description, created_at')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(100),
        supabase
            .from('tasks')
            .select('id, title, priority, due_date, client_id')
            .eq('organization_id', organizationId)
            .eq('status', 'pending')
            .order('due_date', { ascending: true, nullsFirst: false })
            .limit(3),
    ])

    const clients = clientsData ?? []
    const allQuotes = quotesData ?? []
    const allActivities = activitiesData ?? []
    const pendingTasksRaw = tasksData ?? []

    const totalClients = clients.length

    const openQuotes = allQuotes.filter((q) => OPEN_QUOTE_STATUSES.includes(q.status))
    const pipelineValue = openQuotes.reduce((sum, q) => sum + Number(q.total), 0)

    const closedThisMonth = allQuotes.filter(
        (q) => q.status === 'accepted' && q.accepted_at && new Date(q.accepted_at) >= startOfMonth
    ).length

    const orgRadar = calculateMoneyRadar({ quotes: allQuotes, activities: allActivities })

    const clientById = new Map(clients.map((c) => [c.id, c]))

    // ── Top acciones (por cliente) ─────────────────────────────────
    const groupsByClient = new Map<string, { quotes: typeof allQuotes; activities: typeof allActivities }>()

    for (const quote of allQuotes) {
        if (!quote.client_id) continue
        const group = groupsByClient.get(quote.client_id) ?? { quotes: [], activities: [] }
        group.quotes.push(quote)
        groupsByClient.set(quote.client_id, group)
    }

    for (const activity of allActivities) {
        const group = groupsByClient.get(activity.client_id) ?? { quotes: [], activities: [] }
        group.activities.push(activity)
        groupsByClient.set(activity.client_id, group)
    }

    const topActions: MorningBriefInput['topActions'] = Array.from(groupsByClient.entries())
        .map(([clientId, group]) => {
            const radar = calculateMoneyRadar({ quotes: group.quotes, activities: group.activities })

            const action = calculateNextBestAction({
                momentum: { score: 50, level: 'medio' },
                scpHealth: { score: 50, level: 'medio', risks: [] },
                moneyRadar: radar,
            })

            const client = clientById.get(clientId)

            return {
                clientName: client?.name ?? 'Cliente',
                clientStage: getClientStageLabel((client?.stage as string | null) ?? null),
                actionTitle: action.title,
                actionPriority: action.priority,
                moneyStatus: radar.status,
                totalDetected: radar.totalDetected,
            }
        })
        .sort((a, b) => PRIORITY_ORDER[a.actionPriority as keyof typeof PRIORITY_ORDER] - PRIORITY_ORDER[b.actionPriority as keyof typeof PRIORITY_ORDER])
        .slice(0, 3)

    // ── Tareas pendientes ─────────────────────────────────────────────
    const pendingTasks: MorningBriefInput['pendingTasks'] = pendingTasksRaw.map((task) => ({
        title: task.title,
        priority: task.priority,
        dueDate: task.due_date,
        clientName: task.client_id ? clientById.get(task.client_id)?.name ?? null : null,
        isOverdue: isTaskOverdue(task.due_date),
    }))

    // ── Actividad reciente ────────────────────────────────────────────
    const recentActivities: MorningBriefInput['recentActivities'] = allActivities.slice(0, 5).map((activity) => ({
        title: activity.title,
        clientName: clientById.get(activity.client_id)?.name ?? 'Cliente',
        createdAt: activity.created_at,
    }))

    const firstName = profile.full_name?.split(' ')[0] ?? 'Usuario'

    const today = new Date()
    const rawDateLabel = today.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
    const dateLabel = rawDateLabel.charAt(0).toUpperCase() + rawDateLabel.slice(1)

    const briefInput: MorningBriefInput = {
        organizationName: organization?.name ?? 'Tu negocio',
        firstName,
        date: dateLabel,
        stats: {
            totalClients,
            openQuotes: openQuotes.length,
            pipelineValue,
            closedThisMonth,
        },
        topActions,
        pendingTasks,
        radarSummary: {
            hotMoney: orgRadar.hotMoney,
            atRiskMoney: orgRadar.atRiskMoney,
            recoverableMoney: orgRadar.recoverableMoney,
            wonMoney: orgRadar.wonMoney,
        },
        recentActivities,
    }

    const briefText = await generateMorningBrief(briefInput)

    const { error: insertError } = await supabase.from('morning_briefs').insert({
        organization_id: organizationId,
        brief_text: briefText,
    })

    if (insertError) {
        throw insertError
    }

    revalidatePath('/dashboard')
}
