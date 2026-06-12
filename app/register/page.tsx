// app/register/page.tsx
import { register } from '../auth/actions'

export default function RegisterPage({
    searchParams,
}: {
    searchParams: { error?: string }
}) {
    return (
        <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
            <form action={register} className="w-full max-w-sm space-y-4 rounded-xl bg-neutral-900 p-6">
                <h1 className="text-2xl font-bold">Crear cuenta</h1>

                {searchParams.error && (
                    <p className="rounded bg-red-500/10 p-3 text-sm text-red-400">
                        {searchParams.error}
                    </p>
                )}

                <input
                    name="email"
                    type="email"
                    placeholder="Correo"
                    required
                    className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <input
                    name="password"
                    type="password"
                    placeholder="Contraseña"
                    required
                    className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />

                <button className="w-full rounded bg-white px-4 py-3 font-semibold text-black">
                    Crear cuenta
                </button>
            </form>
        </main>
    )
}