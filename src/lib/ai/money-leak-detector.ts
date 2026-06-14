export type MoneyLeakType =
    | 'quote_forgotten'
    | 'lead_cold'
    | 'task_overdue'
    | 'quote_expiring'
    | 'verbal_no_followup'

export type MoneyLeakSeverity = 'critical' | 'warning' | 'info'

export type MoneyLeak = {
    type: MoneyLeakType
    severity: MoneyLeakSeverity
    clientId: string
    clientName: string
    amount: number
    daysSinceAction: number
    message: string
    action: string
}

export type MoneyLeakReport = {
    totalAtRisk: number
    leaks: MoneyLeak[]
}

export type MoneyLeakInput = {
    clients: { id: string; name: string; stage: string | null }[]
    quotes: {
        id: string
        client_id: string | null
        status: string
        total: number
        sent_at: string | null
        valid_until: string | null
        created_at: string
    }[]
    activities: { client_id: string; type: string; created_at: string }[]
    tasks: { client_id: string | null; status: string; due_date: string | null }[]
}

const OPEN_QUOTE_STATUSES = ['draft', 'sent', 'viewed']
const NO_ACTIVITY_SENTINEL_DAYS = 999

const SEVERITY_ORDER: Record<MoneyLeakSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
}

function toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0

    const parsed = Number(value)

    return Number.isNaN(parsed) ? 0 : parsed
}

function daysSince(date?: string | null): number | null {
    if (!date) return null

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) return null

    const now = new Date()
    const diff = now.getTime() - parsed.getTime()

    return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function daysUntil(date?: string | null): number | null {
    if (!date) return null

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) return null

    const now = new Date()
    const diff = parsed.getTime() - now.getTime()

    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function detectMoneyLeaks(input: MoneyLeakInput): MoneyLeakReport {
    const { clients, quotes, activities, tasks } = input

    const clientById = new Map(clients.map((client) => [client.id, client]))

    const activitiesByClient = new Map<string, typeof activities>()
    for (const activity of activities) {
        const list = activitiesByClient.get(activity.client_id) ?? []
        list.push(activity)
        activitiesByClient.set(activity.client_id, list)
    }

    const lastActivityDaysByClient = new Map<string, number | null>()
    for (const [clientId, clientActivities] of activitiesByClient) {
        const daysList = clientActivities
            .map((activity) => daysSince(activity.created_at))
            .filter((days): days is number => days !== null)

        lastActivityDaysByClient.set(clientId, daysList.length > 0 ? Math.min(...daysList) : null)
    }

    const leaks: MoneyLeak[] = []

    // CRITICAL — quote_forgotten
    for (const quote of quotes) {
        if (!quote.client_id) continue
        if (quote.status !== 'sent' && quote.status !== 'viewed') continue

        const sentDays = daysSince(quote.sent_at ?? quote.created_at)
        if (sentDays === null || sentDays <= 7) continue

        const lastActivityDays = lastActivityDaysByClient.get(quote.client_id) ?? null
        if (lastActivityDays !== null && lastActivityDays <= 5) continue

        const client = clientById.get(quote.client_id)

        leaks.push({
            type: 'quote_forgotten',
            severity: 'critical',
            clientId: quote.client_id,
            clientName: client?.name ?? 'Cliente',
            amount: toNumber(quote.total),
            daysSinceAction: sentDays,
            message: `Cotización enviada hace ${sentDays} días sin seguimiento`,
            action: 'Contactar hoy por WhatsApp o llamada',
        })
    }

    // CRITICAL — verbal_no_followup
    for (const client of clients) {
        if (client.stage !== 'verbalmente_ganado') continue

        const lastActivityDays = lastActivityDaysByClient.get(client.id) ?? null
        if (lastActivityDays !== null && lastActivityDays <= 3) continue

        const openQuotesTotal = quotes
            .filter((quote) => quote.client_id === client.id && OPEN_QUOTE_STATUSES.includes(quote.status))
            .reduce((sum, quote) => sum + toNumber(quote.total), 0)

        const days = lastActivityDays ?? NO_ACTIVITY_SENTINEL_DAYS

        leaks.push({
            type: 'verbal_no_followup',
            severity: 'critical',
            clientId: client.id,
            clientName: client.name,
            amount: openQuotesTotal,
            daysSinceAction: days,
            message: `Aceptación verbal sin formalizar hace ${days} días`,
            action: 'Formalizar hoy: anticipo, contrato o fecha de inicio',
        })
    }

    // WARNING — quote_expiring
    for (const quote of quotes) {
        if (!quote.client_id) continue
        if (quote.status !== 'sent' && quote.status !== 'viewed') continue

        const daysLeft = daysUntil(quote.valid_until)
        if (daysLeft === null || daysLeft < 0 || daysLeft > 3) continue

        const client = clientById.get(quote.client_id)

        leaks.push({
            type: 'quote_expiring',
            severity: 'warning',
            clientId: quote.client_id,
            clientName: client?.name ?? 'Cliente',
            amount: toNumber(quote.total),
            daysSinceAction: daysLeft,
            message: `Cotización vence en ${daysLeft} días sin respuesta`,
            action: 'Contactar antes de que venza — renovar o cerrar',
        })
    }

    // WARNING — lead_cold
    for (const client of clients) {
        if (client.stage === 'proyecto_cerrado' || client.stage === 'perdido') continue

        const lastActivityDays = lastActivityDaysByClient.get(client.id) ?? null
        if (lastActivityDays !== null && lastActivityDays <= 14) continue

        const days = lastActivityDays ?? NO_ACTIVITY_SENTINEL_DAYS

        leaks.push({
            type: 'lead_cold',
            severity: 'warning',
            clientId: client.id,
            clientName: client.name,
            amount: 0,
            daysSinceAction: days,
            message: `Sin actividad hace ${days} días`,
            action: 'Reactivar con un mensaje personalizado',
        })
    }

    // INFO — task_overdue
    for (const task of tasks) {
        if (!task.client_id) continue
        if (task.status !== 'pending') continue

        const overdueDays = daysSince(task.due_date)
        if (overdueDays === null || overdueDays <= 0) continue

        const client = clientById.get(task.client_id)

        leaks.push({
            type: 'task_overdue',
            severity: 'info',
            clientId: task.client_id,
            clientName: client?.name ?? 'Cliente',
            amount: 0,
            daysSinceAction: overdueDays,
            message: `Tarea vencida: ${overdueDays} días de retraso`,
            action: 'Completar o reprogramar',
        })
    }

    leaks.sort((a, b) => {
        const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
        if (severityDiff !== 0) return severityDiff

        return b.amount - a.amount
    })

    const totalAtRisk = leaks
        .filter((leak) => leak.severity === 'critical' || leak.severity === 'warning')
        .reduce((sum, leak) => sum + leak.amount, 0)

    return { totalAtRisk, leaks }
}
