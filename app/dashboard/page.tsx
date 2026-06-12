import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { logout } from '../auth/actions'

export default async function DashboardPage() {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
      id,
      full_name,
      email,
      role,
      organization_id,
      organizations (
        id,
        name,
        slug,
        plan
      )
    `)
        .eq('user_id', user.id)
        .maybeSingle()

    if (error) {
        console.error('DASHBOARD PROFILE ERROR:', error)
    }

    if (!profile) {
        redirect('/onboarding')
    }

    const organization = Array.isArray(profile.organizations)
        ? profile.organizations[0]
        : profile.organizations

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-neutral-500">Organización actual</p>

                    <h1 className="mt-1 text-3xl font-bold">
                        {organization?.name ?? 'Sin organización'}
                    </h1>

                    <p className="mt-2 text-neutral-400">
                        Usuario: {profile.full_name} · Rol: {profile.role}
                    </p>

                    <p className="mt-1 text-neutral-500">
                        Sesión activa: {user.email}
                    </p>
                </div>

                <form action={logout}>
                    <button className="rounded bg-white px-4 py-2 text-black">
                        Cerrar sesión
                    </button>
                </form>
            </div>

            <section className="mt-10 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                    <p className="text-sm text-neutral-500">Clientes</p>
                    <p className="mt-2 text-3xl font-bold">0</p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                    <p className="text-sm text-neutral-500">Cotizaciones</p>
                    <p className="mt-2 text-3xl font-bold">0</p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                    <p className="text-sm text-neutral-500">Historial</p>
                    <p className="mt-2 text-3xl font-bold">0</p>
                </div>
            </section>
        </main>
    )
}