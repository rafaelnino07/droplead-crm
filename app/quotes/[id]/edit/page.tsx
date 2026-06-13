import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { updateQuoteMeta, upsertQuoteItem, deleteQuoteItem } from './actions'

export default async function EditQuotePage({
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
        .select('*')
        .eq('id', params.id)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    if (error) console.error('QUOTE EDIT ERROR:', error)

    if (!quote) notFound()

    if (quote.status !== 'draft') {
        redirect(`/quotes/${quote.id}`)
    }

    const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('id, name, description, quantity, unit, unit_price, discount_pct, subtotal, sort_order')
        .eq('quote_id', quote.id)
        .order('sort_order', { ascending: true })

    if (itemsError) console.error('QUOTE ITEMS ERROR:', itemsError)

    const quoteItems = itemsData ?? []

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <Link href={`/quotes/${quote.id}`} className="text-sm text-neutral-400">
                ← Volver a cotización
            </Link>

            <h1 className="mt-4 text-3xl font-bold">Editar cotización</h1>
            <p className="mt-1 text-neutral-400">{quote.quote_number}</p>

            {/* SECTION 1 — metadata */}
            <form
                action={updateQuoteMeta}
                className="mt-8 max-w-2xl space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6"
            >
                <input type="hidden" name="quote_id" value={quote.id} />

                <input
                    name="project_name"
                    defaultValue={quote.project_name ?? ''}
                    placeholder="Nombre del proyecto"
                    required
                    className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <input
                    name="project_type"
                    defaultValue={quote.project_type ?? ''}
                    placeholder="Tipo de proyecto"
                    className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <input
                    name="project_address"
                    defaultValue={quote.project_address ?? ''}
                    placeholder="Dirección del proyecto"
                    className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <textarea
                    name="client_vision"
                    defaultValue={quote.client_vision ?? ''}
                    placeholder="Visión / necesidad del cliente"
                    className="min-h-28 w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <textarea
                    name="notes"
                    defaultValue={quote.notes ?? ''}
                    placeholder="Notas internas"
                    className="min-h-28 w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-xs text-neutral-500">Válida hasta</label>
                        <input
                            type="date"
                            name="valid_until"
                            defaultValue={quote.valid_until ? quote.valid_until.slice(0, 10) : ''}
                            className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-neutral-500">IVA (%)</label>
                        <input
                            type="number"
                            name="tax_rate"
                            min="0"
                            max="100"
                            step="0.01"
                            defaultValue={quote.tax_rate ?? 16}
                            className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-neutral-500">Descuento global (%)</label>
                        <input
                            type="number"
                            name="discount_global"
                            min="0"
                            max="100"
                            step="0.01"
                            defaultValue={quote.discount_global ?? 0}
                            className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                        />
                    </div>
                </div>

                <button className="rounded bg-white px-4 py-3 font-semibold text-black">
                    Guardar cambios
                </button>
            </form>

            {/* SECTION 2 — line items */}
            <section className="mt-6 max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <h2 className="text-xl font-bold">Partidas</h2>

                {quoteItems.length === 0 ? (
                    <p className="mt-4 text-neutral-400">
                        Esta cotización no tiene partidas registradas.
                    </p>
                ) : (
                    <div className="mt-4 space-y-2">
                        {quoteItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between gap-4 rounded-lg bg-neutral-800 px-4 py-3"
                            >
                                <div className="flex-1">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-xs text-neutral-500">
                                        {item.quantity} {item.unit} × ${Number(item.unit_price).toLocaleString('es-MX')}
                                    </p>
                                </div>

                                <p className="font-medium tabular-nums">
                                    ${Number(item.subtotal).toLocaleString('es-MX')}
                                </p>

                                <form action={deleteQuoteItem}>
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="quote_id" value={quote.id} />
                                    <button className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500">
                                        Eliminar
                                    </button>
                                </form>
                            </div>
                        ))}
                    </div>
                )}

                <form
                    action={upsertQuoteItem}
                    className="mt-6 space-y-3 border-t border-neutral-800 pt-6"
                >
                    <input type="hidden" name="quote_id" value={quote.id} />

                    <input
                        name="name"
                        placeholder="Nombre de la partida"
                        required
                        className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                    />

                    <input
                        name="description"
                        placeholder="Descripción (opcional)"
                        className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                    />

                    <div className="grid gap-3 sm:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-xs text-neutral-500">Cantidad</label>
                            <input
                                type="number"
                                name="quantity"
                                min="0"
                                step="0.01"
                                defaultValue={1}
                                className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs text-neutral-500">Unidad</label>
                            <input
                                name="unit"
                                defaultValue="pza"
                                className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs text-neutral-500">Precio unitario</label>
                            <input
                                type="number"
                                name="unit_price"
                                min="0"
                                step="0.01"
                                required
                                className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs text-neutral-500">Desc. (%)</label>
                            <input
                                type="number"
                                name="discount_pct"
                                min="0"
                                max="100"
                                step="0.01"
                                defaultValue={0}
                                className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                            />
                        </div>
                    </div>

                    <button className="rounded bg-white px-4 py-3 font-semibold text-black">
                        Agregar
                    </button>
                </form>
            </section>

            {/* SECTION 3 — financial summary */}
            <section className="mt-6 flex justify-end">
                <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <h2 className="text-sm font-medium text-neutral-500">Resumen financiero</h2>

                    <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-neutral-400">Subtotal</span>
                            <span className="tabular-nums">${Number(quote.subtotal).toLocaleString('es-MX')}</span>
                        </div>

                        {(quote.discount_global > 0 || quote.discount_amount > 0) && (
                            <div className="flex justify-between">
                                <span className="text-neutral-400">Descuento ({quote.discount_global}%)</span>
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
        </main>
    )
}
