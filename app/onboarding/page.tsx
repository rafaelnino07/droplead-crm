import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { completeOnboarding } from '../auth/onboarding-actions'

export default async function OnboardingPage({
    searchParams,
}: {
    searchParams: { error?: string }
}) {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (existingProfile) {
        redirect('/dashboard')
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
            <form
                action={completeOnboarding}
                className="w-full max-w-md space-y-4 rounded-xl bg-neutral-900 p-6"
            >
                <div>
                    <h1 className="text-2xl font-bold">Configura tu CRM</h1>
                    <p className="mt-2 text-sm text-neutral-400">
                        Crea tu organización inicial para empezar a usar Droplead CRM.
                    </p>
                </div>

                {searchParams.error && (
                    <p className="rounded bg-red-500/10 p-3 text-sm text-red-400">
                        {searchParams.error}
                    </p>
                )}

                <input
                    name="full_name"
                    type="text"
                    placeholder="Tu nombre completo"
                    required
                    className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <input
                    name="organization_name"
                    type="text"
                    placeholder="Nombre de tu empresa"
                    required
                    className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <button className="w-full rounded bg-white px-4 py-3 font-semibold text-black">
                    Crear organización
                </button>
            </form>
        </main>
    )
}