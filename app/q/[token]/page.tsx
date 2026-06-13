import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { QuoteStatus } from '@/lib/types/database'

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

export default async function PublicQuotePage({
    params,
}: {
    params: { token: string }
}) {
    const supabase = getSupabaseAdmin()

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
        .eq('share_token', params.token)
        .maybeSingle()

    if (error) console.error('PUBLIC QUOTE ERROR:', error)

    if (!quote) notFound()

    const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('id, name, description, quantity, unit, unit_price, discount_pct, subtotal, sort_order')
        .eq('quote_id', quote.id)
        .order('sort_order', { ascending: true })

    if (itemsError) console.error('PUBLIC QUOTE ITEMS ERROR:', itemsError)

    const quoteItems = itemsData ?? []

    const client = Array.isArray(quote.clients) ? quote.clients[0] : quote.clients

    await supabase
        .from('quotes')
        .update({
            view_count: quote.view_count + 1,
            last_viewed_at: new Date().toISOString(),
        })
        .eq('id', quote.id)

    let displayStatus: QuoteStatus = quote.status

    if (quote.status === 'sent') {
        await supabase
            .from('quotes')
            .update({ status: 'viewed' })
            .eq('id', quote.id)

        if (quote.client_id) {
            const { error: activityError } = await supabase
                .from('client_activities')
                .insert({
                    organization_id: quote.organization_id,
                    client_id: quote.client_id,
                    created_by: null,
                    type: 'quote_viewed',
                    title: 'Cotización vista',
                    description: 'El cliente abrió la cotización.',
                    metadata: { quote_id: quote.id, quote_number: quote.quote_number },
                })

            if (activityError) console.error('QUOTE VIEWED ACTIVITY ERROR:', activityError)
        }

        displayStatus = 'viewed'
    }

    return (
        <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
            <div className="mx-auto max-w-3xl">
                <header className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-neutral-500">Droplead</p>

                    <div className="flex flex-col items-end gap-2">
                        <p className="text-sm text-neutral-500">{quote.quote_number}</p>
                        <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${STATUS_PILL_CLASSES[displayStatus]}`}>
                            {STATUS_LABELS[displayStatus]}
                        </span>
                    </div>
                </header>

                <section className="mt-10">
                    <h1 className="text-4xl font-bold">{quote.project_name}</h1>

                    <div className="mt-4 text-neutral-300">
                        <p>{client?.name ?? 'Cliente'}</p>
                        {client?.company && <p className="text-neutral-500">{client.company}</p>}
                    </div>

                    {quote.executive_name && (
                        <p className="mt-6 text-sm text-neutral-500">
                            Preparado por: <span className="text-neutral-300">{quote.executive_name}</span>
                            {quote.executive_email && (
                                <span className="text-neutral-500"> · {quote.executive_email}</span>
                            )}
                        </p>
                    )}
                </section>

                <section className="mt-10 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-sm text-neutral-500">Tipo de proyecto</p>
                            <p className="mt-1">{quote.project_type ?? 'Sin tipo'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-neutral-500">Dirección</p>
                            <p className="mt-1">{quote.project_address ?? 'Sin dirección'}</p>
                        </div>

                        <div className="sm:col-span-1 sm:row-span-2">
                            <p className="text-sm text-neutral-500">Visión del cliente</p>
                            <p className="mt-1 text-neutral-300">{quote.client_vision ?? 'Sin visión registrada.'}</p>
                        </div>
                    </div>
                </section>

                {quoteItems.length > 0 && (
                    <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                        <h2 className="text-xl font-bold">Partidas</h2>

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
                                <tbody>
                                    {quoteItems.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className={index % 2 === 0 ? 'bg-neutral-900' : 'bg-neutral-950/50'}
                                        >
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
                    </section>
                )}

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

                <footer className="mt-10 text-center text-sm text-neutral-500">
                    {quote.valid_until && (
                        <p>Válida hasta: {new Date(quote.valid_until).toLocaleDateString('es-MX')}</p>
                    )}
                    <p className="mt-2">Esta cotización fue generada con Droplead</p>
                </footer>
            </div>
        </main>
    )
}
