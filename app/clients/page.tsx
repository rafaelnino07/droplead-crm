import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getClientStageLabel, getClientStageProbability } from '@/lib/scp/stages'

export default async function ClientsPage() {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) {
        redirect('/onboarding')
    }

    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('CLIENTS ERROR:', error)
    }

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-neutral-500">
                        CRM
                    </p>

                    <h1 className="text-3xl font-bold">
                        Clientes
                    </h1>
                </div>

                <div className="flex gap-3">
                    <Link
                        href="/scp"
                        className="rounded border border-neutral-700 px-4 py-2 font-semibold text-white hover:bg-neutral-800"
                    >
                        SCP Dashboard
                    </Link>

                    <Link
                        href="/clients/new"
                        className="rounded bg-white px-4 py-2 font-semibold text-black"
                    >
                        Nuevo cliente
                    </Link>
                </div>
            </div>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900">
                {!clients || clients.length === 0 ? (
                    <div className="p-6 text-neutral-400">
                        Todavía no tienes clientes registrados.
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-800">
                        {clients.map((client) => (
                            <Link
                                key={client.id}
                                href={`/clients/${client.id}`}
                                className="block p-5 transition hover:bg-neutral-800"
                            >
                                <div className="flex items-center justify-between gap-6">
                                    <div>
                                        <p className="font-semibold">
                                            {client.name}
                                        </p>

                                        <p className="mt-1 text-sm text-neutral-400">
                                            {client.email ?? 'Sin email'} ·{' '}
                                            {client.phone ?? 'Sin teléfono'}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
                                            {getClientStageLabel(client.stage)}
                                        </p>

                                        <p className="mt-2 text-xs text-neutral-500">
                                            Forecast base: {getClientStageProbability(client.stage)}%
                                        </p>
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