import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSupabaseServer, getActiveOrganizationId } from '@/lib/supabase/server'
import { ImpersonationBanner } from '../components/admin/impersonation-banner'
import { getClientStageLabel, getClientStageProbability } from '@/lib/scp/stages'
import { BranchFilter } from '@/components/branches/branch-filter'

export default async function ClientsPage({
    searchParams,
}: {
    searchParams: { branch_id?: string }
}) {
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

    const { data: branchesData } = await supabase
        .from('branches')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name')

    const branches = branchesData ?? []
    const branchNameById = new Map(branches.map((branch) => [branch.id, branch.name]))

    const branchId = searchParams.branch_id

    let clientsQuery = supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)

    if (branchId) {
        clientsQuery = clientsQuery.eq('branch_id', branchId)
    }

    const { data: clients, error } = await clientsQuery.order('created_at', { ascending: false })

    if (error) {
        console.error('CLIENTS ERROR:', error)
    }

    return (
        <>
        <ImpersonationBanner />
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

            <div className="mt-6 flex items-center gap-3">
                <span className="text-sm text-neutral-500">Sucursal</span>
                <BranchFilter branches={branches} />
            </div>

            <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900">
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
                                        <div className="flex items-center justify-end gap-2">
                                            {client.branch_id && branchNameById.has(client.branch_id) && (
                                                <p className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-400">
                                                    {branchNameById.get(client.branch_id)}
                                                </p>
                                            )}

                                            <p className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
                                                {getClientStageLabel(client.stage)}
                                            </p>
                                        </div>

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
        </>
    )
}