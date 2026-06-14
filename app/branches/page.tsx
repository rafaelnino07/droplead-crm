import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { createBranch, toggleBranchActive } from './actions'

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

    const { data: branchesData, error } = await supabase
        .from('branches')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: true })

    if (error) console.error('BRANCHES ERROR:', error)

    const branches = branchesData ?? []

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">Sucursales</p>
                    <h1 className="mt-1 text-3xl font-bold">Gestión de sucursales</h1>
                </div>

                <a
                    href="#nueva-sucursal"
                    className="rounded bg-white px-4 py-2 text-sm font-semibold text-black"
                >
                    Nueva sucursal
                </a>
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
            <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                {branches.length === 0 ? (
                    <p className="text-neutral-400">No tienes sucursales registradas.</p>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-neutral-800 text-neutral-500">
                                <th className="py-2 pr-4 font-medium">Nombre</th>
                                <th className="py-2 pr-4 font-medium">Ciudad</th>
                                <th className="py-2 pr-4 font-medium">Dirección</th>
                                <th className="py-2 pr-4 font-medium">Teléfono</th>
                                <th className="py-2 pr-4 font-medium">Estado</th>
                                <th className="py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {branches.map((branch) => (
                                <tr key={branch.id} className="border-b border-neutral-900">
                                    <td className="py-3 pr-4 font-medium">{branch.name}</td>
                                    <td className="py-3 pr-4 text-neutral-400">{branch.city ?? '—'}</td>
                                    <td className="py-3 pr-4 text-neutral-400">{branch.address ?? '—'}</td>
                                    <td className="py-3 pr-4 text-neutral-400">{branch.phone ?? '—'}</td>
                                    <td className="py-3 pr-4">
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                branch.is_active
                                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-900'
                                                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                                            }`}
                                        >
                                            {branch.is_active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <form action={toggleBranchActive}>
                                            <input type="hidden" name="branch_id" value={branch.id} />
                                            <input type="hidden" name="is_active" value={String(branch.is_active)} />
                                            <button className="rounded border border-neutral-600 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800">
                                                {branch.is_active ? 'Desactivar' : 'Activar'}
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </main>
    )
}
