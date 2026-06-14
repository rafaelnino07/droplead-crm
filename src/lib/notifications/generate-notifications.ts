import { daysSince, daysUntil } from '@/lib/ai/money-leak-detector'

const NO_ACTIVITY_SENTINEL_DAYS = 999

export type NotificationInput = {
    clients: { id: string; name: string; stage: string | null }[]
    quotes: {
        id: string
        client_id: string | null
        status: string
        total: number
        sent_at: string | null
        valid_until: string | null
    }[]
    activities: { client_id: string; created_at: string }[]
    tasks: {
        id: string
        client_id: string | null
        title: string
        status: string
        due_date: string | null
        priority: string
    }[]
    existingNotificationKeys: string[] // to avoid duplicates: `${type}:${client_id}`
}

export type NotificationToCreate = {
    client_id: string | null
    type: string
    title: string
    description: string
    priority: 'Alta' | 'Media' | 'Baja'
    metadata: Record<string, unknown>
    dedupeKey: string
}

function toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0

    const parsed = Number(value)

    return Number.isNaN(parsed) ? 0 : parsed
}

export function generateNotifications(input: NotificationInput): NotificationToCreate[] {
    const { clients, quotes, activities, tasks, existingNotificationKeys } = input

    const clientById = new Map(clients.map((client) => [client.id, client]))
    const seenKeys = new Set(existingNotificationKeys)
    const notifications: NotificationToCreate[] = []

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

    function push(notification: NotificationToCreate) {
        if (seenKeys.has(notification.dedupeKey)) return

        seenKeys.add(notification.dedupeKey)
        notifications.push(notification)
    }

    // quote_forgotten: sent > 7 days ago, no activity in 5 days → Alta
    for (const quote of quotes) {
        if (!quote.client_id) continue
        if (quote.status !== 'sent' && quote.status !== 'viewed') continue

        const sentDays = daysSince(quote.sent_at)
        if (sentDays === null || sentDays <= 7) continue

        const lastActivityDays = lastActivityDaysByClient.get(quote.client_id) ?? null
        if (lastActivityDays !== null && lastActivityDays <= 5) continue

        const client = clientById.get(quote.client_id)

        push({
            client_id: quote.client_id,
            type: 'quote_forgotten',
            title: 'Cotización olvidada',
            description: `${client?.name ?? 'Cliente'}: cotización enviada hace ${sentDays} días sin seguimiento`,
            priority: 'Alta',
            metadata: { quote_id: quote.id, days_since_sent: sentDays, total: toNumber(quote.total) },
            dedupeKey: `quote_forgotten:${quote.client_id}`,
        })
    }

    // verbal_no_followup: stage = 'verbalmente_ganado', no actividad en 3 días → Alta
    for (const client of clients) {
        if (client.stage !== 'verbalmente_ganado') continue

        const lastActivityDays = lastActivityDaysByClient.get(client.id) ?? null
        if (lastActivityDays !== null && lastActivityDays <= 3) continue

        const days = lastActivityDays ?? NO_ACTIVITY_SENTINEL_DAYS

        push({
            client_id: client.id,
            type: 'verbal_no_followup',
            title: 'Aceptación verbal sin formalizar',
            description: `${client.name}: aceptación verbal sin formalizar hace ${days} días`,
            priority: 'Alta',
            metadata: { days_since_activity: days },
            dedupeKey: `verbal_no_followup:${client.id}`,
        })
    }

    // quote_expiring: valid_until dentro de 3 días → Alta
    for (const quote of quotes) {
        if (!quote.client_id) continue
        if (quote.status !== 'sent' && quote.status !== 'viewed') continue

        const daysLeft = daysUntil(quote.valid_until)
        if (daysLeft === null || daysLeft < 0 || daysLeft > 3) continue

        const client = clientById.get(quote.client_id)

        push({
            client_id: quote.client_id,
            type: 'quote_expiring',
            title: 'Cotización por vencer',
            description: `${client?.name ?? 'Cliente'}: cotización vence en ${daysLeft} días sin respuesta`,
            priority: 'Alta',
            metadata: { quote_id: quote.id, days_left: daysLeft, total: toNumber(quote.total) },
            dedupeKey: `quote_expiring:${quote.client_id}`,
        })
    }

    // lead_cold: sin actividad en 14 días, no cerrado/perdido → Media
    for (const client of clients) {
        if (client.stage === 'proyecto_cerrado' || client.stage === 'perdido') continue

        const lastActivityDays = lastActivityDaysByClient.get(client.id) ?? null
        if (lastActivityDays !== null && lastActivityDays <= 14) continue

        const days = lastActivityDays ?? NO_ACTIVITY_SENTINEL_DAYS

        push({
            client_id: client.id,
            type: 'lead_cold',
            title: 'Lead frío',
            description: `${client.name}: sin actividad hace ${days} días`,
            priority: 'Media',
            metadata: { days_since_activity: days },
            dedupeKey: `lead_cold:${client.id}`,
        })
    }

    // task_overdue: tarea pendiente con due_date < hoy → Media
    for (const task of tasks) {
        if (!task.client_id) continue
        if (task.status !== 'pending') continue

        const overdueDays = daysSince(task.due_date)
        if (overdueDays === null || overdueDays <= 0) continue

        const client = clientById.get(task.client_id)

        push({
            client_id: task.client_id,
            type: 'task_overdue',
            title: 'Tarea vencida',
            description: `${client?.name ?? 'Cliente'}: "${task.title}" vencida hace ${overdueDays} días`,
            priority: 'Media',
            metadata: { task_id: task.id, days_overdue: overdueDays },
            dedupeKey: `task_overdue:${task.client_id}`,
        })
    }

    return notifications
}
