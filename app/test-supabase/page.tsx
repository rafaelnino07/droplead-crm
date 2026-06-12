import { getSupabaseServer } from '@/lib/supabase/server'

export default async function TestSupabasePage() {
    const supabase = await getSupabaseServer()

    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(5)

    return (
        <main className="min-h-screen bg-black text-white p-10">
            <h1 className="text-3xl font-bold">Test Supabase</h1>

            {error ? (
                <pre className="mt-6 text-red-400 whitespace-pre-wrap">
                    {JSON.stringify(error, null, 2)}
                </pre>
            ) : (
                <pre className="mt-6 text-green-400 whitespace-pre-wrap">
                    {JSON.stringify(data, null, 2)}
                </pre>
            )}
        </main>
    )
}