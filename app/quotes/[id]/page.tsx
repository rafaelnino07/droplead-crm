import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { QuoteStatus } from '@/lib/types/database'
import { markQuoteAsSent, markQuoteAsAccepted, markQuoteAsRejected, generateShareToken } from './actions'
import { CopyLinkButton } from './share-link-client'

const STATUS_LABELS: Record<QuoteStatus, string> = {
    draft: 'Borrador',
    sent: 'Enviada',
    viewed: 'Vista',
    accepted: 'Aceptada',
    rejected: 'Rechazada',
    expired: 'Vencida',
}

const STATUS_PILL_CLASSES: Record<QuoteStatus, string> = {
    draft: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
    sent: 'bg-blue-950 text-blue-300 border border-blue-900',
    viewed: 'bg-indigo-950 text-indigo-300 border border-indigo-900',
    accepted: 'bg-emerald-950 text-emerald-300 border border-emerald-900',
    rejected: 'bg-red-950 text-red-300 border border-red-900',
    expired: 'bg-neutral-800 text-neutral-400 border border-neutral-700',
}

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

    const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('id, name, description, quantity, unit, unit_price, discount_pct, subtotal, sort_order')
        .eq('quote_id', quote.id)
        .order('sort_order', { ascending: true })

    if (itemsError) console.error('QUOTE ITEMS ERROR:', itemsError)

    const quoteItems = itemsData ?? []

    const client = Array.isArray(quote.clients)
        ? quote.clients[0]
        : quote.clients

    const markAsSent = markQuoteAsSent.bind(null, quote.id)
    const markAsAccepted = markQuoteAsAccepted.bind(null, quote.id)
    const markAsRejected = markQuoteAsRejected.bind(null, quote.id)

    const shareUrl = quote.share_token ? `https://droplead.app/q/${quote.share_token}` : null

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

                    {quote.status === 'draft' && (
                        <Link
                            href={`/quotes/${quote.id}/edit`}
                            className="rounded bg-white px-4 py-2 text-sm font-semibold text-black"
                        >
                            Editar cotización
                        </Link>
                    )}
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

            <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-500">Estado</span>
                    <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${STATUS_PILL_CLASSES[quote.status]}`}>
                        {STATUS_LABELS[quote.status]}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {quote.status === 'draft' && (
                        <form action={markAsSent}>
                            <button className="rounded bg-white px-4 py-2 text-sm font-semibold text-black">
                                Marcar como enviada
                            </button>
                        </form>
                    )}

                    {(quote.status === 'sent' || quote.status === 'viewed') && (
                        <>
                            <form action={markAsAccepted}>
                                <button className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                                    Marcar como aceptada
                                </button>
                            </form>
                            <form action={markAsRejected}>
                                <button className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
                                    Marcar como rechazada
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </section>

            <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <h2 className="text-xl font-bold">Partidas</h2>

                {quoteItems.length === 0 ? (
                    <p className="mt-4 text-neutral-400">
                        Esta cotización no tiene partidas registradas. Agrégalas en editar.
                    </p>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wider text-neutral-500">
                                    <th className="py-2 pr-3 font-medium">Descripción</th>
                                    <th className="py-2 pr-3 text-right font-medium">Cant.</th>
                                    <th className="py-2 pr-3 font-medium">Unidad</th>
                                    <th className="py-2 pr-3 text-right font-medium">Precio unit.</th>
                                    <th className="py-2 pr-3 text-right font-medium">Desc%</th>
                                    <th className="py-2 text-right font-medium">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {quoteItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 pr-3">
                                            <p className="font-medium">{item.name}</p>
                                            {item.description && (
                                                <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>
                                            )}
                                        </td>
                                        <td className="py-3 pr-3 text-right tabular-nums">{item.quantity}</td>
                                        <td className="py-3 pr-3">{item.unit}</td>
                                        <td className="py-3 pr-3 text-right tabular-nums">
                                            ${Number(item.unit_price).toLocaleString('es-MX')}
                                        </td>
                                        <td className="py-3 pr-3 text-right tabular-nums">
                                            {item.discount_pct > 0 ? `${item.discount_pct}%` : '—'}
                                        </td>
                                        <td className="py-3 text-right font-medium tabular-nums">
                                            ${Number(item.subtotal).toLocaleString('es-MX')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="mt-6 flex justify-end">
                <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <h2 className="text-sm font-medium text-neutral-500">Resumen financiero</h2>

                    <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-neutral-400">Subtotal</span>
                            <span className="tabular-nums">${Number(quote.subtotal).toLocaleString('es-MX')}</span>
                        </div>

                        {quote.discount_amount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-neutral-400">Descuento</span>
                                <span className="tabular-nums text-red-400">
                                    -${Number(quote.discount_amount).toLocaleString('es-MX')}
                                </span>
                            </div>
                        )}

                        {quote.tax_rate > 0 && (
                            <div className="flex justify-between">
                                <span className="text-neutral-400">IVA ({quote.tax_rate}%)</span>
                                <span className="tabular-nums">${Number(quote.tax_amount).toLocaleString('es-MX')}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-4">
                        <span className="text-base font-semibold">Total</span>
                        <span className="text-2xl font-bold">${Number(quote.total).toLocaleString('es-MX')}</span>
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

            <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <h2 className="text-xl font-bold">Link público</h2>

                {shareUrl ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <code className="flex-1 truncate rounded bg-neutral-800 px-4 py-3 text-sm">
                            {shareUrl}
                        </code>
                        <CopyLinkButton text={shareUrl} />
                    </div>
                ) : (
                    <form
                        action={async () => {
                            'use server'
                            await generateShareToken(quote.id)
                        }}
                        className="mt-4"
                    >
                        <button className="rounded bg-white px-4 py-2 text-sm font-semibold text-black">
                            Generar link público
                        </button>
                    </form>
                )}
            </section>
        </main>
    )
}
