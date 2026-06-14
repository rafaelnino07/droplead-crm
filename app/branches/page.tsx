import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSupabaseServer, getActiveOrganizationId } from '@/lib/supabase/server'
import { createBranch, toggleBranchActive } from './actions'

const OPEN_QUOTE_STATUSES = ['draft', 'sent', 'viewed']

export default async function BranchesPage() {
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

    const [{ data: branchesData, error }, { data: clientsData }, { data: quotesData }] = await Promise.all([
        supabase
            .from('branches')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: true }),
        supabase
            .from('clients')
            .select('branch_id')
            .eq('organization_id', organizationId)
            .not('branch_id', 'is', null),
        supabase
            .from('quotes')
            .select('branch_id, status, total')
            .eq('organization_id', organizationId)
            .not('branch_id', 'is', null),
    ])

    if (error) console.error('BRANCHES ERROR:', error)

    const branches = branchesData ?? []

    const clientCountByBranch = new Map<string, number>()
    for (const client of clientsData ?? []) {
        if (!client.branch_id) continue
        clientCountByBranch.set(client.branch_id, (clientCountByBranch.get(client.branch_id) ?? 0) + 1)
    }

    const pipelineByBranch = new Map<string, number>()
    for (const quote of quotesData ?? []) {
        if (!quote.branch_id || !OPEN_QUOTE_STATUSES.includes(quote.status)) continue
        pipelineByBranch.set(quote.branch_id, (pipelineByBranch.get(quote.branch_id) ?? 0) + Number(quote.total))
    }

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">Sucursales</p>
                    <h1 className="mt-1 text-3xl font-bold">Gestión de sucursales</h1>
                </div>

                <div className="flex gap-3">
                    <Link
                        href="/branches/report"
                        className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                    >
                        Reporte consolidado
                    </Link>

                    <a
                        href="#nueva-sucursal"
                        className="rounded bg-white px-4 py-2 text-sm font-semibold text-black"
                    >
                        Nueva sucursal
                    </a>
                </div>
            </div>

            {/* NEW BRANCH FORM */}
            <section id="nueva-sucursal" className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <h2 className="text-lg font-semibold">Nueva sucursal</h2>

                <form action={createBranch} className="mt-4 grid gap-4 sm:grid-cols-2">
                    <input
                        name="name"
                        placeholder="Nombre de la sucursal"
                        required
                        className="w-full rounded bg-neutral-800 px-4 py-3 outline-none sm:col-span-2"
                    />

                    <input
                        name="city"
                        placeholder="Ciudad"
                        className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                    />

                    <input
                        name="phone"
                        placeholder="Teléfono"
                        className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                    />

                    <input
                        name="address"
                        placeholder="Dirección"
                        className="w-full rounded bg-neutral-800 px-4 py-3 outline-none sm:col-span-2"
                    />

                    <button className="rounded bg-white px-4 py-3 font-semibold text-black sm:col-span-2 sm:w-fit">
                        Guardar sucursal
                    </button>
                </form>
            </section>

            {/* BRANCH LIST */}
            <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900">
                {branches.length === 0 ? (
                    <p className="p-6 text-neutral-400">No tienes sucursales registradas.</p>
                ) : (
                    <div className="divide-y divide-neutral-800">
                        {branches.map((branch) => {
                            const clientCount = clientCountByBranch.get(branch.id) ?? 0
                            const pipelineValue = pipelineByBranch.get(branch.id) ?? 0

                            return (
                                <div key={branch.id} className="flex items-center justify-between gap-4 p-5">
                                    <Link href={`/branches/${branch.id}`} className="flex-1 hover:opacity-80">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <p className="font-semibold">{branch.name}</p>
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                            branch.is_active
                                                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-900'
                                                                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                                                        }`}
                                                    >
                                                        {branch.is_active ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-sm text-neutral-400">
                                                    {branch.city ?? '—'} · {branch.address ?? '—'} · {branch.phone ?? '—'}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-sm text-neutral-300">
                                                    {clientCount.toLocaleString('es-MX')}{' '}
                                                    {clientCount === 1 ? 'cliente' : 'clientes'}
                                                </p>
                                                <p className="mt-1 text-sm text-neutral-300">
                                                    Pipeline: ${pipelineValue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                                </p>
                                                <p className="mt-2 text-xs text-neutral-500">Ver dashboard →</p>
                                            </div>
                                        </div>
                                    </Link>

                                    <form action={toggleBranchActive}>
                                        <input type="hidden" name="branch_id" value={branch.id} />
                                        <input type="hidden" name="is_active" value={String(branch.is_active)} />
                                        <button className="rounded border border-neutral-600 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800">
                                            {branch.is_active ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </form>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </main>
    )
}
