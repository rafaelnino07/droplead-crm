import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { CLIENT_STAGES, getClientStageLabel } from '@/lib/scp/stages'
import { updateClientStage } from './actions'

export default async function ClientStagePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) notFound()

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!profile) notFound()

    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .single()

    if (!client) notFound()

    return (
        <main className="min-h-screen bg-black p-8 text-white">
            <Link
                href={`/clients/${client.id}`}
                className="text-neutral-400 hover:text-white"
            >
                ← Volver al cliente
            </Link>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <p className="text-neutral-500">Pipeline SCP</p>

                <h1 className="mt-2 text-5xl font-bold">
                    Cambiar etapa
                </h1>

                <p className="mt-3 text-neutral-400">
                    Cliente: {client.name}
                </p>
            </section>

            <form
                action={updateClientStage}
                className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8"
            >
                <input
                    type="hidden"
                    name="clientId"
                    value={client.id}
                />

                <input
                    type="hidden"
                    name="currentStage"
                    value={client.stage}
                />

                <div>
                    <p className="text-sm text-neutral-500">
                        Etapa actual
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                        {getClientStageLabel(client.stage)}
                    </p>
                </div>

                <div className="mt-8">
                    <label className="text-sm text-neutral-400">
                        Nueva etapa
                    </label>

                    <select
                        name="newStage"
                        defaultValue={client.stage}
                        className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                    >
                        {CLIENT_STAGES.map((stage) => (
                            <option
                                key={stage.key}
                                value={stage.key}
                            >
                                {stage.label} — Forecast base {stage.probability}%
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <Link
                        href={`/clients/${client.id}`}
                        className="rounded-lg border border-neutral-700 px-5 py-3 font-semibold text-white hover:bg-neutral-800"
                    >
                        Cancelar
                    </Link>

                    <button
                        type="submit"
                        className="rounded-lg bg-white px-5 py-3 font-semibold text-black"
                    >
                        Guardar etapa
                    </button>
                </div>
            </form>
        </main>
    )
}