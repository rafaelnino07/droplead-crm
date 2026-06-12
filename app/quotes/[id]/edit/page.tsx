import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { updateQuote } from '../actions'

export default async function EditQuotePage({
    params,
    searchParams,
}: {
    params: { id: string }
    searchParams: { error?: string }
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

    const { data: quote } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', params.id)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    if (!quote) notFound()

    if (quote.status !== 'draft') {
        redirect(`/quotes/${quote.id}`)
    }

    const updateQuoteWithId = updateQuote.bind(null, quote.id)

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <Link href={`/quotes/${quote.id}`} className="text-sm text-neutral-400">
                ← Volver a cotización
            </Link>

            <h1 className="mt-4 text-3xl font-bold">Editar cotización</h1>

            <form
                action={updateQuoteWithId}
                className="mt-8 max-w-2xl space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6"
            >
                {searchParams.error && (
                    <p className="rounded bg-red-500/10 p-3 text-sm text-red-400">
                        {searchParams.error}
                    </p>
                )}

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

                <input
                    name="total"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={quote.total ?? 0}
                    placeholder="Total estimado"
                    required
                    className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <textarea
                    name="notes"
                    defaultValue={quote.notes ?? ''}
                    placeholder="Notas internas"
                    className="min-h-28 w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <button className="rounded bg-white px-4 py-3 font-semibold text-black">
                    Guardar cambios
                </button>
            </form>
        </main>
    )
}