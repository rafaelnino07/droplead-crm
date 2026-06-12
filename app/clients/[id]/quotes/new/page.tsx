import Link from 'next/link'
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

                <input
                    name="total"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Total estimado"
                    required
                    className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <textarea
                    name="notes"
                    placeholder="Notas internas"
                    className="min-h-28 w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <button className="rounded bg-white px-4 py-3 font-semibold text-black">
                    Guardar cotización
                </button>
            </form>
        </main>
    )
}