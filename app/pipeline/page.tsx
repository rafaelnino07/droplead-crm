import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSupabaseServer, getActiveOrganizationId } from '@/lib/supabase/server'
import { ImpersonationBanner } from '../components/admin/impersonation-banner'
import { buildPipeline } from '@/lib/scp/pipeline'

export default async function PipelinePage() {
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

    const organizationId = await getActiveOrganizationId(supabase, user.id)

    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('PIPELINE CLIENTS ERROR:', error)
    }

    const pipeline = buildPipeline(clients ?? [])

    return (
        <>
        <ImpersonationBanner />
        <main className="min-h-screen bg-black p-8 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-neutral-500">
                        Sistema Comercial Predecible
                    </p>

                    <h1 className="mt-2 text-5xl font-bold">
                        Pipeline SCP
                    </h1>
                </div>

                <div className="flex gap-3">
                    <Link
                        href="/scp"
                        className="rounded-lg border border-neutral-700 px-5 py-3 font-semibold text-white hover:bg-neutral-900"
                    >
                        SCP Dashboard
                    </Link>

                    <Link
                        href="/clients"
                        className="rounded-lg bg-white px-5 py-3 font-semibold text-black"
                    >
                        Clientes
                    </Link>
                </div>
            </div>

            <section className="mt-8 overflow-x-auto">
                <div className="flex min-w-max gap-4">
                    {pipeline.map((column) => (
                        <div
                            key={column.key}
                            className="w-80 rounded-xl border border-neutral-800 bg-neutral-900"
                        >
                            <div className="border-b border-neutral-800 p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="font-bold">
                                        {column.label}
                                    </h2>

                                    <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-400">
                                        {column.clients.length}
                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-neutral-500">
                                    Forecast base {column.probability}%
                                </p>
                            </div>

                            <div className="space-y-3 p-4">
                                {column.clients.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-neutral-800 p-5 text-sm text-neutral-600">
                                        Sin oportunidades
                                    </div>
                                ) : (
                                    column.clients.map((client) => (
                                        <Link
                                            key={client.id}
                                            href={`/clients/${client.id}`}
                                            className="block rounded-xl bg-neutral-800 p-4 transition hover:bg-neutral-700"
                                        >
                                            <p className="font-semibold">
                                                {client.name}
                                            </p>

                                            {client.client_type !== 'persona' && client.company && (
                                                <p className="mt-1 text-sm text-neutral-400">
                                                    {client.company}
                                                </p>
                                            )}

                                            <p className="mt-3 text-xs text-neutral-500">
                                                {client.email ?? 'Sin email'} ·{' '}
                                                {client.phone ?? 'Sin teléfono'}
                                            </p>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
        </>
    )
}