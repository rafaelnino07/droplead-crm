import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getClientStageLabel } from '@/lib/scp/stages'
import { cn } from '@/lib/utils'
import { toggleQuickAction, createCustomAction, deleteCustomAction } from './actions'

export default async function QuickActionsSettingsPage() {
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

    const { data: actions } = await supabase
        .from('organization_quick_actions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('sort_order')

    const safeActions = actions ?? []

    const universalActions = safeActions.filter((action) => action.is_universal)
    const libraryActions = safeActions.filter((action) => !action.is_universal && !action.is_custom)
    const customActions = safeActions.filter((action) => action.is_custom)

    return (
        <main className="min-h-screen bg-black p-8 text-white">
            <p className="text-xs uppercase tracking-wider text-neutral-500">Configuración</p>
            <h1 className="mt-1 text-3xl font-bold">Quick Actions</h1>
            <p className="mt-2 text-neutral-400">
                Personaliza las acciones disponibles en el expediente de cada cliente.
            </p>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <h2 className="text-xl font-bold">Acciones universales</h2>

                <div className="mt-4 flex flex-wrap gap-2">
                    {universalActions.map((action) => (
                        <span
                            key={action.id}
                            className="flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-2 text-sm"
                        >
                            {action.emoji} {action.label}
                        </span>
                    ))}
                </div>

                <p className="mt-3 text-sm text-neutral-500">Estas acciones siempre están activas</p>
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <h2 className="text-xl font-bold">Biblioteca de acciones</h2>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {libraryActions.map((action) => (
                        <div
                            key={action.id}
                            className={cn(
                                'rounded-xl border p-4',
                                action.is_active
                                    ? 'border-violet-500/50 bg-violet-500/5'
                                    : 'border-neutral-700 bg-neutral-900 opacity-60'
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{action.emoji}</span>
                                    <span className="font-semibold">{action.label}</span>
                                </div>

                                <form action={toggleQuickAction}>
                                    <input type="hidden" name="action_id" value={action.id} />
                                    <input type="hidden" name="is_active" value={String(action.is_active)} />
                                    <button
                                        type="submit"
                                        aria-label={action.is_active ? 'Desactivar' : 'Activar'}
                                        className={cn(
                                            'relative h-6 w-11 shrink-0 rounded-full transition',
                                            action.is_active ? 'bg-violet-500' : 'bg-neutral-700'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'absolute top-0.5 h-5 w-5 rounded-full bg-white transition',
                                                action.is_active ? 'left-5' : 'left-0.5'
                                            )}
                                        />
                                    </button>
                                </form>
                            </div>

                            {action.scp_stage && (
                                <span className="mt-3 inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                                    → {getClientStageLabel(action.scp_stage)}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <h2 className="text-xl font-bold">Acciones personalizadas</h2>

                {customActions.length > 0 && (
                    <div className="mt-4 space-y-3">
                        {customActions.map((action) => (
                            <div
                                key={action.id}
                                className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3"
                            >
                                <span>
                                    {action.emoji} {action.label}
                                </span>

                                <form action={deleteCustomAction}>
                                    <input type="hidden" name="action_id" value={action.id} />
                                    <button type="submit" className="text-sm text-red-400 hover:text-red-300">
                                        Eliminar
                                    </button>
                                </form>
                            </div>
                        ))}
                    </div>
                )}

                {customActions.length < 2 && (
                    <form action={createCustomAction} className="mt-6 flex items-end gap-3">
                        <div>
                            <label className="text-sm text-neutral-400">Emoji</label>
                            <input
                                name="emoji"
                                maxLength={2}
                                defaultValue="📋"
                                className="mt-2 w-16 rounded-lg border border-neutral-700 bg-black px-3 py-2 text-center text-white"
                            />
                        </div>

                        <div className="flex-1">
                            <label className="text-sm text-neutral-400">Nombre de la acción</label>
                            <input
                                name="label"
                                required
                                maxLength={30}
                                placeholder="Ej. Visita a showroom"
                                className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                            />
                        </div>

                        <button type="submit" className="rounded-lg bg-white px-5 py-3 font-semibold text-black">
                            Agregar
                        </button>
                    </form>
                )}

                <p className="mt-4 text-sm text-neutral-500">
                    Las acciones personalizadas solo registran actividad, sin automatizaciones
                </p>
            </section>
        </main>
    )
}
