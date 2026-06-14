import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { createClient } from '../actions'
import { ClientFields } from './client-fields'

export default async function NewClientPage({
    searchParams,
}: {
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

    const { data: branchesData } = await supabase
        .from('branches')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('name')

    const branches = branchesData ?? []

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <div>
                <Link href="/clients" className="text-sm text-neutral-400">
                    ← Volver a clientes
                </Link>

                <h1 className="mt-4 text-3xl font-bold">Nuevo cliente</h1>
            </div>

            <form
                action={createClient}
                className="mt-8 max-w-xl space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6"
            >
                {searchParams.error && (
                    <p className="rounded bg-red-500/10 p-3 text-sm text-red-400">
                        {searchParams.error}
                    </p>
                )}

                <ClientFields branches={branches} />

                <button className="rounded bg-white px-4 py-3 font-semibold text-black">
                    Guardar cliente
                </button>
            </form>
        </main>
    )
}
