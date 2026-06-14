import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabaseServer, getActiveOrganizationId } from '@/lib/supabase/server'

import { buildClientIntelligence } from '@/lib/scp/client-intelligence'
import { ScoreBar } from '../components/ui/score-bar'

export default async function ScpDashboardPage() {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) notFound()

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!profile) notFound()

    const organizationId = await getActiveOrganizationId(supabase, user.id)

    const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('organization_id', organizationId)

    const { data: activities } = await supabase
        .from('client_activities')
        .select('*')
        .eq('organization_id', organizationId)

    const { data: commercialMemories } = await supabase
        .from('commercial_memory')
        .select('*')
        .eq('organization_id', organizationId)

    const safeClients = clients ?? []
    const safeQuotes = quotes ?? []
    const safeActivities = activities ?? []
    const safeCommercialMemories = commercialMemories ?? []

    const clientScores = safeClients.map((client) => {
        const clientQuotes = safeQuotes.filter(
            (quote) => quote.client_id === client.id
        )

        const clientActivities = safeActivities.filter(
            (activity) => activity.client_id === client.id
        )

        const clientMemory = safeCommercialMemories.find(
            (memory) => memory.client_id === client.id
        )

        return buildClientIntelligence({
            client,
            quotes: clientQuotes,
            activities: clientActivities,
            commercialMemory: clientMemory ?? null,
        })
    })

    const totalHotMoney = clientScores.reduce(
        (sum, item) => sum + item.moneyRadar.hotMoney,
        0
    )

    const totalAtRiskMoney = clientScores.reduce(
        (sum, item) => sum + item.moneyRadar.atRiskMoney,
        0
    )

    const totalRecoverableMoney = clientScores.reduce(
        (sum, item) => sum + item.moneyRadar.recoverableMoney,
        0
    )

    const totalSleepingMoney = clientScores.reduce(
        (sum, item) => sum + item.moneyRadar.sleepingMoney,
        0
    )

    const averageScpHealth =
        clientScores.length > 0
            ? Math.round(
                clientScores.reduce(
                    (sum, item) => sum + item.scpHealth.score,
                    0
                ) / clientScores.length
            )
            : 0

    const criticalActions = clientScores.filter(
        (item) => item.nextBestAction.priority === 'Alta'
    )

    const topOpportunities = [...clientScores]
        .filter((item) => item.moneyRadar.totalDetected > 0)
        .sort(
            (a, b) =>
                b.moneyRadar.totalDetected - a.moneyRadar.totalDetected
        )
        .slice(0, 10)

    const actionQueue = [...clientScores]
        .sort((a, b) => {
            const priorityOrder = {
                Alta: 3,
                Media: 2,
                Baja: 1,
            }

            return (
                priorityOrder[b.nextBestAction.priority] -
                priorityOrder[a.nextBestAction.priority]
            )
        })
        .slice(0, 10)

    return (
        <main className="min-h-screen bg-black p-8 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-neutral-500">Sistema Comercial Predecible</p>
                    <h1 className="mt-2 text-5xl font-bold">
                        SCP Dashboard
                    </h1>
                </div>

                <Link
                    href="/clients"
                    className="rounded-lg bg-white px-5 py-3 font-semibold text-black"
                >
                    Ver clientes
                </Link>
            </div>

            <section className="mt-8 grid grid-cols-4 gap-4">
                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <p className="text-neutral-400">Dinero caliente</p>
                    <p className="mt-3 text-4xl font-bold">
                        ${totalHotMoney.toLocaleString('es-MX')}
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <p className="text-neutral-400">Dinero en riesgo</p>
                    <p className="mt-3 text-4xl font-bold">
                        ${totalAtRiskMoney.toLocaleString('es-MX')}
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <p className="text-neutral-400">Recuperable</p>
                    <p className="mt-3 text-4xl font-bold">
                        ${totalRecoverableMoney.toLocaleString('es-MX')}
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <p className="text-neutral-400">Dormido</p>
                    <p className="mt-3 text-4xl font-bold">
                        ${totalSleepingMoney.toLocaleString('es-MX')}
                    </p>
                </div>
            </section>

            <section className="mt-8 grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <p className="text-neutral-400">Clientes activos</p>
                    <p className="mt-3 text-4xl font-bold">
                        {safeClients.length}
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <p className="text-neutral-400">SCP Health promedio</p>
                    <div className="mt-4">
                        <ScoreBar score={averageScpHealth} />
                    </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <p className="text-neutral-400">Acciones críticas</p>
                    <p className="mt-3 text-4xl font-bold">
                        {criticalActions.length}
                    </p>
                </div>
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <h2 className="text-3xl font-bold">
                    Top oportunidades por dinero detectado
                </h2>

                {topOpportunities.length === 0 ? (
                    <p className="mt-4 text-neutral-400">
                        Todavía no hay oportunidades con dinero detectado.
                    </p>
                ) : (
                    <div className="mt-6 space-y-4">
                        {topOpportunities.map((item) => (
                            <Link
                                key={item.client.id}
                                href={`/clients/${item.client.id}`}
                                className="block rounded-xl bg-neutral-800 p-5 transition hover:bg-neutral-700"
                            >
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <div>
                                        <p className="font-semibold">
                                            {item.client.name}
                                        </p>
                                        <p className="text-sm text-neutral-400">
                                            {item.client.company || 'Sin empresa'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-neutral-500">
                                            Dinero detectado
                                        </p>
                                        <p className="font-bold">
                                            ${item.moneyRadar.totalDetected.toLocaleString('es-MX')}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-neutral-500">
                                            Estado
                                        </p>
                                        <p className="font-bold">
                                            {item.moneyRadar.status}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-neutral-500">
                                            Acción
                                        </p>
                                        <p className="font-bold">
                                            {item.nextBestAction.title}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <h2 className="text-3xl font-bold">
                    Cola de acciones SCP
                </h2>

                {actionQueue.length === 0 ? (
                    <p className="mt-4 text-neutral-400">
                        No hay acciones disponibles todavía.
                    </p>
                ) : (
                    <div className="mt-6 space-y-4">
                        {actionQueue.map((item) => (
                            <Link
                                key={item.client.id}
                                href={`/clients/${item.client.id}`}
                                className="block rounded-xl bg-neutral-800 p-5 transition hover:bg-neutral-700"
                            >
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <div>
                                        <p className="font-semibold">
                                            {item.client.name}
                                        </p>
                                        <p className="text-sm text-neutral-400">
                                            {item.client.company || 'Sin empresa'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-neutral-500">
                                            Prioridad
                                        </p>
                                        <p className="font-bold">
                                            {item.nextBestAction.priority}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-neutral-500">
                                            Acción recomendada
                                        </p>

                                        <p className="font-bold">
                                            {item.concreteAction.title}
                                        </p>

                                        <p className="mt-1 text-xs text-neutral-400">
                                            {item.concreteAction.description}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-neutral-500">
                                            Momentum
                                        </p>
                                        <div className="mt-2">
                                            <ScoreBar score={item.momentum.score} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}