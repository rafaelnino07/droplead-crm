import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'

export default async function QuoteDetailPage({
    params,
}: {
    params: { id: string }
}) {
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

    const { data: quote, error } = await supabase
        .from('quotes')
        .select(`
      *,
      clients (
        id,
        name,
        company,
        email,
        phone
      )
    `)
        .eq('id', params.id)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    if (error) console.error('QUOTE DETAIL ERROR:', error)

    if (!quote) notFound()

    const client = Array.isArray(quote.clients)
        ? quote.clients[0]
        : quote.clients

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <Link
                href={`/clients/${quote.client_id}`}
                className="text-sm text-neutral-400"
            >
                ← Volver al cliente
            </Link>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-neutral-500">Cotización</p>
                        <h1 className="mt-2 text-3xl font-bold">
                            {quote.quote_number}
                        </h1>
                        <p className="mt-2 text-neutral-400">
                            {quote.project_name}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {quote.status === 'draft' && (
                            <Link
                                href={`/quotes/${quote.id}/edit`}
                                className="rounded bg-white px-4 py-2 text-sm font-semibold text-black"
                            >
                                Editar cotización
                            </Link>
                        )}

                        <span className="rounded-full bg-neutral-800 px-4 py-2 text-sm">
                            {quote.status}
                        </span>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <div>
                        <p className="text-sm text-neutral-500">Cliente</p>
                        <p className="mt-1">{client?.name ?? 'Sin cliente'}</p>
                    </div>

                    <div>
                        <p className="text-sm text-neutral-500">Empresa</p>
                        <p className="mt-1">{client?.company ?? 'Sin empresa'}</p>
                    </div>

                    <div>
                        <p className="text-sm text-neutral-500">Tipo de proyecto</p>
                        <p className="mt-1">{quote.project_type ?? 'Sin tipo'}</p>
                    </div>

                    <div>
                        <p className="text-sm text-neutral-500">Dirección</p>
                        <p className="mt-1">{quote.project_address ?? 'Sin dirección'}</p>
                    </div>

                    <div>
                        <p className="text-sm text-neutral-500">Total</p>
                        <p className="mt-1 text-2xl font-bold">
                            ${Number(quote.total ?? 0).toLocaleString('es-MX')}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-neutral-500">Creada</p>
                        <p className="mt-1">
                            {new Date(quote.created_at).toLocaleDateString('es-MX')}
                        </p>
                    </div>
                </div>
            </section>

            <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <h2 className="text-xl font-bold">Visión del cliente</h2>
                <p className="mt-4 text-neutral-300">
                    {quote.client_vision ?? 'Sin visión registrada.'}
                </p>
            </section>

            <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <h2 className="text-xl font-bold">Notas internas</h2>
                <p className="mt-4 text-neutral-300">
                    {quote.notes ?? 'Sin notas internas.'}
                </p>
            </section>
        </main>
    )
}