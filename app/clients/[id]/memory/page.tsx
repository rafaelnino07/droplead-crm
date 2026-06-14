import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { saveCommercialMemory } from './actions'
import { FieldLabel } from './field-label'

export default async function ClientMemoryPage({
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

    const { data: memory } = await supabase
        .from('commercial_memory')
        .select('*')
        .eq('client_id', client.id)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    return (
        <main className="min-h-screen bg-black p-8 text-white">
            <Link
                href={`/clients/${client.id}`}
                className="text-neutral-400 hover:text-white"
            >
                ← Volver al cliente
            </Link>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <p className="text-neutral-500">Memoria Comercial</p>

                <h1 className="mt-2 text-5xl font-bold">
                    {client.name}
                </h1>

                <p className="mt-3 max-w-2xl text-neutral-400">
                    Captura la inteligencia comercial de esta cuenta: contexto,
                    dolores, deseos, objeciones y próximo paso.
                </p>
            </section>

            <form
                action={saveCommercialMemory}
                className="mt-8 space-y-8"
            >
                <input
                    type="hidden"
                    name="clientId"
                    value={client.id}
                />

                <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                    <h2 className="text-2xl font-bold">
                        Perfil comercial
                    </h2>

                    <div className="mt-6 grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm text-neutral-400">
                                Presupuesto estimado
                            </label>
                            <input
                                name="estimated_budget"
                                type="number"
                                defaultValue={memory?.estimated_budget ?? ''}
                                className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                                placeholder="Ej. 250000"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-neutral-400">
                                Probabilidad de cierre (%)
                            </label>
                            <input
                                name="closing_probability"
                                type="number"
                                min="0"
                                max="100"
                                defaultValue={memory?.closing_probability ?? ''}
                                className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                                placeholder="Ej. 70"
                            />
                        </div>

                        <div>
                            <FieldLabel
                                label="Urgencia"
                                tooltip="¿Cuándo necesita el cliente iniciar o terminar el proyecto? Ej: 'Para diciembre', 'Lo antes posible'"
                            />
                            <select
                                name="urgency"
                                defaultValue={memory?.urgency ?? ''}
                                className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                            >
                                <option value="">Seleccionar</option>
                                <option value="Baja">Baja</option>
                                <option value="Media">Media</option>
                                <option value="Alta">Alta</option>
                                <option value="Crítica">Crítica</option>
                            </select>
                        </div>

                        <div>
                            <FieldLabel
                                label="Temperatura"
                                tooltip="¿Qué tan listo está para comprar? Frío=explorando, Tibio=comparando, Caliente=decidido, Muy caliente=urge cerrar"
                            />
                            <select
                                name="temperature"
                                defaultValue={memory?.temperature ?? ''}
                                className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                            >
                                <option value="">Seleccionar</option>
                                <option value="Frío">Frío</option>
                                <option value="Tibio">Tibio</option>
                                <option value="Caliente">Caliente</option>
                                <option value="Muy caliente">Muy caliente</option>
                                <option value="Ganado">Ganado</option>
                                <option value="Perdido">Perdido</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-neutral-400">
                                Tipo de proyecto
                            </label>
                            <input
                                name="project_type"
                                defaultValue={memory?.project_type ?? ''}
                                className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                                placeholder="Ej. Domótica residencial"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-neutral-400">
                                Fuente real del lead
                            </label>
                            <input
                                name="lead_source"
                                defaultValue={memory?.lead_source ?? ''}
                                className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                                placeholder="Ej. Referido, Meta Ads, WhatsApp"
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                    <h2 className="text-2xl font-bold">
                        Resumen ejecutivo
                    </h2>

                    <textarea
                        name="executive_summary"
                        defaultValue={memory?.executive_summary ?? ''}
                        rows={5}
                        className="mt-6 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                        placeholder="Si alguien nuevo entra a esta cuenta, ¿qué necesita saber en 30 segundos?"
                    />
                </section>

                <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                    <h2 className="text-2xl font-bold">
                        Inteligencia comercial
                    </h2>

                    <div className="mt-6 grid grid-cols-2 gap-6">
                        <div>
                            <FieldLabel
                                label="Dolores detectados"
                                tooltip="¿Qué problema le está causando no tener esto resuelto? Ej: 'Pierde tiempo cotizando a mano', 'Sus clientes se van con la competencia'"
                            />
                            <textarea
                                name="pain_points"
                                defaultValue={memory?.pain_points ?? ''}
                                rows={5}
                                className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                                placeholder="Problemas, frustraciones, riesgos o costos de no resolver."
                            />
                        </div>

                        <div>
                            <FieldLabel
                                label="Deseos detectados"
                                tooltip="¿Qué resultado ideal quiere lograr? Ej: 'Automatizar su casa', 'Tener control desde el celular'"
                            />
                            <textarea
                                name="desires"
                                defaultValue={memory?.desires ?? ''}
                                rows={5}
                                className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                                placeholder="Lo que quiere lograr, evitar, mejorar o desbloquear."
                            />
                        </div>

                        <div>
                            <FieldLabel
                                label="Objeciones"
                                tooltip="¿Qué frena su decisión? Ej: 'El precio', 'Necesita consultarlo con su pareja', 'Ya trabajó con alguien que le falló'"
                            />
                            <textarea
                                name="objections"
                                defaultValue={memory?.objections ?? ''}
                                rows={5}
                                className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                                placeholder="Precio, tiempo, confianza, comparación, urgencia, decisión."
                            />
                        </div>

                        <div>
                            <FieldLabel
                                label="Competidores mencionados"
                                tooltip="¿Mencionó otras empresas que está evaluando? Escríbelas aquí"
                            />
                            <textarea
                                name="competitors"
                                defaultValue={memory?.competitors ?? ''}
                                rows={5}
                                className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                                placeholder="Otros proveedores, alternativas o soluciones que está evaluando."
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                    <h2 className="text-2xl font-bold">
                        Próximo paso
                    </h2>

                    <div className="mt-6 grid grid-cols-2 gap-6">
                        <div>
                            <FieldLabel
                                label="Qué sigue"
                                tooltip="¿Qué acordaron hacer después de esta conversación? Ej: 'Enviar cotización el lunes', 'Llamar el jueves'"
                            />
                            <input
                                name="next_step"
                                defaultValue={memory?.next_step ?? ''}
                                className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                                placeholder="Ej. Enviar propuesta ajustada"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-neutral-400">
                                Fecha próximo paso
                            </label>
                            <input
                                name="next_step_date"
                                type="date"
                                defaultValue={memory?.next_step_date ?? ''}
                                className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                            />
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-3">
                    <Link
                        href={`/clients/${client.id}`}
                        className="rounded-lg border border-neutral-700 px-5 py-3 font-semibold text-white hover:bg-neutral-900"
                    >
                        Cancelar
                    </Link>

                    <button
                        type="submit"
                        className="rounded-lg bg-white px-5 py-3 font-semibold text-black"
                    >
                        Guardar memoria
                    </button>
                </div>
            </form>
        </main>
    )
}