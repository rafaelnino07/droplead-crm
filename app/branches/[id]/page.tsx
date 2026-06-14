import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSupabaseServer, getActiveOrganizationId } from '@/lib/supabase/server'
import { calculateMoneyRadar } from '@/lib/scoring/money-radar'
import { TaskCard } from '../../components/tasks/task-card'

const OPEN_QUOTE_STATUSES = ['draft', 'sent', 'viewed']

export default async function BranchDashboardPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

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

    const organizationId = await getActiveOrganizationId(supabase, user.id)

    const { data: branch } = await supabase
        .from('branches')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .maybeSingle()

    if (!branch) notFound()

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [{ data: clientsData }, { data: quotesData }, { data: tasksData }] = await Promise.all([
        supabase
            .from('clients')
            .select('id, name')
            .eq('organization_id', organizationId)
            .eq('branch_id', branch.id),
        supabase
            .from('quotes')
            .select('id, status, total, accepted_at')
            .eq('organization_id', organizationId)
            .eq('branch_id', branch.id),
        supabase
            .from('tasks')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('branch_id', branch.id)
            .eq('status', 'pending')
            .order('due_date', { ascending: true, nullsFirst: false })
            .limit(3),
    ])

    const clients = clientsData ?? []
    const quotes = quotesData ?? []
    const tasks = tasksData ?? []

    const clientIds = clients.map((client) => client.id)
    const clientNameById = new Map(clients.map((client) => [client.id, client.name]))

    const { data: activitiesData } =
        clientIds.length > 0
            ? await supabase
                  .from('client_activities')
                  .select('id, client_id, type, title, description, created_at')
                  .eq('organization_id', organizationId)
                  .in('client_id', clientIds)
                  .order('created_at', { ascending: false })
                  .limit(5)
            : { data: [] }

    const activities = activitiesData ?? []

    const moneyRadar = calculateMoneyRadar({ quotes, activities: [] })

    const totalClients = clients.length
    const openQuotes = quotes.filter((q) => OPEN_QUOTE_STATUSES.includes(q.status))
    const pipelineValue = openQuotes.reduce((sum, q) => sum + Number(q.total), 0)

    const closedThisMonth = quotes.filter(
        (q) => q.status === 'accepted' && q.accepted_at && new Date(q.accepted_at) >= startOfMonth
    ).length

    const stats = [
        { label: 'Clientes', value: totalClients.toLocaleString('es-MX') },
        { label: 'Cotizaciones abiertas', value: openQuotes.length.toLocaleString('es-MX') },
        { label: 'Cerradas este mes', value: closedThisMonth.toLocaleString('es-MX') },
        { label: 'Pipeline', value: `$${pipelineValue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}` },
    ]

    const radarCards = [
        { label: 'Dinero caliente', value: moneyRadar.hotMoney, colorClass: 'text-amber-400' },
        { label: 'En riesgo', value: moneyRadar.atRiskMoney, colorClass: 'text-red-400' },
        { label: 'Recuperable', value: moneyRadar.recoverableMoney, colorClass: 'text-blue-400' },
        { label: 'Ganado', value: moneyRadar.wonMoney, colorClass: 'text-emerald-400' },
    ]

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <Link href="/branches" className="text-sm text-neutral-400 hover:text-white">
                ← Volver a sucursales
            </Link>

            <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-neutral-500">Sucursal</p>
                <h1 className="mt-1 text-3xl font-bold">{branch.name}</h1>
                {branch.city && <p className="mt-1 text-neutral-400">{branch.city}</p>}
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
                <h2 className="text-lg font-semibold">Tareas pendientes</h2>

                {tasks.length === 0 ? (
                    <p className="mt-4 text-sm text-neutral-400">Sin tareas pendientes.</p>
                ) : (
                    <div className="mt-4 space-y-3">
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                clientName={task.client_id ? clientNameById.get(task.client_id) : null}
                            />
                        ))}
                    </div>
                )}
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900">
                <div className="border-b border-neutral-800 p-5">
                    <h2 className="text-lg font-semibold">Actividad reciente</h2>
                </div>

                {activities.length === 0 ? (
                    <div className="p-6 text-neutral-400">Todavía no hay actividad registrada.</div>
                ) : (
                    <div className="divide-y divide-neutral-800">
                        {activities.map((activity) => (
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
