import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { impersonateOrg } from './actions'

const OPEN_QUOTE_STATUSES = ['draft', 'sent', 'viewed']

export default async function AdminPage() {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const supabaseAdmin = getSupabaseAdmin()

    const { data: superAdmin } = await supabaseAdmin
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!superAdmin) redirect('/dashboard')

    const { data: organizationsData } = await supabaseAdmin
        .from('organizations')
        .select('id, name, slug, created_at')
        .order('created_at', { ascending: true })

    const organizations = organizationsData ?? []

    const orgStats = await Promise.all(
        organizations.map(async (org) => {
            const [{ count: clientCount }, { data: quotesData }] = await Promise.all([
                supabaseAdmin
                    .from('clients')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', org.id),
                supabaseAdmin
                    .from('quotes')
                    .select('status, total')
                    .eq('organization_id', org.id),
            ])

            const quotes = quotesData ?? []
            const openQuotes = quotes.filter((q) => OPEN_QUOTE_STATUSES.includes(q.status))
            const pipelineValue = openQuotes.reduce((sum, q) => sum + Number(q.total), 0)

            return {
                ...org,
                clientCount: clientCount ?? 0,
                openQuotesCount: openQuotes.length,
                pipelineValue,
            }
        })
    )

    const totals = orgStats.reduce(
        (acc, org) => ({
            clientCount: acc.clientCount + org.clientCount,
            pipelineValue: acc.pipelineValue + org.pipelineValue,
        }),
        { clientCount: 0, pipelineValue: 0 }
    )

    const statCards = [
        { label: 'Total organizaciones', value: organizations.length.toLocaleString('es-MX') },
        { label: 'Total clientes', value: totals.clientCount.toLocaleString('es-MX') },
        {
            label: 'Total pipeline',
            value: `$${totals.pipelineValue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`,
        },
    ]

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">Super Admin</p>
                    <h1 className="mt-1 text-3xl font-bold">Panel de administración</h1>
                </div>

                <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs font-semibold text-neutral-300">
                    Droplead OS
                </span>
            </div>

            <section className="mt-8 grid gap-4 md:grid-cols-3">
                {statCards.map((card) => (
                    <div key={card.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                        <p className="text-sm text-neutral-500">{card.label}</p>
                        <p className="mt-2 text-3xl font-bold">{card.value}</p>
                    </div>
                ))}
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900">
                {organizations.length === 0 ? (
                    <p className="p-6 text-neutral-400">No hay organizaciones registradas.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-neutral-800 text-neutral-500">
                                    <th className="px-5 py-3 font-medium">Organización</th>
                                    <th className="px-5 py-3 font-medium">Slug</th>
                                    <th className="px-5 py-3 font-medium">Clientes</th>
                                    <th className="px-5 py-3 font-medium">Cotizaciones abiertas</th>
                                    <th className="px-5 py-3 font-medium">Pipeline</th>
                                    <th className="px-5 py-3 font-medium">Creada</th>
                                    <th className="px-5 py-3 font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orgStats.map((org) => (
                                    <tr key={org.id} className="border-b border-neutral-900">
                                        <td className="px-5 py-3 font-medium">{org.name}</td>
                                        <td className="px-5 py-3 text-neutral-400">{org.slug}</td>
                                        <td className="px-5 py-3">{org.clientCount.toLocaleString('es-MX')}</td>
                                        <td className="px-5 py-3">{org.openQuotesCount.toLocaleString('es-MX')}</td>
                                        <td className="px-5 py-3">
                                            ${org.pipelineValue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-5 py-3 text-neutral-400">
                                            {new Date(org.created_at).toLocaleDateString('es-MX', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-5 py-3">
                                            <form action={impersonateOrg}>
                                                <input type="hidden" name="organization_id" value={org.id} />
                                                <button className="rounded border border-neutral-600 px-3 py-1 text-xs font-semibold text-neutral-200 hover:bg-neutral-800">
                                                    Acceder
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    )
}
