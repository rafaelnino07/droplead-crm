import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import { calculateMoneyRadar } from '@/lib/scoring/money-radar'
import { getClientStageLabel } from '@/lib/scp/stages'
import { askRevenueCopilot, type RevenueCopilotContext } from '@/lib/ai/revenue-copilot'
import { isTaskOverdue } from '../../components/tasks/constants'

const OPEN_QUOTE_STATUSES = ['draft', 'sent', 'viewed']

function daysSince(date: string | null): number | null {
    if (!date) return null

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) return null

    const now = new Date()
    const diff = now.getTime() - parsed.getTime()

    return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export async function POST(request: Request) {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) {
        return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    const body = await request.json().catch(() => null)
    const question = typeof body?.question === 'string' ? body.question.trim() : ''

    if (!question) {
        return NextResponse.json({ error: 'Falta la pregunta' }, { status: 400 })
    }

    const organizationId = profile.organization_id

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [{ data: clientsData }, { data: quotesData }, { data: activitiesData }, { data: tasksData }] =
        await Promise.all([
            supabase.from('clients').select('id, name, stage').eq('organization_id', organizationId),
            supabase
                .from('quotes')
                .select('id, client_id, project_name, status, total, accepted_at, valid_until, sent_at, rejected_at, created_at')
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
                .order('due_date', { ascending: true, nullsFirst: false }),
        ])

    const clients = clientsData ?? []
    const allQuotes = quotesData ?? []
    const allActivities = activitiesData ?? []
    const pendingTasks = tasksData ?? []

    const clientById = new Map(clients.map((client) => [client.id, client]))

    const totalClients = clients.length

    const openQuotes = allQuotes.filter((quote) => OPEN_QUOTE_STATUSES.includes(quote.status))
    const pipelineValue = openQuotes.reduce((sum, quote) => sum + Number(quote.total), 0)

    const closedThisMonth = allQuotes.filter(
        (quote) => quote.status === 'accepted' && quote.accepted_at && new Date(quote.accepted_at) >= startOfMonth
    ).length

    const orgRadar = calculateMoneyRadar({ quotes: allQuotes, activities: allActivities })

    // ── Radar individual por cliente ──────────────────────────────────
    const quotesByClient = new Map<string, typeof allQuotes>()
    const activitiesByClient = new Map<string, typeof allActivities>()

    for (const quote of allQuotes) {
        if (!quote.client_id) continue
        const list = quotesByClient.get(quote.client_id) ?? []
        list.push(quote)
        quotesByClient.set(quote.client_id, list)
    }

    for (const activity of allActivities) {
        const list = activitiesByClient.get(activity.client_id) ?? []
        list.push(activity)
        activitiesByClient.set(activity.client_id, list)
    }

    const contextClients: RevenueCopilotContext['clients'] = clients.map((client) => {
        const radar = calculateMoneyRadar({
            quotes: quotesByClient.get(client.id) ?? [],
            activities: activitiesByClient.get(client.id) ?? [],
        })

        return {
            name: client.name,
            stage: getClientStageLabel((client.stage as string | null) ?? null),
            moneyStatus: radar.status,
            totalDetected: radar.totalDetected,
        }
    })

    // ── Cotizaciones ───────────────────────────────────────────────────
    const contextQuotes: RevenueCopilotContext['quotes'] = allQuotes.map((quote) => ({
        clientName: (quote.client_id ? clientById.get(quote.client_id)?.name : null) ?? 'Cliente',
        projectName: quote.project_name,
        status: quote.status,
        total: Number(quote.total),
        daysSinceSent: daysSince(quote.sent_at),
    }))

    // ── Tareas pendientes ────────────────────────────────────────────────
    const contextTasks: RevenueCopilotContext['tasks'] = pendingTasks.map((task) => ({
        title: task.title,
        priority: task.priority,
        clientName: task.client_id ? clientById.get(task.client_id)?.name ?? null : null,
        isOverdue: isTaskOverdue(task.due_date),
    }))

    const context: RevenueCopilotContext = {
        stats: {
            totalClients,
            openQuotes: openQuotes.length,
            pipelineValue,
            closedThisMonth,
        },
        clients: contextClients,
        quotes: contextQuotes,
        tasks: contextTasks,
        radarSummary: {
            hotMoney: orgRadar.hotMoney,
            atRiskMoney: orgRadar.atRiskMoney,
            recoverableMoney: orgRadar.recoverableMoney,
            wonMoney: orgRadar.wonMoney,
        },
    }

    const answer = await askRevenueCopilot(question, context)

    return NextResponse.json({ answer })
}
