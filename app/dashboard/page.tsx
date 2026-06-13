import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { calculateMoneyRadar } from '@/lib/scoring/money-radar'
import { calculateNextBestAction, type NextBestActionResult } from '@/lib/scoring/next-best-action'
import { getClientStageLabel, getClientStageProbability, type ClientStage } from '@/lib/scp/stages'

const OPEN_QUOTE_STATUSES = ['draft', 'sent', 'viewed']

const PIPELINE_STAGES: ClientStage[] = [
    'nuevo_lead',
    'calificado_para_visita',
    'visita_tecnica_realizada',
    'cotizacion_enviada',
    'verbalmente_ganado',
    'proyecto_cerrado',
]

const STAGE_BAR_COLORS: Record<ClientStage, string> = {
    nuevo_lead: 'bg-neutral-600',
    calificado_para_visita: 'bg-neutral-600',
    visita_tecnica_realizada: 'bg-neutral-600',
    cotizacion_enviada: 'bg-amber-500',
    verbalmente_ganado: 'bg-emerald-500',
    proyecto_cerrado: 'bg-emerald-500',
    perdido: 'bg-neutral-600',
    pausado: 'bg-neutral-600',
}

const ACTION_EMOJIS: Record<NextBestActionResult['actionType'], string> = {
    follow_up: '📞',
    qualify: '🔍',
    recover: '🔄',
    close: '✅',
    document: '📝',
    expand: '📈',
    create_quote: '💰',
}

const PRIORITY_CLASSES: Record<NextBestActionResult['priority'], string> = {
    Alta: 'bg-red-950 text-red-300 border border-red-900',
    Media: 'bg-amber-950 text-amber-300 border border-amber-900',
    Baja: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
}

const PRIORITY_ORDER: Record<NextBestActionResult['priority'], number> = {
    Alta: 0,
    Media: 1,
    Baja: 2,
}

export default async function DashboardPage() {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) {
        redirect('/onboarding')
    }

    const organizationId = profile.organization_id

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [
        { data: clientsData, error: clientsError },
        { data: quotesData, error: quotesError },
        { data: activitiesData, error: activitiesError },
    ] = await Promise.all([
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
    ])

    if (clientsError) console.error('DASHBOARD CLIENTS ERROR:', clientsError)
    if (quotesError) console.error('DASHBOARD QUOTES ERROR:', quotesError)
    if (activitiesError) console.error('DASHBOARD ACTIVITIES ERROR:', activitiesError)

    const totalClients = clientsData?.length ?? 0

    const allQuotes = quotesData ?? []
    const allActivities = activitiesData ?? []

    const openQuotes = allQuotes.filter((q) => OPEN_QUOTE_STATUSES.includes(q.status))
    const pipelineValue = openQuotes.reduce((sum, q) => sum + Number(q.total), 0)

    const closedThisMonth = allQuotes.filter(
        (q) => q.status === 'accepted' && q.accepted_at && new Date(q.accepted_at) >= startOfMonth
    ).length

    const recentActivities = allActivities.slice(0, 5)

    // ── Radar de Dinero (org-wide) ───────────────────────────────────
    const orgRadar = calculateMoneyRadar({
        quotes: allQuotes,
        activities: allActivities,
    })

    const radarCards = [
        { label: 'Dinero caliente', value: orgRadar.hotMoney, colorClass: 'text-amber-400' },
        { label: 'En riesgo', value: orgRadar.atRiskMoney, colorClass: 'text-red-400' },
        { label: 'Recuperable', value: orgRadar.recoverableMoney, colorClass: 'text-blue-400' },
        { label: 'Ganado', value: orgRadar.wonMoney, colorClass: 'text-emerald-400' },
    ]

    // ── Pipeline Snapshot ─────────────────────────────────────────────
    const clients = clientsData ?? []

    const pipelineStats = new Map<
        ClientStage,
        { clientCount: number; openQuoteValue: number; weightedForecast: number }
    >()
    for (const stage of PIPELINE_STAGES) {
        pipelineStats.set(stage, { clientCount: 0, openQuoteValue: 0, weightedForecast: 0 })
    }

    const clientStageById = new Map<string, ClientStage>()

    for (const client of clients) {
        const stage = ((client.stage as string | null) ?? 'nuevo_lead') as ClientStage
        const stats = pipelineStats.get(stage)
        if (!stats) continue

        clientStageById.set(client.id, stage)
        stats.clientCount += 1
    }

    for (const quote of allQuotes) {
        if (!quote.client_id || !OPEN_QUOTE_STATUSES.includes(quote.status)) continue

        const stage = clientStageById.get(quote.client_id)
        if (!stage) continue

        const stats = pipelineStats.get(stage)!
        const total = Number(quote.total)
        stats.openQuoteValue += total
        stats.weightedForecast += total * (getClientStageProbability(stage) / 100)
    }

    const totalActiveClients = Array.from(pipelineStats.values()).reduce((sum, s) => sum + s.clientCount, 0)
    const totalForecast = Array.from(pipelineStats.values()).reduce((sum, s) => sum + s.weightedForecast, 0)

    const pipelineRows = PIPELINE_STAGES.map((stage) => {
        const stats = pipelineStats.get(stage)!
        const widthPercent = totalActiveClients > 0 ? (stats.clientCount / totalActiveClients) * 100 : 0

        return {
            stage,
            label: getClientStageLabel(stage),
            clientCount: stats.clientCount,
            widthPercent,
        }
    })

    // ── Top 3 acciones (por cliente) ──────────────────────────────────
    const groupsByClient = new Map<
        string,
        { quotes: typeof allQuotes; activities: typeof allActivities }
    >()

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

    const clientIds = Array.from(groupsByClient.keys())

    const { data: namedClients } =
        clientIds.length > 0
            ? await supabase.from('clients').select('id, name').in('id', clientIds)
            : { data: [] as { id: string; name: string }[] }

    const clientNameById = new Map((namedClients ?? []).map((c) => [c.id, c.name]))
    const clientById = new Map(clients.map((c) => [c.id, c]))

    const topActions = Array.from(groupsByClient.entries())
        .map(([clientId, group]) => {
            const radar = calculateMoneyRadar({
                quotes: group.quotes,
                activities: group.activities,
            })

            const action = calculateNextBestAction({
                momentum: { score: 50, level: 'medio' },
                scpHealth: { score: 50, level: 'medio', risks: [] },
                moneyRadar: radar,
            })

            const client = clientById.get(clientId)

            return {
                clientId,
                clientName: client?.name ?? 'Cliente',
                clientStage: (client?.stage as string | null) ?? null,
                action,
            }
        })
        .sort((a, b) => PRIORITY_ORDER[a.action.priority] - PRIORITY_ORDER[b.action.priority])
        .slice(0, 3)

    const firstName = profile.full_name?.split(' ')[0] ?? 'Usuario'

    const today = new Date()
    const rawDateLabel = today.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
    const dateLabel = rawDateLabel.charAt(0).toUpperCase() + rawDateLabel.slice(1)

    const stats = [
        { label: 'Clientes totales', value: totalClients.toLocaleString('es-MX') },
        { label: 'Cotizaciones abiertas', value: openQuotes.length.toLocaleString('es-MX') },
        { label: 'Cerradas este mes', value: closedThisMonth.toLocaleString('es-MX') },
        { label: 'Valor en pipeline', value: `$${pipelineValue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}` },
    ]

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <div>
                <p className="text-sm text-neutral-500">{dateLabel}</p>
                <h1 className="mt-1 text-3xl font-bold">Buenos días, {firstName}</h1>
            </div>

            <section className="mt-8 grid gap-4 md:grid-cols-4">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                        <p className="text-sm text-neutral-500">{s.label}</p>
                        <p className="mt-2 text-3xl font-bold">{s.value}</p>
                    </div>
                ))}
            </section>

            <section className="mt-8">
                <h2 className="text-lg font-semibold">Radar de Dinero</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    {radarCards.map((card) => (
                        <div key={card.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                            <p className="text-sm text-neutral-500">{card.label}</p>
                            <p className={`mt-2 text-3xl font-bold ${card.value === 0 ? 'text-neutral-500' : card.colorClass}`}>
                                {card.value === 0 ? '—' : `$${card.value.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold">Pipeline</h2>
                    <p className="text-lg font-bold">
                        ${totalForecast.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </p>
                </div>

                <div className="mt-4 space-y-4">
                    {pipelineRows.map((row) => (
                        <div key={row.stage} className="space-y-2">
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-sm text-neutral-300">{row.label}</p>
                                <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
                                    {row.clientCount}
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-neutral-800">
                                <div
                                    className={`h-2 rounded-full ${STAGE_BAR_COLORS[row.stage]}`}
                                    style={{
                                        width: `${row.widthPercent}%`,
                                        minWidth: row.clientCount > 0 ? '4px' : undefined,
                                    }}
                                />
                            </div>
                            <p className="text-xs text-neutral-500">
                                {row.clientCount} {row.clientCount === 1 ? 'cliente' : 'clientes'} · {row.widthPercent.toFixed(0)}%
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 border-t border-neutral-800 pt-4">
                    <p className="text-sm text-neutral-500">
                        Forecast ponderado:{' '}
                        <span className="font-semibold text-white">
                            ${totalForecast.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                        </span>
                    </p>
                </div>
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                <h2 className="text-lg font-semibold">Top 3 acciones</h2>

                {topActions.length === 0 ? (
                    <p className="mt-4 text-sm text-neutral-400">No hay acciones pendientes.</p>
                ) : (
                    <div className="mt-4 space-y-3">
                        {topActions.map(({ clientId, clientName, clientStage, action }) => (
                            <div key={clientId} className="flex items-start gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                                <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-lg ${PRIORITY_CLASSES[action.priority]}`}>
                                    {ACTION_EMOJIS[action.actionType]}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/clients/${clientId}`} className="font-semibold text-white hover:underline">
                                                {clientName}
                                            </Link>
                                            <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                                                {getClientStageLabel(clientStage)}
                                            </span>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${PRIORITY_CLASSES[action.priority]}`}>
                                            {action.priority}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-neutral-200">{action.title}</p>
                                    <p className="mt-1 text-sm text-neutral-400">{action.description}</p>

                                    <div className="mt-2 text-right">
                                        <Link href={`/clients/${clientId}`} className="text-xs text-neutral-500 transition-colors hover:text-white">
                                            Ver cliente →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900">
                <div className="border-b border-neutral-800 p-5">
                    <h2 className="text-lg font-semibold">Actividad reciente</h2>
                </div>

                {recentActivities.length === 0 ? (
                    <div className="p-6 text-neutral-400">
                        Todavía no hay actividad registrada.
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-800">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between gap-4 p-5">
                                <div>
                                    <p className="font-semibold">{activity.title}</p>
                                    {activity.description && (
                                        <p className="mt-1 text-sm text-neutral-400">{activity.description}</p>
                                    )}
                                    <p className="mt-1 text-xs text-neutral-500">
                                        {clientNameById.get(activity.client_id) ?? 'Cliente'}
                                    </p>
                                </div>

                                <p className="whitespace-nowrap text-xs text-neutral-500">
                                    {new Date(activity.created_at).toLocaleDateString('es-MX', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}
