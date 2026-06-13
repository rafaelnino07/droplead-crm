import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { FinancialPreview } from '../../../components/quotes/financial-preview'
import { SaveAsProductForm } from '../../../components/quotes/save-as-product-form'
import { updateQuoteMeta, upsertQuoteItem, deleteQuoteItem } from './actions'
import { getFrequentProducts, addProductToQuote } from '@/lib/products/actions'

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

    const frequentProducts = await getFrequentProducts(profile.organization_id)

    const isNewQuote = !quote.project_name

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <div className="flex items-center gap-4">
                {quote.client_id && (
                    <Link href={`/clients/${quote.client_id}`} className="text-sm text-neutral-400">
                        ← Volver al cliente
                    </Link>
                )}

                {!isNewQuote && (
                    <Link href={`/quotes/${quote.id}`} className="text-sm text-neutral-400">
                        ← Volver a cotización
                    </Link>
                )}
            </div>

            <h1 className="mt-4 text-3xl font-bold">{isNewQuote ? 'Nueva cotización' : 'Editar cotización'}</h1>
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
                    {isNewQuote ? 'Guardar cotización' : 'Guardar cambios'}
                </button>
            </form>

            {/* SECTION 2 — line items */}
            <section className="mt-6 max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <h2 className="text-xl font-bold">Partidas</h2>

                {frequentProducts.length > 0 && (
                    <div className="mt-4">
                        <h3 className="mb-3 text-xs uppercase tracking-wider text-neutral-500">
                            ✨ Frecuentemente cotizados
                        </h3>

                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {frequentProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="min-w-[200px] cursor-pointer rounded-xl border border-neutral-700 bg-neutral-800 p-4"
                                >
                                    <p className="text-sm font-semibold">{product.name}</p>

                                    {product.category && (
                                        <p className="text-xs text-neutral-500">{product.category}</p>
                                    )}

                                    <p className="text-sm text-neutral-300">
                                        ${Number(product.unit_price).toLocaleString('es-MX')}
                                    </p>

                                    <p className="text-xs text-neutral-600">Usado {product.times_used} veces</p>

                                    <form action={addProductToQuote} className="mt-2">
                                        <input type="hidden" name="product_id" value={product.id} />
                                        <input type="hidden" name="quote_id" value={quote.id} />
                                        <button className="rounded-lg bg-neutral-700 px-3 py-1 text-xs hover:bg-neutral-600">
                                            Agregar
                                        </button>
                                    </form>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

                                <div className="flex items-center gap-2">
                                    <SaveAsProductForm
                                        itemId={item.id}
                                        name={item.name}
                                        description={item.description}
                                        unit={item.unit}
                                        unitPrice={Number(item.unit_price)}
                                    />

                                    <form action={deleteQuoteItem}>
                                        <input type="hidden" name="id" value={item.id} />
                                        <input type="hidden" name="quote_id" value={quote.id} />
                                        <button className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500">
                                            Eliminar
                                        </button>
                                    </form>
                                </div>
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

            <FinancialPreview
                initialSubtotal={quote.subtotal}
                initialTaxRate={quote.tax_rate}
                initialDiscountGlobal={quote.discount_global}
            />
        </main>
    )
}
