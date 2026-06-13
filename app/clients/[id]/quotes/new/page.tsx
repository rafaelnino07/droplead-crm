import Link from 'next/link'
import { FinancialPreview } from '../../../../components/quotes/financial-preview'
import { createQuote } from '../actions'

export default function NewQuotePage({
    params,
    searchParams,
}: {
    params: { id: string }
    searchParams: { error?: string }
}) {
    const createQuoteWithClient = createQuote.bind(null, params.id)

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <Link href={`/clients/${params.id}`} className="text-sm text-neutral-400">
                ← Volver al cliente
            </Link>

            <h1 className="mt-4 text-3xl font-bold">Nueva cotización</h1>

            <form
                action={createQuoteWithClient}
                className="mt-8 max-w-2xl space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6"
            >
                {searchParams.error && (
                    <p className="rounded bg-red-500/10 p-3 text-sm text-red-400">
                        {searchParams.error}
                    </p>
                )}

                <input
                    name="project_name"
                    placeholder="Nombre del proyecto"
                    required
                    className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <input
                    name="project_type"
                    placeholder="Tipo de proyecto"
                    className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <input
                    name="project_address"
                    placeholder="Dirección del proyecto"
                    className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <textarea
                    name="client_vision"
                    placeholder="Visión / necesidad del cliente"
                    className="min-h-28 w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <textarea
                    name="notes"
                    placeholder="Notas internas"
                    className="min-h-28 w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-xs text-neutral-500">Válida hasta</label>
                        <input
                            type="date"
                            name="valid_until"
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
                            defaultValue={0}
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
                            defaultValue={0}
                            className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-dashed border-neutral-700 px-4">
                    <p className="py-6 text-center text-sm text-neutral-500">
                        📦 Las partidas se agregan en el siguiente paso
                    </p>
                    <p className="-mt-4 pb-6 text-center text-xs text-neutral-600">
                        Después de crear la cotización podrás agregar conceptos, precios y descuentos por partida
                    </p>
                </div>

                <button className="rounded bg-white px-4 py-3 font-semibold text-black">
                    Crear cotización y agregar partidas →
                </button>
            </form>

            <FinancialPreview
                initialSubtotal={0}
                initialTaxRate={0}
                initialDiscountGlobal={0}
            />
        </main>
    )
}
