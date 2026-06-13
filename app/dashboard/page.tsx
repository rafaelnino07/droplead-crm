import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'

const OPEN_QUOTE_STATUSES = ['draft', 'sent', 'viewed']

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
        supabase.from('clients').select('id').eq('organization_id', organizationId),
        supabase.from('quotes').select('status, total, accepted_at').eq('organization_id', organizationId),
        supabase
            .from('client_activities')
            .select('id, client_id, title, description, created_at')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(5),
    ])

    if (clientsError) console.error('DASHBOARD CLIENTS ERROR:', clientsError)
    if (quotesError) console.error('DASHBOARD QUOTES ERROR:', quotesError)
    if (activitiesError) console.error('DASHBOARD ACTIVITIES ERROR:', activitiesError)

    const totalClients = clientsData?.length ?? 0

    const openQuotes = (quotesData ?? []).filter((q) => OPEN_QUOTE_STATUSES.includes(q.status))
    const pipelineValue = openQuotes.reduce((sum, q) => sum + Number(q.total), 0)

    const closedThisMonth = (quotesData ?? []).filter(
        (q) => q.status === 'accepted' && q.accepted_at && new Date(q.accepted_at) >= startOfMonth
    ).length

    const activities = activitiesData ?? []
    const clientIds = [...new Set(activities.map((a) => a.client_id))]

    const { data: activityClients } =
        clientIds.length > 0
            ? await supabase.from('clients').select('id, name').in('id', clientIds)
            : { data: [] as { id: string; name: string }[] }

    const clientNameById = new Map((activityClients ?? []).map((c) => [c.id, c.name]))

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

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900">
                <div className="border-b border-neutral-800 p-5">
                    <h2 className="text-lg font-semibold">Actividad reciente</h2>
                </div>

                {activities.length === 0 ? (
                    <div className="p-6 text-neutral-400">
                        Todavía no hay actividad registrada.
                    </div>
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
